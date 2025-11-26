import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Heart, User, Sparkles, Clock, Flag, Ban } from "lucide-react";
import { CandidateProfile } from "@/components/candidate/CandidateProfile";
import { InteractionHistory } from "@/components/candidate/InteractionHistory";
import { FlagsSection } from "@/components/candidate/FlagsSection";
import { AddInteractionForm } from "@/components/candidate/AddInteractionForm";
import { NoContactMode } from "@/components/candidate/NoContactMode";
import { CompatibilityScore } from "@/components/candidate/CompatibilityScore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;

const CandidateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const initialTab = (location.state as { tab?: string })?.tab;
  const [activeTab, setActiveTab] = useState<string | undefined>(initialTab);

  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);

  const fetchData = async () => {
    try {
      const [candidateRes, interactionsRes] = await Promise.all([
        supabase
          .from("candidates")
          .select("*")
          .eq("id", id!)
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("interactions")
          .select("*")
          .eq("candidate_id", id!)
          .eq("user_id", user!.id)
          .order("interaction_date", { ascending: false }),
      ]);

      if (candidateRes.data) setCandidate(candidateRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
    } catch (error) {
      console.error("Error fetching candidate:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidate = async (updates: Partial<Candidate>) => {
    if (!candidate) return;

    try {
      const { error } = await supabase
        .from("candidates")
        .update(updates)
        .eq("id", candidate.id);

      if (error) throw error;
      setCandidate({ ...candidate, ...updates });
    } catch (error) {
      console.error("Error updating candidate:", error);
    }
  };

  const handleDetectFlags = useCallback(async () => {
    if (!candidate) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-flags`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ candidateId: candidate.id }),
        }
      );

      if (!response.ok) return;

      const flags = await response.json();
      
      setCandidate(prev => prev ? {
        ...prev,
        red_flags: flags.red_flags || [],
        green_flags: flags.green_flags || [],
      } : null);
    } catch (error) {
      console.error("Error detecting flags:", error);
    }
  }, [candidate?.id]);

  const handleRescore = useCallback(async () => {
    if (!candidate) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Run compatibility scoring and flag detection in parallel
      const [compatResponse] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-compatibility`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ candidateId: candidate.id }),
          }
        ),
        handleDetectFlags(),
      ]);

      if (!compatResponse.ok) {
        throw new Error("Failed to recalculate");
      }

      const analysis = await compatResponse.json();
      
      setCandidate(prev => prev ? {
        ...prev,
        compatibility_score: analysis.overall_score,
        score_breakdown: analysis,
        last_score_update: new Date().toISOString(),
      } : null);

      toast.success(`Compatibility updated: ${analysis.overall_score}%`);
    } catch (error) {
      console.error("Error rescoring:", error);
    }
  }, [candidate?.id, handleDetectFlags]);

  const [showAccountabilityDialog, setShowAccountabilityDialog] = useState(false);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Candidate not found</p>
        </div>
      </div>
    );
  }

  // Determine default tab based on no contact status
  const defaultTab = activeTab || (candidate.no_contact_active ? "no-contact" : "overview");

  const handleStartNoContact = () => {
    setActiveTab("no-contact");
  };

  const handleBrokeContact = async () => {
    if (!candidate || !user) return;
    
    // Update candidate to end no contact
    try {
      await supabase
        .from("candidates")
        .update({
          no_contact_active: false,
          status: "texting", // Reset to a reasonable status
        })
        .eq("id", candidate.id);
      
      setCandidate({
        ...candidate,
        no_contact_active: false,
        status: "texting",
      });
      
      toast("No Contact ended. It's okay - healing isn't linear. 💜");
    } catch (error) {
      console.error("Error ending no contact:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="container mx-auto px-4 py-3 max-w-lg flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">{candidate.nickname}</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {candidate.status?.replace("_", " ")}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground"
            onClick={() => setShowAccountabilityDialog(true)}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <AlertDialog open={showAccountabilityDialog} onOpenChange={setShowAccountabilityDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Accountability First</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>Deleting candidates isn't allowed to help you stay accountable to your dating journey.</p>
                  <p>Your history matters — it helps you recognize patterns, learn from experiences, and make better choices.</p>
                  <p className="font-medium text-foreground">You can archive candidates instead to hide them from your active list.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Got it</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <Tabs value={defaultTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-1 text-xs px-2">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1 text-xs px-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="interactions" className="gap-1 text-xs px-2">
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-1 text-xs px-2">
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flags</span>
            </TabsTrigger>
            <TabsTrigger value="no-contact" className={`gap-1 text-xs px-2 ${candidate.no_contact_active ? "text-primary" : ""}`}>
              <Ban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">NC</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <CandidateProfile
              candidate={candidate}
              userId={user!.id}
              onUpdate={handleUpdateCandidate}
              showBasicOnly
            />
          </TabsContent>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <CompatibilityScore
              candidate={candidate}
              onUpdate={(updates) => setCandidate({ ...candidate, ...updates })}
              onStartNoContact={handleStartNoContact}
            />
            <CandidateProfile
              candidate={candidate}
              userId={user!.id}
              onUpdate={handleUpdateCandidate}
              showDetailsOnly
            />
          </TabsContent>

          <TabsContent value="interactions" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <AddInteractionForm
                candidateId={candidate.id}
                onSuccess={fetchData}
                onRescore={handleRescore}
                isNoContact={candidate.no_contact_active || false}
                onBrokeContact={handleBrokeContact}
              />
              <AddInteractionForm
                candidateId={candidate.id}
                onSuccess={fetchData}
                onRescore={handleRescore}
                isNoContact={candidate.no_contact_active || false}
                onBrokeContact={handleBrokeContact}
                defaultType="intimate"
                triggerButton={
                  <Button variant="outline" className="w-full gap-2 border-pink-500/30 text-pink-600 hover:bg-pink-500/10">
                    <Heart className="h-4 w-4" />
                    Log Intimacy
                  </Button>
                }
              />
            </div>
            <InteractionHistory interactions={interactions} />
          </TabsContent>

          <TabsContent value="flags" className="mt-4">
            <FlagsSection
              candidate={candidate}
              onUpdate={handleUpdateCandidate}
            />
          </TabsContent>

          <TabsContent value="no-contact" className="mt-4">
            <NoContactMode
              candidate={candidate}
              onUpdate={handleUpdateCandidate}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CandidateDetail;
