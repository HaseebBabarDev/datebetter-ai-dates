import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CandidateProfile } from "@/components/candidate/CandidateProfile";
import { InteractionHistory } from "@/components/candidate/InteractionHistory";
import { FlagsSection } from "@/components/candidate/FlagsSection";
import { AddInteractionForm } from "@/components/candidate/AddInteractionForm";
import { NoContactMode } from "@/components/candidate/NoContactMode";
import { CompatibilityScore } from "@/components/candidate/CompatibilityScore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;

const CandidateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

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
  const defaultTab = candidate.no_contact_active ? "no-contact" : "profile";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="container mx-auto px-4 py-3 max-w-lg flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">{candidate.nickname}</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {candidate.status?.replace("_", " ")}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="interactions">
              History
            </TabsTrigger>
            <TabsTrigger value="flags">Flags</TabsTrigger>
            <TabsTrigger value="no-contact" className={candidate.no_contact_active ? "text-primary" : ""}>
              NC
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <CompatibilityScore
              candidate={candidate}
              onUpdate={(updates) => setCandidate({ ...candidate, ...updates })}
            />
            <CandidateProfile
              candidate={candidate}
              onUpdate={handleUpdateCandidate}
            />
          </TabsContent>

          <TabsContent value="interactions" className="mt-4 space-y-4">
            <AddInteractionForm
              candidateId={candidate.id}
              onSuccess={fetchData}
            />
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
