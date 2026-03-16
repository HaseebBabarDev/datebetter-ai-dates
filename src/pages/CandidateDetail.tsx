import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { ArrowLeft, Trash2, Heart, User, Sparkles, Clock, Flag, Ban, Home, XCircle, RefreshCw, AlertTriangle, Pencil, HeartOff, Unlink, PartyPopper } from "lucide-react";
import { CandidateProfile } from "@/components/candidate/CandidateProfile";
import { InteractionHistory } from "@/components/candidate/InteractionHistory";
import { FlagsSection } from "@/components/candidate/FlagsSection";
import { AddInteractionForm } from "@/components/candidate/AddInteractionForm";
import { NoContactMode } from "@/components/candidate/NoContactMode";
import { CelibacyTracker } from "@/components/candidate/CelibacyTracker";
import { CompatibilityScore } from "@/components/candidate/CompatibilityScore";
import { ProfileCompleteness } from "@/components/candidate/ProfileCompleteness";
import { HoroscopeCompatibility } from "@/components/candidate/HoroscopeCompatibility";
import { AppRatingDialog, shouldShowRatingDialog } from "@/components/candidate/AppRatingDialog";
import { SuccessfulRelationshipCTA, checkSuccessfulRelationship } from "@/components/candidate/SuccessfulRelationshipCTA";
import { DetachmentPlanInsight } from "@/components/candidate/DetachmentPlanInsight";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpgradeNudge } from "@/components/subscription/UpgradeNudge";
import { useSubscription } from "@/hooks/useSubscription";
import { useTour, CANDIDATE_DETAIL_TOUR_STEPS, TourRestartButton } from "@/components/tour";
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
import { AIDisclosure } from "@/components/AIDisclosure";
import { TextSimulatorCTA } from "@/components/candidate/TextSimulator";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;
type DeviMessage = Tables<"devi_messages">;

interface ScoreBreakdown {
  advice?: string;
}

// Love bombing detection phrases
const LOVE_BOMBING_PHRASES = [
  "too good to be true", "already said i love you", "wants to move in", 
  "moving too fast", "constant texting", "showering with gifts", 
  "overwhelming affection", "soulmate", "never felt this way",
  "we're meant to be", "perfect match", "future faking",
  // Over-promising / actions don't match words
  "promised but", "says but doesn't", "said but didn't", "all talk", 
  "empty promises", "keeps promising", "never follows through", "talks big",
  "can't afford", "couldn't afford", "no money for", "broke but",
  "overpromising", "over promising", "too soon", "way too fast",
  "only been", "just met", "barely know", "week and already",
  "days and already", "planning our future", "talking about marriage",
  "talking about kids", "talking about moving", "words don't match"
];

const CandidateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { startTour, hasCompletedTour } = useTour();
  const { getRemainingUpdates, subscription } = useSubscription();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [deviMessages, setDeviMessages] = useState<DeviMessage[]>([]);
  const [userProfile, setUserProfile] = useState<{ schedule_flexibility?: string | null }>({});
  const [loading, setLoading] = useState(true);
  const [hasPendingAdvice, setHasPendingAdvice] = useState(false);
  const [successfulRelationship, setSuccessfulRelationship] = useState<{ show: boolean; interactionDays: number }>({ show: false, interactionDays: 0 });
  const initialTab = (location.state as { tab?: string })?.tab;
  const prefillNotes = (location.state as { prefillNotes?: string })?.prefillNotes || "";
  const [activeTab, setActiveTab] = useState<string | undefined>(initialTab);

  // Sync tab state when navigating to this page with a different tab in location state
  useEffect(() => {
    const tabFromState = (location.state as { tab?: string })?.tab;
    if (tabFromState && tabFromState !== activeTab) {
      setActiveTab(tabFromState);
    }
  }, [location.state]);
  // Clean up any stale scroll locks on mount/unmount and tab changes
  useEffect(() => {
    const cleanupScrollLocks = () => {
      document.body.removeAttribute('data-scroll-locked');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    };
    
    cleanupScrollLocks();
    
    // Also clean up on any tab change
    const observer = new MutationObserver(() => {
      if (document.body.hasAttribute('data-scroll-locked')) {
        // If scroll is locked but no dialogs are open, clean it up
        const openDialogs = document.querySelectorAll('[role="dialog"]');
        if (openDialogs.length === 0) {
          cleanupScrollLocks();
        }
      }
    });
    
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked', 'style'] });
    
    return () => {
      observer.disconnect();
      cleanupScrollLocks();
    };
  }, [activeTab]);
  const loveBombingAlert = useMemo(() => {
    if (!candidate || !interactions) return null;
    
    // Check candidate notes for love bombing language
    const candidateNotes = (candidate.notes || "").toLowerCase();
    const hasLoveBombingInCandidateNotes = LOVE_BOMBING_PHRASES.some(phrase => candidateNotes.includes(phrase));
    
    if (hasLoveBombingInCandidateNotes) {
      return { reason: "Love bombing signs in notes" };
    }
    
    // Check interaction notes
    const notesText = interactions.map(i => (i.notes || "").toLowerCase()).join(" ");
    const hasLoveBombingLanguage = LOVE_BOMBING_PHRASES.some(phrase => notesText.includes(phrase));
    
    if (hasLoveBombingLanguage) {
      return { reason: "Love bombing language detected" };
    }
    
    // Check for rapid escalation (e.g., 5+ interactions in first 2 weeks)
    if (interactions.length >= 5 && candidate.first_contact_date) {
      const firstContact = new Date(candidate.first_contact_date);
      const twoWeeksLater = new Date(firstContact.getTime() + 14 * 24 * 60 * 60 * 1000);
      const earlyInteractions = interactions.filter(i => 
        i.interaction_date && new Date(i.interaction_date) <= twoWeeksLater
      );
      if (earlyInteractions.length >= 5) {
        return { reason: "Rapid escalation pattern detected" };
      }
    }
    
    return null;
  }, [candidate, interactions]);
  

  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);

  const fetchData = async () => {
    console.log("Fetching candidate data for id:", id, "user:", user?.id);
    try {
      // Fetch all primary data in parallel
      const [candidateRes, interactionsRes, profileRes, conversationsRes] = await Promise.all([
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
        supabase
          .from("devi_conversations")
          .select("id")
          .eq("candidate_id", id!)
          .eq("user_id", user!.id),
      ]);

      console.log("Candidate response:", candidateRes);
      console.log("Interactions response:", interactionsRes);

      if (candidateRes.data) {
        setCandidate(candidateRes.data);
        
        // Check pending advice inline (no extra query needed)
        const scoreData = candidateRes.data.score_breakdown as unknown as ScoreBreakdown;
        if (scoreData?.advice) {
          const { data: adviceData } = await supabase
            .from("advice_tracking")
            .select("id")
            .eq("candidate_id", id!)
            .eq("advice_text", scoreData.advice)
            .maybeSingle();
          setHasPendingAdvice(!adviceData);
        } else {
          setHasPendingAdvice(false);
        }
        
        // Check successful relationship inline
        const result = await checkSuccessfulRelationship(
          id!,
          user!.id,
          candidateRes.data.compatibility_score ?? null
        );
        setSuccessfulRelationship(result);
      }
      
      if (interactionsRes.data) setInteractions(interactionsRes.data);
      if (profileRes.data) setUserProfile(profileRes.data);

      // Fetch D.E.V.I. messages if conversations exist
      if (conversationsRes.data && conversationsRes.data.length > 0) {
        const conversationIds = conversationsRes.data.map(c => c.id);
        const { data: messages } = await supabase
          .from("devi_messages")
          .select("*")
          .in("conversation_id", conversationIds)
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (messages) setDeviMessages(messages);
      }
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
      // Refresh session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        console.log("Session expired or invalid, skipping flag detection");
        return;
      }

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

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log("Unauthorized - session may have expired");
          return;
        }
        return;
      }

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
      // Run compatibility scoring and flag detection in parallel
      const [compatResult] = await Promise.all([
        supabase.functions.invoke("calculate-compatibility", {
          body: { candidateId: candidate.id },
        }),
        handleDetectFlags(),
      ]);

      if (compatResult.error) {
        if (compatResult.error.message?.includes("Unauthorized")) {
          toast.error("Session expired. Please log in again.");
          return;
        }
        throw new Error("Failed to recalculate");
      }

      const analysis = compatResult.data;
      
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

  // Prevent new-candidate dialogs from reopening due to persistent router state
  const hasHandledNewCandidateFlowRef = useRef(false);
  
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

    if (!state?.isNewCandidate || !candidate) return;
    if (hasHandledNewCandidateFlowRef.current) return;
    hasHandledNewCandidateFlowRef.current = true;

    const completeness = calculateProfileCompleteness(candidate);
    // Only show dialog if profile is incomplete (less than 80%)
    if (completeness < 80) {
      setShowNewCandidateDialog(true);
      setIsFirstCandidate(!!state?.isFirstCandidate);
    }

    // Clear router state so it doesn't retrigger on re-renders / refetches
    navigate(location.pathname, { replace: true, state: null });

    // Refetch after a short delay to get the calculated score
    setTimeout(() => {
      fetchData();
    }, 1500);
  }, [location.state, candidate, navigate, location.pathname]);

  // Start the tour only if not showing new candidate dialog
  useEffect(() => {
    // Don't start tour if new candidate dialog is showing or will show
    if (!loading && candidate && !hasCompletedTour("candidate-detail") && !showNewCandidateDialog) {
      // Check if this is a new candidate that will show the welcome dialog
      const state = location.state as { isNewCandidate?: boolean } | null;
      const isNewCandidateFlow = state?.isNewCandidate && !hasHandledNewCandidateFlowRef.current;
      const completeness = calculateProfileCompleteness(candidate);
      const willShowNewCandidateDialog = isNewCandidateFlow && completeness < 80;
      
      if (!willShowNewCandidateDialog) {
        const timer = setTimeout(() => {
          startTour("candidate-detail", CANDIDATE_DETAIL_TOUR_STEPS);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, candidate, startTour, hasCompletedTour, showNewCandidateDialog, location.state]);

  // Handle showing rating dialog after new candidate dialog closes
  // Only show if user has 3+ interactions and a score has been generated
  const handleNewCandidateDialogClose = (open: boolean) => {
    setShowNewCandidateDialog(open);
    if (!open && isFirstCandidate) {
      const totalInteractions = interactions?.length || 0;
      const hasScoreGenerated = typeof candidate?.compatibility_score === "number";
      
      if (shouldShowRatingDialog(totalInteractions, hasScoreGenerated)) {
        // Small delay before showing rating dialog
        setTimeout(() => {
          setShowRatingDialog(true);
        }, 500);
      }
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

  // Handler for when an interaction is logged - fetches data and switches to insights tab
  // Also checks if we should show the rating dialog (after 3+ interactions with score)
  const handleInteractionLogged = async () => {
    await fetchData();
    setActiveTab("profile"); // Switch to insights tab after logging
    
    // Check if we should show rating dialog after this interaction
    // Need to add 1 to current count since fetchData might not have updated yet
    const newInteractionCount = (interactions?.length || 0) + 1;
    const hasScoreGenerated = typeof candidate?.compatibility_score === "number";
    
    if (newInteractionCount >= 3 && hasScoreGenerated && shouldShowRatingDialog(newInteractionCount, hasScoreGenerated)) {
      // Small delay to let the UI settle
      setTimeout(() => {
        setShowRatingDialog(true);
      }, 1500);
    }
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
      
      // Auto-add to past relationships in profile preferences
      try {
        // Calculate duration based on first_contact_date
        let durationValue = "less_than_3_months";
        if (candidate.first_contact_date) {
          const startDate = new Date(candidate.first_contact_date);
          const endDate = new Date();
          const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
            (endDate.getMonth() - startDate.getMonth());
          
          if (monthsDiff < 3) durationValue = "less_than_3_months";
          else if (monthsDiff < 6) durationValue = "3_to_6_months";
          else if (monthsDiff < 12) durationValue = "6_months_to_1_year";
          else if (monthsDiff < 24) durationValue = "1_to_2_years";
          else if (monthsDiff < 60) durationValue = "2_to_5_years";
          else durationValue = "5_plus_years";
        }

        // Map end reason to past relationship format
        const endReasonMap: Record<string, string> = {
          "Lost interest": "i_ended",
          "They ended it": "they_ended",
          "Incompatible": "grew_apart",
          "Red flags": "other",
          "Met someone else": "i_ended",
          "Not ready to date": "i_ended",
          "Distance/logistics": "long_distance",
          "Ghosted": "ghosted",
          "Mutual decision": "mutual",
          "Other": "other",
          "No Contact": "other",
        };
        const mappedEndReason = endReason ? (endReasonMap[endReason] || "other") : "other";

        // Detect traumas from red flags
        const detectedTraumas: string[] = [];
        const redFlags = Array.isArray(candidate.red_flags) ? candidate.red_flags as string[] : [];
        const flagToTrauma: Record<string, string> = {
          "Love bombing": "Love bombing then withdrawal",
          "Gaslighting": "Gaslighting/manipulation",
          "Controlling": "Controlling behavior",
          "Manipulation": "Gaslighting/manipulation",
          "Ghosting": "Ghosting/abandonment",
          "Disrespectful": "Verbal abuse",
          "Jealousy": "Jealousy/possessiveness",
          "Dishonesty": "Dishonesty",
          "Financial red flags": "Financial abuse",
        };
        redFlags.forEach(flag => {
          const trauma = flagToTrauma[flag];
          if (trauma && !detectedTraumas.includes(trauma)) {
            detectedTraumas.push(trauma);
          }
        });
        if (endReason === "Ghosted" && !detectedTraumas.includes("Ghosting/abandonment")) {
          detectedTraumas.push("Ghosting/abandonment");
        }

        // Fetch current past relationships
        const { data: profileData } = await supabase
          .from("profiles")
          .select("past_relationship_traumas")
          .eq("user_id", user.id)
          .maybeSingle();

        const currentRelationships = Array.isArray(profileData?.past_relationship_traumas) 
          ? profileData.past_relationship_traumas 
          : [];

        // Create new past relationship entry
        const newRelationship = {
          id: Date.now().toString(),
          label: candidate.nickname,
          duration: durationValue,
          traumas: detectedTraumas.length > 0 ? detectedTraumas : ["None of these apply"],
          notes: candidate.notes || "",
          endReason: mappedEndReason,
        };

        // Update profile with new past relationship
        await supabase
          .from("profiles")
          .update({
            past_relationship_traumas: [...currentRelationships, newRelationship],
          })
          .eq("user_id", user.id);

      } catch (profileError) {
        console.error("Error adding to past relationships:", profileError);
        // Don't fail the main operation if profile update fails
      }
      
      setCandidate({ ...candidate, ...updates });
      setShowEndRelationshipDialog(false);
      setEndReason("");
      toast.success(`Relationship with ${candidate.nickname} ended and added to your history. Take care of yourself. 💜`);
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
    <div
      className="h-[100dvh] bg-background overflow-auto pb-24"
      style={{ overscrollBehavior: "contain" }}
    >
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="container mx-auto px-4 py-3 max-w-lg flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-semibold text-foreground">{candidate.nickname}</h1>
              {(candidate as any).zodiac_sign && (
                <span className="text-base" title={(candidate as any).zodiac_sign}>
                  {({
                    aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋",
                    leo: "♌", virgo: "♍", libra: "♎", scorpio: "♏",
                    sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓"
                  } as Record<string, string>)[(candidate as any).zodiac_sign] || ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground capitalize">
                {candidate.status?.replace("_", " ")}
              </p>
              {loveBombingAlert && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-600 border-orange-300 gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Love bombing?
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{loveBombingAlert.reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TourRestartButton tourId="candidate-detail" tourSteps={CANDIDATE_DETAIL_TOUR_STEPS} />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary"
              onClick={() => navigate(`/add-candidate?edit=${candidate.id}`)}
              title="Edit candidate info"
            >
              <Pencil className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground"
              onClick={() => setShowAccountabilityDialog(true)}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
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
                >
                  Got It
                </AlertDialogAction>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => {
                    setShowNewCandidateDialog(false);
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

        {/* Successful Relationship CTA */}
        {successfulRelationship.show && candidate.compatibility_score && candidate.status !== "archived" && (
          <SuccessfulRelationshipCTA
            candidateId={candidate.id}
            candidateName={candidate.nickname}
            compatibilityScore={candidate.compatibility_score}
            interactionDays={successfulRelationship.interactionDays}
            onAcknowledged={() => setSuccessfulRelationship({ show: false, interactionDays: 0 })}
          />
        )}

        {/* Active relationship actions */}
        {!candidate.no_contact_active && candidate.status !== "archived" && (
          <div className="space-y-2">
            <UpgradeNudge candidateId={candidate.id} />
            <div data-tour="quick-log">
              <AddInteractionForm
                candidateId={candidate.id}
                onSuccess={handleInteractionLogged}
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
              data-tour="ask-devi-cta"
              variant="outline" 
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate("/devi", { state: { candidateName: candidate.nickname, candidateId: candidate.id } })}
            >
              <Sparkles className="w-4 h-4" />
              Ask D.E.V.I.
            </Button>
            <TextSimulatorCTA
              variant="card"
              candidateName={candidate.nickname}
              candidateId={candidate.id}
              candidateContext={[
                candidate.notes,
                candidate.end_reason ? `Ended because: ${candidate.end_reason}` : null,
                candidate.status ? `Status: ${candidate.status}` : null,
                candidate.their_attachment_style ? `Attachment: ${candidate.their_attachment_style}` : null,
              ].filter(Boolean).join(". ")}
            />
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
          <TabsList className="grid w-full grid-cols-6 h-auto p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger data-tour="insights-tab" value="profile" className="flex-col gap-0.5 py-2 px-0.5">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[9px] font-medium">Insights</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[180px]">
                <p className="text-xs">Compatibility score & AI-powered advice</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger data-tour="overview-tab" value="overview" className="flex-col gap-0.5 py-2 px-0.5">
                  <User className="w-4 h-4" />
                  <span className="text-[9px] font-medium">Overview</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[180px]">
                <p className="text-xs">Their profile details & your notes</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger data-tour="history-tab" value="interactions" className="flex-col gap-0.5 py-2 px-0.5">
                  <Clock className="w-4 h-4" />
                  <span className="text-[9px] font-medium">History</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[180px]">
                <p className="text-xs">Timeline of all your dates & interactions</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger data-tour="flags-tab" value="flags" className="flex-col gap-0.5 py-2 px-0.5">
                  <Flag className="w-4 h-4" />
                  <span className="text-[9px] font-medium">Flags</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[180px]">
                <p className="text-xs">AI-detected red & green flags</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger data-tour="nc-tab" value="no-contact" className={`flex-col gap-0.5 py-2 px-0.5 ${candidate.no_contact_active ? "text-primary" : ""}`}>
                  <Ban className="w-4 h-4" />
                  <span className="text-[9px] font-medium">NC</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[180px]">
                <p className="text-xs">No Contact mode for healing & moving on</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="celibacy" className="flex-col gap-0.5 py-2 px-0.5">
                  <HeartOff className="w-4 h-4" />
                  <span className="text-[9px] font-medium">Celibacy</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[180px]">
                <p className="text-xs">Track your celibacy journey & milestones</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <ProfileCompleteness candidate={candidate} />
            <CompatibilityScore
              candidate={candidate}
              onUpdate={(updates) => setCandidate({ ...candidate, ...updates })}
              onStartNoContact={handleStartNoContact}
              onAdviceResponded={fetchData}
              userSchedule={userProfile.schedule_flexibility}
            />
            {/* Horoscope Compatibility - Entertainment Only Section */}
            <HoroscopeCompatibility
              candidateId={candidate.id}
              candidateNickname={candidate.nickname}
              candidateZodiacSign={(candidate as any).zodiac_sign}
            />

            {/* Detachment Plan CTA / Progress */}
            <DetachmentPlanInsight candidateId={candidate.id} onNavigate={() => navigate(`/detachment-plan/${candidate.id}`)} />
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
                onSuccess={handleInteractionLogged}
                onRescore={handleRescore}
                isNoContact={candidate.no_contact_active || false}
                onBrokeContact={handleBrokeContact}
                hasPendingAdvice={hasPendingAdvice}
                prefillNotes={prefillNotes}
                autoOpen={!!prefillNotes}
                triggerButton={
                  <Button className="w-full gap-2">
                    <Clock className="h-4 w-4" />
                    Log Interaction
                  </Button>
                }
              />
              <AddInteractionForm
                candidateId={candidate.id}
                onSuccess={handleInteractionLogged}
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
            <InteractionHistory interactions={interactions} deviMessages={deviMessages} />
          </TabsContent>

          <TabsContent value="flags" className="mt-4 space-y-4">
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

          <TabsContent value="celibacy" className="mt-4">
            <CelibacyTracker
              candidateId={candidate.id}
              candidateName={candidate.nickname}
            />
          </TabsContent>
        </Tabs>

        {/* AI Disclosure - at bottom for App Store compliance */}
        <div className="mt-8 pb-4">
          <AIDisclosure variant="compact" className="justify-center" />
        </div>
      </main>
    </div>
  );
};

export default CandidateDetail;
