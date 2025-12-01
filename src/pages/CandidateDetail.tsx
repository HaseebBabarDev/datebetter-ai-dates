import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Trash2, Heart, User, Sparkles, Clock, Flag, Ban, Home, XCircle, RefreshCw } from "lucide-react";
import { CandidateProfile } from "@/components/candidate/CandidateProfile";
import { InteractionHistory } from "@/components/candidate/InteractionHistory";
import { FlagsSection } from "@/components/candidate/FlagsSection";
import { AddInteractionForm } from "@/components/candidate/AddInteractionForm";
import { NoContactMode } from "@/components/candidate/NoContactMode";
import { CompatibilityScore } from "@/components/candidate/CompatibilityScore";
import { ProfileCompleteness } from "@/components/candidate/ProfileCompleteness";
import { AppRatingDialog, shouldShowRatingDialog } from "@/components/candidate/AppRatingDialog";
import { ScheduleCompatibilityAlert } from "@/components/candidate/ScheduleCompatibilityAlert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpgradeNudge } from "@/components/subscription/UpgradeNudge";
import { useSubscription } from "@/hooks/useSubscription";
import { useTour, CANDIDATE_DETAIL_TOUR_STEPS } from "@/components/tour";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Edit, Info } from "lucide-react";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;

interface ScoreBreakdown {
  advice?: string;
}

const CandidateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { startTour, hasCompletedTour } = useTour();
  const { getRemainingUpdates, subscription } = useSubscription();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [userProfile, setUserProfile] = useState<{ schedule_flexibility?: string | null }>({});
  const [loading, setLoading] = useState(true);
  const [hasPendingAdvice, setHasPendingAdvice] = useState(false);
  const initialTab = (location.state as { tab?: string })?.tab;
  const [activeTab, setActiveTab] = useState<string | undefined>(initialTab);

  // Start tour for new users on candidate detail
  useEffect(() => {
    if (!loading && candidate && !hasCompletedTour("candidate-detail")) {
      const timer = setTimeout(() => {
        startTour("candidate-detail", CANDIDATE_DETAIL_TOUR_STEPS);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, candidate, startTour, hasCompletedTour]);

  useEffect(() => {
    if (user && id) {
      fetchData();
      checkPendingAdvice();
    }
  }, [user, id]);

  const checkPendingAdvice = async () => {
    if (!user || !id) return;
    
    // First get the candidate to check if there's advice
    const { data: candidateData } = await supabase
      .from("candidates")
      .select("score_breakdown")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (!candidateData?.score_breakdown) {
      setHasPendingAdvice(false);
      return;
    }
    
    const scoreData = candidateData.score_breakdown as unknown as ScoreBreakdown;
    if (!scoreData?.advice) {
      setHasPendingAdvice(false);
      return;
    }
    
    // Check if advice has been responded to
    const { data: adviceData } = await supabase
      .from("advice_tracking")
      .select("id")
      .eq("candidate_id", id)
      .eq("advice_text", scoreData.advice)
      .maybeSingle();
    
    setHasPendingAdvice(!adviceData);
  };

  const fetchData = async () => {
    try {
      const [candidateRes, interactionsRes, profileRes] = await Promise.all([
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
        supabase
          .from("profiles")
          .select("schedule_flexibility")
          .eq("user_id", user!.id)
          .single(),
      ]);

      if (candidateRes.data) setCandidate(candidateRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
      if (profileRes.data) setUserProfile(profileRes.data);
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
  const [showNewCandidateDialog, setShowNewCandidateDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [isFirstCandidate, setIsFirstCandidate] = useState(false);
  const [showEndRelationshipDialog, setShowEndRelationshipDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [endReason, setEndReason] = useState("");
  const [endingRelationship, setEndingRelationship] = useState(false);
  
  // Calculate profile completeness
  const calculateProfileCompleteness = (c: Candidate) => {
    const PROFILE_FIELDS = [
      { key: "age", weight: 2 },
      { key: "gender_identity", weight: 1 },
      { key: "pronouns", weight: 1 },
      { key: "height", weight: 1 },
      { key: "country", weight: 1 },
      { key: "city", weight: 1 },
      { key: "distance_approximation", weight: 1 },
      { key: "their_schedule_flexibility", weight: 1 },
      { key: "their_religion", weight: 2 },
      { key: "their_politics", weight: 2 },
      { key: "their_relationship_status", weight: 2 },
      { key: "their_relationship_goal", weight: 2 },
      { key: "their_kids_desire", weight: 2 },
      { key: "their_kids_status", weight: 1 },
      { key: "their_attachment_style", weight: 2 },
      { key: "their_career_stage", weight: 1 },
      { key: "their_education_level", weight: 1 },
      { key: "their_social_style", weight: 1 },
      { key: "their_drinking", weight: 1 },
      { key: "their_smoking", weight: 1 },
      { key: "their_exercise", weight: 1 },
    ];
    let filledWeight = 0;
    let totalWeight = 0;
    PROFILE_FIELDS.forEach(field => {
      totalWeight += field.weight;
      const value = (c as any)[field.key];
      if (value !== null && value !== undefined && value !== "") {
        filledWeight += field.weight;
      }
    });
    return Math.round((filledWeight / totalWeight) * 100);
  };
  
  // Check if this is a new candidate from navigation state
  useEffect(() => {
    const state = location.state as { isNewCandidate?: boolean; isFirstCandidate?: boolean } | null;
    if (state?.isNewCandidate && candidate) {
      const completeness = calculateProfileCompleteness(candidate);
      // Only show dialog if profile is incomplete (less than 80%)
      if (completeness < 80) {
        setShowNewCandidateDialog(true);
        setIsFirstCandidate(state?.isFirstCandidate || false);
      }
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
      // Refetch after a short delay to get the calculated score
      setTimeout(() => {
        fetchData();
      }, 1500);
    }
  }, [location.state, candidate]);

  // Handle showing rating dialog after new candidate dialog closes
  const handleNewCandidateDialogClose = (open: boolean) => {
    setShowNewCandidateDialog(open);
    if (!open && isFirstCandidate && shouldShowRatingDialog()) {
      // Small delay before showing rating dialog
      setTimeout(() => {
        setShowRatingDialog(true);
      }, 500);
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
  const defaultTab = activeTab || (candidate.no_contact_active ? "no-contact" : "profile");

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

  const handleEndRelationship = async () => {
    if (!candidate || !user) return;
    
    setEndingRelationship(true);
    try {
      const updates = {
        status: "archived" as const,
        relationship_ended_at: new Date().toISOString(),
        end_reason: endReason || null,
        no_contact_active: false,
      };
      
      const { error } = await supabase
        .from("candidates")
        .update(updates)
        .eq("id", candidate.id);
      
      if (error) throw error;
      
      setCandidate({ ...candidate, ...updates });
      setShowEndRelationshipDialog(false);
      setEndReason("");
      toast.success(`Relationship with ${candidate.nickname} ended. Take care of yourself. 💜`);
    } catch (error) {
      console.error("Error ending relationship:", error);
      toast.error("Failed to end relationship");
    } finally {
      setEndingRelationship(false);
    }
  };

  const handleReopenRelationship = async () => {
    if (!candidate || !user) return;
    
    try {
      const updates = {
        status: "texting" as const,
        relationship_ended_at: null,
        end_reason: null,
      };
      
      const { error } = await supabase
        .from("candidates")
        .update(updates)
        .eq("id", candidate.id);
      
      if (error) throw error;
      
      setCandidate({ ...candidate, ...updates });
      setShowReopenDialog(false);
      toast.success(`Reopened connection with ${candidate.nickname}!`);
    } catch (error) {
      console.error("Error reopening relationship:", error);
      toast.error("Failed to reopen relationship");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="container mx-auto px-4 py-3 max-w-lg flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <Home className="w-5 h-5" />
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
          
          {/* New Candidate Welcome Dialog */}
          <AlertDialog open={showNewCandidateDialog} onOpenChange={handleNewCandidateDialogClose}>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <AlertDialogTitle className="text-lg">
                    {candidate.nickname} Added!
                  </AlertDialogTitle>
                </div>
                <AlertDialogDescription className="space-y-3 text-left">
                  <p className="text-base">
                    We've calculated an initial compatibility score of{" "}
                    <span className="font-semibold text-primary">
                      {candidate.compatibility_score ?? "..."}%
                    </span>
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Update their profile for better results.</span>{" "}
                        It's okay if you don't know everything yet — just add what you know!
                      </p>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogAction 
                  className="w-full sm:w-auto"
                  onClick={() => handleNewCandidateDialogClose(false)}
                >
                  Got It
                </AlertDialogAction>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => {
                    handleNewCandidateDialogClose(false);
                    navigate(`/add-candidate?edit=${candidate.id}`);
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Add More Info
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* App Rating Dialog */}
          <AppRatingDialog 
            open={showRatingDialog} 
            onOpenChange={setShowRatingDialog} 
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Archived/Ended Relationship Banner */}
        {candidate.status === "archived" && (
          <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Relationship Ended</span>
            </div>
            {(candidate as any).relationship_ended_at && (
              <p className="text-sm text-muted-foreground">
                Ended on {new Date((candidate as any).relationship_ended_at).toLocaleDateString()}
                {(candidate as any).end_reason && ` — ${(candidate as any).end_reason}`}
              </p>
            )}
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => setShowReopenDialog(true)}
            >
              <RefreshCw className="w-4 h-4" />
              Reopen Relationship
            </Button>
          </div>
        )}

        {/* Active relationship actions */}
        {!candidate.no_contact_active && candidate.status !== "archived" && (
          <div className="space-y-2">
            <UpgradeNudge candidateId={candidate.id} />
            {subscription && getRemainingUpdates(candidate.id) > 0 && (
              <div className="flex justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs cursor-help">
                        {getRemainingUpdates(candidate.id)} update{getRemainingUpdates(candidate.id) !== 1 ? 's' : ''} remaining
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Analyze also counts toward updates</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            <div data-tour="quick-log">
              <AddInteractionForm
                candidateId={candidate.id}
                onSuccess={() => { fetchData(); checkPendingAdvice(); }}
                onRescore={handleRescore}
                isNoContact={candidate.no_contact_active || false}
                onBrokeContact={handleBrokeContact}
                hasPendingAdvice={hasPendingAdvice}
                triggerButton={
                  <Button className="w-full gap-2">
                    <Clock className="h-4 w-4" />
                    Log Interaction
                  </Button>
                }
              />
            </div>
            <Button 
              variant="ghost" 
              className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowEndRelationshipDialog(true)}
            >
              <XCircle className="w-4 h-4" />
              End Relationship
            </Button>
          </div>
        )}

        {/* End Relationship Dialog */}
        <AlertDialog open={showEndRelationshipDialog} onOpenChange={setShowEndRelationshipDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                End Relationship with {candidate.nickname}?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>This will archive {candidate.nickname} and track when and why it ended. You can always reopen it later.</p>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Reason (optional)</label>
                  <select 
                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                    value={endReason}
                    onChange={(e) => setEndReason(e.target.value)}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Lost interest">Lost interest</option>
                    <option value="They ended it">They ended it</option>
                    <option value="Incompatible">Incompatible</option>
                    <option value="Red flags">Red flags</option>
                    <option value="Met someone else">Met someone else</option>
                    <option value="Not ready to date">Not ready to date</option>
                    <option value="Distance/logistics">Distance/logistics</option>
                    <option value="Ghosted">Ghosted</option>
                    <option value="Mutual decision">Mutual decision</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleEndRelationship}
                disabled={endingRelationship}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {endingRelationship ? "Ending..." : "End Relationship"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reopen Relationship Dialog */}
        <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Reopen Relationship with {candidate.nickname}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will move {candidate.nickname} back to your active candidates. Their history and data will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReopenRelationship}>
                Reopen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Tabs value={defaultTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            <TabsTrigger data-tour="insights-tab" value="profile" className="flex-col gap-0.5 py-2 px-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-medium">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex-col gap-0.5 py-2 px-1">
              <User className="w-4 h-4" />
              <span className="text-[10px] font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger data-tour="history-tab" value="interactions" className="flex-col gap-0.5 py-2 px-1">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-medium">History</span>
            </TabsTrigger>
            <TabsTrigger data-tour="flags-tab" value="flags" className="flex-col gap-0.5 py-2 px-1">
              <Flag className="w-4 h-4" />
              <span className="text-[10px] font-medium">Flags</span>
            </TabsTrigger>
            <TabsTrigger data-tour="nc-tab" value="no-contact" className={`flex-col gap-0.5 py-2 px-1 ${candidate.no_contact_active ? "text-primary" : ""}`}>
              <Ban className="w-4 h-4" />
              <span className="text-[10px] font-medium">NC</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <ScheduleCompatibilityAlert
              userSchedule={userProfile.schedule_flexibility}
              candidateSchedule={(candidate as any).their_schedule_flexibility}
              variant="full"
            />
            <CompatibilityScore
              candidate={candidate}
              onUpdate={(updates) => setCandidate({ ...candidate, ...updates })}
              onStartNoContact={handleStartNoContact}
              onAdviceResponded={checkPendingAdvice}
            />
            <ProfileCompleteness candidate={candidate} />
            <CandidateProfile
              candidate={candidate}
              userId={user!.id}
              onUpdate={handleUpdateCandidate}
              showDetailsOnly
            />
          </TabsContent>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <CandidateProfile
              candidate={candidate}
              userId={user!.id}
              onUpdate={handleUpdateCandidate}
              showBasicOnly
            />
          </TabsContent>

          <TabsContent value="interactions" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <AddInteractionForm
                candidateId={candidate.id}
                onSuccess={() => { fetchData(); checkPendingAdvice(); }}
                onRescore={handleRescore}
                isNoContact={candidate.no_contact_active || false}
                onBrokeContact={handleBrokeContact}
                hasPendingAdvice={hasPendingAdvice}
                triggerButton={
                  <Button className="w-full gap-2">
                    <Clock className="h-4 w-4" />
                    Log Interaction
                  </Button>
                }
              />
              <AddInteractionForm
                candidateId={candidate.id}
                onSuccess={() => { fetchData(); checkPendingAdvice(); }}
                onRescore={handleRescore}
                isNoContact={candidate.no_contact_active || false}
                onBrokeContact={handleBrokeContact}
                hasPendingAdvice={hasPendingAdvice}
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
