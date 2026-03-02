import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus,
  Settings,
  TrendingUp,
  Heart,
  AlertTriangle,
  Sparkles,
  Droplet,
  Flame,
  ThumbsUp,
  Ban,
  ThumbsDown,
  Minus,
  Users,
  ChevronRight,
  Calendar,
  List,
  Clock,
  Bell,
  XCircle,
  X,
  RefreshCw,
  Lightbulb,
  ChevronDown,
  ClipboardList,
  Reply,
  Send,
  Loader2,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CandidateSearch } from "@/components/dashboard/CandidateSearch";
import { CandidateFilters, SortOption, StatusFilter } from "@/components/dashboard/CandidateFilters";
import { QuickCandidateSelect } from "@/components/dashboard/QuickCandidateSelect";
import { CandidatesList } from "@/components/dashboard/CandidatesList";
import { LogInteractionDialog } from "@/components/dashboard/LogInteractionDialog";
import { useTour, DASHBOARD_TOUR_STEPS, TourRestartButton } from "@/components/tour";
import { differenceInDays, addDays, format } from "date-fns";

import { UpgradeNudge } from "@/components/subscription/UpgradeNudge";
import { FreeUpgradeBanner } from "@/components/subscription/FreeUpgradeBanner";

import { DeviCTA } from "@/components/dashboard/DeviCTA";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { AIAlertsCard } from "@/components/dashboard/AIAlertsCard";
import { TopCandidatesSpotlight } from "@/components/dashboard/TopCandidatesSpotlight";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefresh";
import { WinsStats, useDeviWins } from "@/components/devi/WinsStats";
import { WillingnessToPaySurvey } from "@/components/subscription/WillingnessToPaySurvey";
import { HealingScoreCard } from "@/components/dashboard/HealingScoreCard";
import { SelfDiscoveryCTA } from "@/components/dashboard/SelfDiscoveryCTA";
import { AIDisclosure } from "@/components/AIDisclosure";
import { FeatureTourDialog } from "@/components/onboarding/FeatureTourDialog";
import { useFeatureTour } from "@/hooks/useFeatureTour";
import { DeviIntroDialog } from "@/components/devi/DeviIntroDialog";
import { useDeviIntro } from "@/hooks/useDeviIntro";
import { TextSimulator } from "@/components/candidate/TextSimulator";

type Profile = Tables<"profiles">;
type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;
type SimulatorSession = Tables<"text_simulator_sessions">;

type AdminMessage = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_type?: string;
  reply_to?: string | null;
};

type RecentActivityItem = {
  type: "matched" | "interacted" | "ended" | "no_contact" | "notification" | "admin_message";
  candidate?: Candidate;
  interaction?: Interaction;
  date: Date;
  notification?: {
    notifType: "oxytocin" | "red_flags" | "high_match" | "low_match" | "stale" | "advice";
    title: string;
    message: string;
    icon: "flame" | "alert" | "heart" | "trending" | "clock" | "lightbulb";
  };
  adminMessage?: AdminMessage;
};

interface CandidateRecap {
  recentActivity: RecentActivityItem[];
  goodCandidates: Candidate[];
  badCandidates: Candidate[];
  neutralCandidates: Candidate[];
}

const statusOrder: Record<string, number> = {
  getting_serious: 1,
  dating: 2,
  planning_date: 3,
  texting: 4,
  just_matched: 5,
  no_contact: 6,
  archived: 7,
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { startTour, hasCompletedTour } = useTour();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [sortBy, setSortBy] = useState<SortOption>("status");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [qualityFilter, setQualityFilter] = useState<"good" | "bad" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showWtpSurvey, setShowWtpSurvey] = useState(false);
  const [surveyChecked, setSurveyChecked] = useState(false);
  const [pipelineOverflowDismissed, setPipelineOverflowDismissed] = useState(() => {
    try { return localStorage.getItem("pipeline_overflow_dismissed") === "true"; } catch { return false; }
  });
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<AdminMessage | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [textSimOpen, setTextSimOpen] = useState(false);
  const [textSimCandidate, setTextSimCandidate] = useState<Candidate | null>(null);
  const [simSessions, setSimSessions] = useState<SimulatorSession[]>([]);
  
  // Devi wins tracking
  const { wins, refetch: refetchWins } = useDeviWins(user?.id);
  
  // Feature tour for new users
  const { showTour, completeTour } = useFeatureTour(user?.id);
  
  // Devi intro popup for new users who haven't chatted yet
  const { showDeviIntro, setShowDeviIntro, dismissDeviIntro } = useDeviIntro(user?.id);

  const handleReopenRelationship = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReopeningId(candidateId);
    try {
      const { error } = await supabase
        .from("candidates")
        .update({
          status: "texting",
          relationship_ended_at: null,
          end_reason: null,
        })
        .eq("id", candidateId);
      
      if (error) throw error;
      
      setCandidates(prev => prev.map(c => 
        c.id === candidateId 
          ? { ...c, status: "texting", relationship_ended_at: null, end_reason: null }
          : c
      ));
    } catch (error) {
      console.error("Error reopening relationship:", error);
    } finally {
      setReopeningId(null);
    }
  };

  const [endingNoContactId, setEndingNoContactId] = useState<string | null>(null);

  const handleEndNoContact = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEndingNoContactId(candidateId);
    try {
      const { error } = await supabase
        .from("candidates")
        .update({
          no_contact_active: false,
          status: "texting",
          relationship_ended_at: null,
          end_reason: null,
        })
        .eq("id", candidateId);
      
      if (error) throw error;
      
      setCandidates(prev => prev.map(c => 
        c.id === candidateId 
          ? { ...c, no_contact_active: false, status: "texting", relationship_ended_at: null, end_reason: null }
          : c
      ));
    } catch (error) {
      console.error("Error ending no contact:", error);
    } finally {
      setEndingNoContactId(null);
    }
  };

  const handleSendReply = async () => {
    if (!replyingToMessage || !replyContent.trim() || !user) return;
    
    setSendingReply(true);
    try {
      const { error } = await supabase
        .from("admin_messages")
        .insert({
          user_id: user.id,
          sender_id: user.id,
          sender_type: 'user',
          title: `Re: ${replyingToMessage.title}`,
          message: replyContent.trim(),
          reply_to: replyingToMessage.id,
        });
      
      if (error) throw error;
      
      toast.success("Reply sent to admin");
      setReplyContent("");
      setReplyDialogOpen(false);
      setReplyingToMessage(null);
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  // Only start dashboard tour AFTER feature tour AND Devi intro popup are both closed
  useEffect(() => {
    if (!loading && profile && !showTour && !showDeviIntro && !hasCompletedTour("dashboard")) {
      const timer = setTimeout(() => {
        startTour("dashboard", DASHBOARD_TOUR_STEPS);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, profile, showTour, showDeviIntro, startTour, hasCompletedTour]);

  useEffect(() => {
    if (user) {
      fetchData();
      // Prefetch Devi page data in background for faster navigation
      const prefetchDeviData = async () => {
        await Promise.all([
          supabase.from("devi_conversations").select("id, candidate_id, title, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20),
        ]);
      };
      // Delay prefetch to not compete with main data load
      const prefetchTimer = setTimeout(prefetchDeviData, 1000);
      
      // Subscribe to realtime admin messages
      const channel = supabase
        .channel('admin-messages-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_messages',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newMessage = payload.new as AdminMessage;
            setAdminMessages(prev => [newMessage, ...prev]);
            toast.info("New message from DateBetter", {
              description: newMessage.title,
            });
          }
        )
        .subscribe();
      
      return () => {
        clearTimeout(prefetchTimer);
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Check and trigger willingness-to-pay survey at 10 candidates OR if admin requested
  useEffect(() => {
    const checkSurvey = async () => {
      if (!user || surveyChecked) return;
      
      try {
        // Check if already completed survey
        const { data: existingSurvey, error: surveyError } = await supabase
          .from("willingness_to_pay_surveys")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (surveyError) {
          console.error("Error checking survey:", surveyError);
          return;
        }
        
        setSurveyChecked(true);
        
        // If already completed, don't show
        if (existingSurvey) return;
        
        // Check for admin-triggered survey request
        const { data: surveyRequest, error: requestError } = await supabase
          .from("survey_requests")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .eq("survey_type", "wtp")
          .maybeSingle();
        
        if (requestError) {
          console.error("Error checking survey request:", requestError);
        }
        
        // Show survey if admin requested OR if 10+ candidates
        if (surveyRequest || candidates.length >= 10) {
          setShowWtpSurvey(true);
        }
      } catch (error) {
        console.error("Error checking survey:", error);
      }
    };
    
    checkSurvey();
  }, [user, candidates.length, surveyChecked]);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, candidatesRes, interactionsRes, adminMsgsRes, simSessionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
        supabase.from("candidates").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false }),
        supabase.from("interactions").select("*").eq("user_id", user!.id).order("interaction_date", { ascending: false }).limit(50),
        supabase.from("admin_messages").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("text_simulator_sessions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (candidatesRes.data) setCandidates(candidatesRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
      if (adminMsgsRes.data) setAdminMessages(adminMsgsRes.data as AdminMessage[]);
      if (simSessionsRes.data) setSimSessions(simSessionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Pull to refresh
  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: fetchData,
    threshold: 80,
  });

  // Calculate cycle phase alerts - hide for male users
  const isMaleUser = profile?.gender_identity === "man_cis" || profile?.gender_identity === "man_trans";
  const cycleAlerts = useMemo(() => {
    if (isMaleUser || !profile?.track_cycle || !profile?.last_period_date) return null;

    const lastPeriod = new Date(profile.last_period_date);
    const cycleLength = profile.cycle_length || 28;
    const today = new Date();
    const daysSinceLastPeriod = differenceInDays(today, lastPeriod);
    const dayInCycle = daysSinceLastPeriod % cycleLength || cycleLength;
    const ovulationDay = Math.round(cycleLength / 2) - 2;

    let phase = "";
    let warning = "";
    let icon = null;

    if (dayInCycle <= 5) {
      phase = "Menstrual Phase";
      warning = "Energy may be lower — be gentle with yourself. Estrogen rising.";
      icon = <Droplet className="w-4 h-4" />;
    } else if (dayInCycle > 5 && dayInCycle < ovulationDay - 2) {
      phase = "Follicular Phase";
      warning = "Estrogen rising — confidence & energy increasing. Good time for new connections!";
      icon = <Sparkles className="w-4 h-4" />;
    } else if (dayInCycle >= ovulationDay - 2 && dayInCycle <= ovulationDay + 2) {
      phase = "Ovulation Window";
      warning = "Peak fertility & attraction hormones. You may feel more drawn to masculine traits. Make decisions with your head, not just heart!";
      icon = <Flame className="w-4 h-4" />;
    } else if (dayInCycle > ovulationDay + 2 && dayInCycle < cycleLength - 5) {
      phase = "Luteal Phase";
      warning = "Progesterone rising — you may crave comfort and security. Emotions can feel more intense.";
      icon = <AlertTriangle className="w-4 h-4" />;
    } else {
      phase = "Pre-Menstrual";
      warning = "PMS territory — emotions may be heightened. Be extra mindful of big decisions.";
      icon = <AlertTriangle className="w-4 h-4" />;
    }

    return { phase, warning, icon, dayInCycle };
  }, [profile]);

  // Check for post-intimacy oxytocin alerts - bonding hormone peaks then drops
  const oxytocinAlerts = useMemo(() => {
    const alerts: { candidate: Candidate; daysSince: number; phase: string }[] = [];
    const intimateInteractions = interactions.filter((i) => i.interaction_type === "intimate");

    intimateInteractions.forEach((interaction) => {
      const daysSince = differenceInDays(new Date(), new Date(interaction.interaction_date || ""));
      if (daysSince <= 5) {
        const candidate = candidates.find((c) => c.id === interaction.candidate_id);
        if (candidate && !alerts.find((a) => a.candidate.id === candidate.id)) {
          let phase = "";
          if (daysSince === 0) phase = "Oxytocin peaked — bonding feelings strongest";
          else if (daysSince <= 2) phase = "Oxytocin still elevated — attachment feelings high";
          else phase = "Oxytocin dropping — you may feel more clear-headed now";
          alerts.push({ candidate, daysSince, phase });
        }
      }
    });

    return alerts;
  }, [interactions, candidates]);

  // Post-intimacy drop detection - feelings/contact dropped after intimacy
  const postIntimacyDropAlerts = useMemo(() => {
    const alerts: { candidate: Candidate; reason: string }[] = [];
    const flaggedIds = new Set<string>();
    
    candidates.forEach((candidate) => {
      // First check AI-detected red flags for post-intimacy patterns
      const redFlags = Array.isArray(candidate.red_flags) ? candidate.red_flags : [];
      const postIntimacyFlagPhrases = [
        "post-intimacy", "post intimacy", "after intimacy", "after sex", 
        "pulled away", "fell off", "dropped off", "drop off", "ghost after",
        "distance after", "distant after", "less interested after",
        "breadcrumb", "slow fade", "switched up after"
      ];
      
      const hasPostIntimacyRedFlag = redFlags.some((flag: string) => {
        const lowerFlag = (flag || "").toLowerCase();
        return postIntimacyFlagPhrases.some(phrase => lowerFlag.includes(phrase));
      });
      
      if (hasPostIntimacyRedFlag) {
        alerts.push({ candidate, reason: "AI detected post-intimacy behavior change" });
        flaggedIds.add(candidate.id);
        return;
      }
      
      // Then check interaction patterns
      const candidateInteractions = interactions
        .filter((i) => i.candidate_id === candidate.id)
        .sort((a, b) => new Date(a.interaction_date || "").getTime() - new Date(b.interaction_date || "").getTime());
      
      // Find intimate interaction
      const intimateIdx = candidateInteractions.findIndex((i) => i.interaction_type === "intimate");
      if (intimateIdx === -1) return;
      
      const postIntimateInteractions = candidateInteractions.slice(intimateIdx + 1);
      
      // Check notes for drop indicators in post-intimacy interactions
      const dropPhrases = ["fell off", "falling off", "falling for", "distant", "distance", "pulled away", "less interested", "ghosting", "slow fade", "breadcrumbing", "mixed signals", "switched up", "didn't answer", "didn't pick up", "not responding"];
      const allPostNotes = postIntimateInteractions.map(i => (i.notes || "").toLowerCase()).join(" ");
      const candidateNotes = (candidate.notes || "").toLowerCase();
      const hasDropLanguage = dropPhrases.some(phrase => allPostNotes.includes(phrase) || candidateNotes.includes(phrase));
      
      // Check for feeling drop after intimacy
      let feelingDrop = false;
      if (postIntimateInteractions.length > 0) {
        const avgPostFeeling = postIntimateInteractions.reduce((sum, i) => sum + (i.overall_feeling || 3), 0) / postIntimateInteractions.length;
        feelingDrop = avgPostFeeling <= 2; // Low feelings after intimacy
      }
      
      if ((feelingDrop || hasDropLanguage) && !flaggedIds.has(candidate.id)) {
        alerts.push({ 
          candidate, 
          reason: hasDropLanguage ? "Post-intimacy pullback detected" : "Feelings dropped after intimacy"
        });
      }
    });
    
    return alerts;
  }, [candidates, interactions]);

  // Love bombing detection - rapid escalation pattern
  const loveBombingAlerts = useMemo(() => {
    const alerts: { candidate: Candidate; reason: string }[] = [];
    
    // Love bombing phrases to check in notes
    const loveBombingPhrases = [
      "too good to be true", "already said i love you", "wants to move in", 
      "moving too fast", "constant texting", "showering with gifts", 
      "future faking", "soulmate", "never felt this way", "falling for me",
      "wants to have kids", "wants kids with me", "hes falling", "he's falling",
      "she's falling", "shes falling", "love you already", "marry me",
      "move in together", "intense", "overwhelming",
      // Over-promising / actions don't match words
      "promised but", "says but doesn't", "said but didn't", "all talk", 
      "empty promises", "keeps promising", "never follows through", "talks big",
      "can't afford", "couldn't afford", "no money for", "broke but",
      "overpromising", "over promising", "too soon", "way too fast",
      "only been", "just met", "barely know", "week and already",
      "days and already", "planning our future", "talking about marriage",
      "talking about kids", "talking about moving", "words don't match"
    ];
    
    candidates.forEach((candidate) => {
      // Skip love bombing check for candidates already in a serious/established status
      // — once you're actively dating someone, that early "intensity" is no longer a red flag
      const earlyStages = ["just_matched", "texting", "planning_date"];
      if (!earlyStages.includes(candidate.status || "")) return;

      const candidateInteractions = interactions.filter((i) => i.candidate_id === candidate.id);
      
      // Check candidate notes for love bombing language
      const candidateNotes = (candidate.notes || "").toLowerCase();
      const hasLoveBombingInCandidateNotes = loveBombingPhrases.some(phrase => candidateNotes.includes(phrase));
      
      if (hasLoveBombingInCandidateNotes) {
        alerts.push({ candidate, reason: "Love bombing signs in notes" });
        return;
      }
      
      // Check interaction notes
      const notesText = candidateInteractions.map(i => (i.notes || "").toLowerCase()).join(" ");
      const hasLoveBombingLanguage = loveBombingPhrases.some(phrase => notesText.includes(phrase));
      
      if (hasLoveBombingLanguage) {
        alerts.push({ candidate, reason: "Love bombing language detected" });
        return;
      }
      
      // Check for rapid interaction frequency — raised threshold to reduce false positives
      if (candidateInteractions.length < 5) return;
      
      const firstInteractionDate = candidateInteractions.length > 0 
        ? new Date(candidateInteractions[candidateInteractions.length - 1].interaction_date || candidate.created_at || "")
        : null;
      
      if (firstInteractionDate) {
        const daysSinceFirst = differenceInDays(new Date(), firstInteractionDate);
        // Raised from 7 to 10 interactions and from 5/week to 7/week to reduce false positives
        if (daysSinceFirst <= 14 && candidateInteractions.length >= 10) {
          alerts.push({ candidate, reason: "Very intense start — 10+ interactions in 2 weeks" });
        }
      }
    });

    return alerts;
  }, [candidates, interactions]);

  // Build candidate alerts map for badges
  const candidateAlerts = useMemo(() => {
    const alertsMap: Record<string, { type: string; label: string; color: string }[]> = {};
    
    // Oxytocin alerts
    oxytocinAlerts.forEach(({ candidate, daysSince }) => {
      if (!alertsMap[candidate.id]) alertsMap[candidate.id] = [];
      alertsMap[candidate.id].push({
        type: "oxytocin",
        label: daysSince <= 2 ? "🔥 Bonding high" : "Oxytocin clearing",
        color: "bg-primary/10 text-primary"
      });
    });
    
    // Love bombing alerts
    loveBombingAlerts.forEach(({ candidate }) => {
      if (!alertsMap[candidate.id]) alertsMap[candidate.id] = [];
      alertsMap[candidate.id].push({
        type: "love_bombing",
        label: "⚠️ Love bombing?",
        color: "bg-muted text-foreground"
      });
    });
    
    // Post-intimacy drop alerts
    postIntimacyDropAlerts.forEach(({ candidate }) => {
      if (!alertsMap[candidate.id]) alertsMap[candidate.id] = [];
      alertsMap[candidate.id].push({
        type: "post_intimacy_drop",
        label: "📉 Post-intimacy drop",
        color: "bg-purple-500/20 text-purple-600"
      });
    });
    
    return alertsMap;
  }, [oxytocinAlerts, loveBombingAlerts, postIntimacyDropAlerts]);

  // Candidate recap
  const recap: CandidateRecap = useMemo(() => {
    const activeCandidates = candidates.filter(
      (c) => c.status !== "archived" && c.status !== "no_contact"
    );

    // Build unified recent activity list
    const activityItems: RecentActivityItem[] = [];
    const seenCandidateIds = new Set<string>();

    // Add recent interactions (up to 5)
    interactions.slice(0, 5).forEach((interaction) => {
      const candidate = candidates.find((c) => c.id === interaction.candidate_id);
      if (candidate && !seenCandidateIds.has(candidate.id)) {
        activityItems.push({
          type: "interacted",
          candidate,
          interaction,
          date: new Date(interaction.interaction_date || interaction.created_at || 0),
        });
        seenCandidateIds.add(candidate.id);
      }
    });

    // Add recently matched (within last 14 days)
    candidates
      .filter((c) => c.created_at && differenceInDays(new Date(), new Date(c.created_at)) <= 14)
      .forEach((candidate) => {
        if (!seenCandidateIds.has(candidate.id)) {
          activityItems.push({
            type: "matched",
            candidate,
            date: new Date(candidate.created_at!),
          });
          seenCandidateIds.add(candidate.id);
        }
      });

    // Add recently ended (within last 14 days)
    candidates
      .filter((c) => {
        const endedAt = (c as any).relationship_ended_at;
        if (!endedAt || c.status !== "archived") return false;
        return differenceInDays(new Date(), new Date(endedAt)) <= 14;
      })
      .forEach((candidate) => {
        if (!seenCandidateIds.has(candidate.id)) {
          activityItems.push({
            type: "ended",
            candidate,
            date: new Date((candidate as any).relationship_ended_at),
          });
          seenCandidateIds.add(candidate.id);
        }
      });

    // Add no contact candidates
    candidates
      .filter((c) => c.no_contact_active && c.status === "no_contact")
      .forEach((candidate) => {
        if (!seenCandidateIds.has(candidate.id)) {
          activityItems.push({
            type: "no_contact",
            candidate,
            date: new Date(candidate.no_contact_start_date || candidate.relationship_ended_at || candidate.updated_at || 0),
          });
          seenCandidateIds.add(candidate.id);
        }
      });

    // Also add recently ended relationships that went to no_contact but check by relationship_ended_at
    candidates
      .filter((c) => {
        if (!c.relationship_ended_at) return false;
        if (c.status !== "no_contact" && c.status !== "archived") return false;
        return differenceInDays(new Date(), new Date(c.relationship_ended_at)) <= 14;
      })
      .forEach((candidate) => {
        if (!seenCandidateIds.has(candidate.id)) {
          activityItems.push({
            type: candidate.no_contact_active ? "no_contact" : "ended",
            candidate,
            date: new Date(candidate.relationship_ended_at!),
          });
          seenCandidateIds.add(candidate.id);
        }
      });

    // Add notification items
    const today = new Date();

    // Oxytocin alerts (recent intimacy) - deduplicate by candidate
    const oxytocinCandidateIds = new Set<string>();
    interactions
      .filter((i) => i.interaction_type === "intimate")
      .forEach((interaction) => {
        const daysSince = differenceInDays(today, new Date(interaction.interaction_date || ""));
        if (daysSince <= 3) {
          const candidate = candidates.find((c) => c.id === interaction.candidate_id);
          if (candidate && !oxytocinCandidateIds.has(candidate.id)) {
            oxytocinCandidateIds.add(candidate.id);
            activityItems.push({
              type: "notification",
              candidate,
              date: new Date(interaction.interaction_date || ""),
              notification: {
                notifType: "oxytocin",
                title: "Oxytocin active",
                message: `${candidate.nickname} — hormones affect judgment for 48-72hrs`,
                icon: "flame",
              },
            });
          }
        }
      });

    // Red flag alerts
    candidates.forEach((c) => {
      const flags = c.red_flags as unknown[];
      if (Array.isArray(flags) && flags.length >= 2 && c.status !== "archived" && c.status !== "no_contact") {
        activityItems.push({
          type: "notification",
          candidate: c,
          date: new Date(c.updated_at || c.created_at || ""),
          notification: {
            notifType: "red_flags",
            title: `${flags.length} red flags`,
            message: `${c.nickname} — Review concerns before proceeding`,
            icon: "alert",
          },
        });
      }
    });

    // High compatibility alerts
    candidates
      .filter((c) => c.compatibility_score && c.compatibility_score >= 80 && c.status !== "archived" && c.status !== "no_contact")
      .forEach((c) => {
        activityItems.push({
          type: "notification",
          candidate: c,
          date: new Date(c.last_score_update || c.updated_at || c.created_at || ""),
          notification: {
            notifType: "high_match",
            title: `${c.compatibility_score}% compatible`,
            message: `${c.nickname} — High potential match!`,
            icon: "heart",
          },
        });
      });

    // Low compatibility alerts
    candidates
      .filter((c) => c.compatibility_score && c.compatibility_score < 35 && !c.no_contact_active && c.status !== "archived")
      .forEach((c) => {
        activityItems.push({
          type: "notification",
          candidate: c,
          date: new Date(c.last_score_update || c.updated_at || c.created_at || ""),
          notification: {
            notifType: "low_match",
            title: `${c.compatibility_score}% compatibility`,
            message: `${c.nickname} — Consider starting No Contact`,
            icon: "trending",
          },
        });
      });

    // Stale candidates (no updates in 7+ days)
    candidates.forEach((c) => {
      if (c.updated_at && c.status !== "archived" && c.status !== "no_contact") {
        const daysSince = differenceInDays(today, new Date(c.updated_at));
        if (daysSince > 7) {
          activityItems.push({
            type: "notification",
            candidate: c,
            date: new Date(c.updated_at),
            notification: {
              notifType: "stale",
              title: `No updates in ${daysSince} days`,
              message: `${c.nickname} — Time to check in?`,
              icon: "clock",
            },
          });
        }
      }
    });

    // NOTE: Admin messages are now shown in a separate Messages section, not in Recent Activity

    // Sort by date and take top 8 (increased to show more items)
    const recentActivity = activityItems
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 8);

    // Categorize by compatibility/feeling
    const goodCandidates = activeCandidates.filter(
      (c) => (c.compatibility_score && c.compatibility_score >= 40) && 
             (!Array.isArray(c.red_flags) || c.red_flags.length < 3)
    );
    const badCandidates = activeCandidates.filter(
      (c) => (c.compatibility_score && c.compatibility_score < 40) || 
             (Array.isArray(c.red_flags) && c.red_flags.length >= 3)
    );
    const neutralCandidates = activeCandidates.filter(
      (c) => !goodCandidates.includes(c) && !badCandidates.includes(c)
    );

    return {
      recentActivity,
      goodCandidates,
      badCandidates,
      neutralCandidates,
    };
  }, [candidates, interactions, adminMessages]);

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = [...candidates];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => c.nickname.toLowerCase().includes(query));
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((c) => c.status !== "archived" && c.status !== "no_contact" && !(c as any).is_auto_disqualified);
      } else if (statusFilter === "disqualified") {
        filtered = filtered.filter((c) => (c as any).is_auto_disqualified && !(c as any).auto_disqualify_override);
      } else {
        filtered = filtered.filter((c) => c.status === statusFilter);
      }
    }

    // Apply quality filter - matches recap thresholds (40%+ for good)
    if (qualityFilter === "good") {
      filtered = filtered.filter(
        (c) => (c.compatibility_score && c.compatibility_score >= 40) && 
               (!Array.isArray(c.red_flags) || c.red_flags.length < 3)
      );
    } else if (qualityFilter === "bad") {
      filtered = filtered.filter(
        (c) => (c.compatibility_score && c.compatibility_score < 40) || 
               (Array.isArray(c.red_flags) && c.red_flags.length >= 3)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.compatibility_score ?? 0) - (a.compatibility_score ?? 0);
        case "status":
          return (statusOrder[a.status || ""] || 99) - (statusOrder[b.status || ""] || 99);
        case "date_added":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "date_updated":
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [candidates, sortBy, statusFilter, qualityFilter, searchQuery]);

  const greeting = getGreeting();

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/setup" replace />;
  }

  const activeCandidates = candidates.filter(
    (c) => c.status !== "archived" && c.status !== "no_contact"
  );
  const activeCandidateCount = activeCandidates.length;

  return (
    <div 
      ref={containerRef}
      className="min-h-[100dvh] relative overflow-auto bg-[image:var(--gradient-page)]"
    >
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      
      {/* Feature Tour for New Users */}
      <FeatureTourDialog open={showTour} onClose={completeTour} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[image:var(--gradient-header)] backdrop-blur-xl border-b border-border/50 pt-safe-top">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-[var(--shadow-soft)]">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground leading-tight">
                  {profile?.name ? `Hi, ${profile.name}` : "Hello!"}
                </h1>
                <p className="text-xs text-muted-foreground">{greeting}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <QuickCandidateSelect candidates={candidates} variant="prominent" />
              <TourRestartButton tourId="dashboard" tourSteps={DASHBOARD_TOUR_STEPS} userId={user?.id} />
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-foreground hover:bg-secondary/20 rounded-xl h-9 w-9" 
                      onClick={() => setShowWtpSurvey(true)}
                    >
                      <ClipboardList className="w-5 h-5 text-secondary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Take quick survey</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-foreground hover:bg-primary/10 rounded-xl h-9 w-9" 
                onClick={() => navigate("/notifications")}
              >
                <Bell className="w-5 h-5" />
                {(oxytocinAlerts.length > 0 || loveBombingAlerts.length > 0 || postIntimacyDropAlerts.length > 0 || candidates.filter(c => c.no_contact_active).length > 0 || cycleAlerts) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </Button>
              <Button 
                data-tour="settings" 
                variant="ghost" 
                size="icon" 
                className="text-foreground hover:bg-primary/10 rounded-xl h-9 w-9" 
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-4 max-w-lg mx-auto pb-32">
        
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setQualityFilter(null); }} className="w-full">
          <TabsList className="w-full grid grid-cols-2 gap-1 mb-5 h-12 p-1 bg-background/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm">
            <TabsTrigger 
              value="home" 
              className="rounded-xl text-sm font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              Home
            </TabsTrigger>
            <TabsTrigger 
              value="manage" 
              className="rounded-xl text-sm font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              Manage
            </TabsTrigger>
          </TabsList>

           <TabsContent value="home" className="space-y-3 mt-0">
            {/* Quick Actions Grid */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="grid grid-cols-2 gap-2">
                <TooltipProvider delayDuration={400}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-tour="add-candidate"
                        onClick={() => navigate("/add-candidate")}
                        className="h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98]"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-medium">Add Candidate</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="text-xs">Start tracking someone new you're dating or considering</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div data-tour="log-interaction" className="h-11">
                  <LogInteractionDialog candidates={candidates} compact />
                </div>
                <TooltipProvider delayDuration={400}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => navigate("/devi")}
                        className="h-11 gap-2 bg-gradient-to-br from-secondary to-primary text-primary-foreground rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98]"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-medium">Ask D.E.V.I.</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="text-xs">Get personalized dating advice from your AI coach</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={400}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-tour="view-patterns"
                        variant="outline"
                        onClick={() => navigate("/patterns")}
                        className="h-11 gap-2 rounded-xl border-border bg-card text-foreground hover:bg-muted/50 transition-all duration-200 active:scale-[0.98]"
                      >
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium">View Patterns</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="text-xs">Discover trends in your dating behaviors and preferences</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Text Simulator — full-width CTA below grid */}
              {candidates.length > 0 && (
                <button
                  onClick={() => {
                    const allCandidates = [...candidates];
                    if (allCandidates.length === 1) {
                      setTextSimCandidate(allCandidates[0]);
                      setTextSimOpen(true);
                    } else if (allCandidates.length > 0) {
                      setTextSimCandidate(null);
                      setTextSimOpen(true);
                    }
                  }}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-muted/50 transition-all duration-200 active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">Text Simulator</span>
                  <span className="text-[10px] text-muted-foreground ml-1">— get closure, not regret</span>
                </button>
              )}
            </motion.div>

            {/* ===== TOP CANDIDATES SPOTLIGHT ===== */}
            <TopCandidatesSpotlight key={candidates.length > 0 ? "loaded" : "empty"} candidates={candidates} />

            {/* Alerts Carousel */}
            {(() => {
              const alerts: { key: string; icon: React.ReactNode; label: string; sub?: string; color: string; onClick?: () => void }[] = [];
              
              if (!isMaleUser && profile?.track_cycle && !profile?.last_period_date && !profile?.onboarding_completed) {
                alerts.push({
                  key: "cycle-setup",
                  icon: <Droplet className="w-3 h-3" />,
                  label: "Set up cycle",
                  color: "bg-secondary/20 text-secondary border-secondary/30",
                  onClick: () => navigate("/settings?tab=preferences&section=cycle"),
                });
              }
              if (cycleAlerts) {
                alerts.push({
                  key: "cycle-alert",
                  icon: cycleAlerts.icon,
                  label: cycleAlerts.phase,
                  sub: `Day ${cycleAlerts.dayInCycle}`,
                  color: "bg-accent/20 text-accent-foreground border-accent/30",
                });
              }
               oxytocinAlerts.forEach(({ candidate, daysSince, phase }) => {
                alerts.push({
                  key: `oxy-${candidate.id}`,
                  icon: <Flame className="w-3 h-3" />,
                  label: `${candidate.nickname}`,
                  sub: daysSince <= 2 ? "Bonding high" : "Clearing",
                  color: "bg-primary/10 text-primary border-primary/20",
                  onClick: () => navigate(`/candidate/${candidate.id}`),
                });
              });
              loveBombingAlerts.forEach(({ candidate, reason }) => {
                alerts.push({
                  key: `lb-${candidate.id}`,
                  icon: <AlertTriangle className="w-3 h-3" />,
                  label: candidate.nickname,
                  sub: "Love bombing?",
                  color: "bg-muted text-foreground border-border",
                  onClick: () => navigate(`/candidate/${candidate.id}`),
                });
              });
              candidates.filter(c => c.no_contact_active).forEach((candidate) => {
                alerts.push({
                  key: `nc-${candidate.id}`,
                  icon: <Ban className="w-3 h-3" />,
                  label: candidate.nickname,
                  sub: `Day ${candidate.no_contact_day || 0}`,
                  color: "bg-muted text-muted-foreground border-border",
                  onClick: () => navigate(`/candidate/${candidate.id}`),
                });
              });
              candidates.filter(c => {
                const endedAt = (c as any).relationship_ended_at;
                if (!endedAt || c.status !== "archived") return false;
                const hoursSince = differenceInDays(new Date(), new Date(endedAt)) * 24;
                return hoursSince <= 48;
              }).forEach((candidate) => {
                alerts.push({
                  key: `ended-${candidate.id}`,
                  icon: <XCircle className="w-3 h-3" />,
                  label: candidate.nickname,
                  sub: "Ended",
                  color: "bg-muted text-muted-foreground border-border",
                  onClick: () => navigate(`/candidate/${candidate.id}`),
                });
              });

              if (alerts.length === 0) return null;

              return (
                <motion.div 
                  data-tour="cycle-status"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
                  <CarouselContent className="-ml-2">
                    {alerts.map((alert, i) => (
                      <CarouselItem key={alert.key} className="pl-2 basis-auto">
                        <motion.button
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
                          onClick={alert.onClick}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${alert.color}`}
                        >
                          {alert.icon}
                          <span>{alert.label}</span>
                          {alert.sub && <span className="opacity-60">• {alert.sub}</span>}
                        </motion.button>
                      </CarouselItem>
                    ))}
                    <CarouselItem className="pl-2 basis-auto">
                      <button
                        onClick={() => navigate("/notifications")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:bg-primary/10 transition-all"
                      >
                        <Bell className="w-3 h-3" />
                        <span>All</span>
                      </button>
                    </CarouselItem>
                  </CarouselContent>
                </Carousel>
                </motion.div>
              );
            })()}

            {/* Quick Stats */}
            <motion.div 
              className="grid grid-cols-4 gap-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.button 
                className="rounded-xl p-3 bg-card/80 backdrop-blur-sm border border-border/60 text-center transition-all duration-200 shadow-sm hover:shadow-md" 
                onClick={() => { setActiveTab("manage"); setStatusFilter("active"); setQualityFilter(null); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div 
                  className="text-xl font-bold text-foreground"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {activeCandidateCount}
                </motion.div>
                <div className="text-[10px] text-muted-foreground font-medium">Active</div>
              </motion.button>
              <motion.button 
                className="rounded-xl p-3 bg-card/80 backdrop-blur-sm border border-border/60 text-center transition-all duration-200 shadow-sm hover:shadow-md" 
                onClick={() => { setActiveTab("manage"); setStatusFilter("active"); setQualityFilter("good"); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div 
                  className="text-xl font-bold text-foreground"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
                >
                  {recap.goodCandidates.length}
                </motion.div>
                <div className="text-[10px] text-muted-foreground font-medium">Good Vibes</div>
              </motion.button>
              <motion.button 
                className="rounded-xl p-3 bg-card/80 backdrop-blur-sm border border-border/60 text-center transition-all duration-200 shadow-sm hover:shadow-md" 
                onClick={() => { setActiveTab("manage"); setStatusFilter("active"); setQualityFilter("bad"); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div 
                  className="text-xl font-bold text-foreground"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                >
                  {recap.badCandidates.length}
                </motion.div>
                <div className="text-[10px] text-muted-foreground font-medium">Watch Out</div>
              </motion.button>
              <motion.button 
                className="rounded-xl p-3 bg-card/80 backdrop-blur-sm border border-border/60 text-center transition-all duration-200 shadow-sm hover:shadow-md" 
                onClick={() => {
                  if (candidates.length > 0) {
                    const allCandidates = [...candidates];
                    if (allCandidates.length === 1) {
                      setTextSimCandidate(allCandidates[0]);
                      setTextSimOpen(true);
                    } else {
                      setTextSimCandidate(null);
                      setTextSimOpen(true);
                    }
                  }
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div 
                  className="text-xl font-bold text-foreground"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
                >
                  {simSessions.length}
                </motion.div>
                <div className="text-[10px] text-muted-foreground font-medium">Closure</div>
              </motion.button>
            </motion.div>

            {/* ===== AI PREDICTIONS - ENHANCED ===== */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="relative overflow-hidden rounded-2xl">
                {/* Animated shimmer background */}
                <div className="absolute inset-0 bg-[length:200%_100%] bg-gradient-to-r from-transparent via-primary/8 to-transparent animate-shimmer pointer-events-none" />
                
                <div className="relative">
                  <AIAlertsCard 
                    candidateCount={candidates.length}
                    lastInteractionTime={interactions[0]?.interaction_date || undefined}
                    interactionCount={interactions.length}
                    userId={user?.id}
                    onLogInteraction={activeCandidates.length === 1 
                      ? () => navigate(`/candidate/${activeCandidates[0].id}?tab=interactions`)
                      : activeCandidates.length > 1 
                        ? () => document.getElementById("log-interaction-trigger")?.click()
                        : undefined
                    }
                  />
                </div>
              </div>
            </motion.section>

            {/* Log How I'm Feeling CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
            <Card 
              className="overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-md active:scale-[0.99] border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5"
              onClick={() => navigate("/devi?prompt=feeling")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Heart className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">How are you feeling today?</h3>
                    <p className="text-xs text-muted-foreground">Check in with D.E.V.I. about your emotions</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Candidate Recap / Recent Activity */}
            {candidates.length > 0 && (
              <motion.div 
                className="rounded-2xl bg-card border border-border overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="px-4 py-3 bg-[image:var(--gradient-subtle)] border-b border-border/50">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Recent Activity
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 text-primary font-medium cursor-help">
                            <Sparkles className="w-3 h-3" />
                            D.E.V.I.
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">Dating Evaluation & Vetting Intelligence</p>
                          <p className="text-xs text-muted-foreground">AI-powered insights for your dating journey</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {recap.recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                  {(showAllActivity ? recap.recentActivity : recap.recentActivity.slice(0, 5)).map((item, idx) => {
                    if (item.type === "matched") {
                      return (
                        <button
                          key={`matched-${item.candidate.id}-${idx}`}
                          onClick={() => navigate(`/candidate/${item.candidate.id}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={item.candidate.photo_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                              {item.candidate.nickname.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">{item.candidate.nickname}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Matched • {format(item.date, "MMM d")}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      );
                    }

                    if (item.type === "interacted" && item.interaction) {
                      return (
                        <button
                          key={`interacted-${item.candidate.id}-${idx}`}
                          onClick={() => navigate(`/candidate/${item.candidate.id}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={item.candidate.photo_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                              {item.candidate.nickname.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">{item.candidate.nickname}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {item.interaction.interaction_type.replace("_", " ")} • {format(item.date, "MMM d")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {item.interaction.overall_feeling && item.interaction.overall_feeling >= 4 && (
                              <ThumbsUp className="w-4 h-4 text-primary" />
                            )}
                            {item.interaction.overall_feeling && item.interaction.overall_feeling <= 2 && (
                              <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                            )}
                            {item.interaction.overall_feeling === 3 && (
                              <Minus className="w-4 h-4 text-muted-foreground" />
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </button>
                      );
                    }

                    if (item.type === "ended") {
                      return (
                        <div key={`ended-${item.candidate.id}-${idx}`} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors">
                          <button
                            onClick={() => navigate(`/candidate/${item.candidate.id}`)}
                            className="flex items-center gap-3 flex-1"
                          >
                            <Avatar className="w-10 h-10 border border-border">
                              <AvatarImage src={item.candidate.photo_url || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                                {item.candidate.nickname.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-foreground">{item.candidate.nickname}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Ended • {format(item.date, "MMM d")}
                                {(item.candidate as any).end_reason && (
                                  <> — {(item.candidate as any).end_reason}</>
                                )}
                              </p>
                            </div>
                          </button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleReopenRelationship(item.candidate.id, e)}
                            disabled={reopeningId === item.candidate.id}
                            className="shrink-0 text-xs h-7 px-2"
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${reopeningId === item.candidate.id ? 'animate-spin' : ''}`} />
                            Reopen
                          </Button>
                        </div>
                      );
                    }

                    if (item.type === "no_contact") {
                      return (
                        <div key={`nc-${item.candidate.id}-${idx}`} className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
                          <button
                            onClick={() => navigate(`/candidate/${item.candidate.id}`)}
                            className="flex items-center gap-3 flex-1"
                          >
                            <Avatar className="w-10 h-10 border border-slate-300">
                              <AvatarImage src={item.candidate.photo_url || undefined} />
                              <AvatarFallback className="bg-slate-500/20 text-slate-600 text-sm">
                                {item.candidate.nickname.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-foreground">{item.candidate.nickname}</p>
                              <p className="text-xs text-slate-600 flex items-center gap-1">
                                <Ban className="w-3 h-3" />
                                No Contact — Day {item.candidate.no_contact_day || 1} • {format(item.date, "MMM d")}
                              </p>
                            </div>
                          </button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleEndNoContact(item.candidate.id, e)}
                            disabled={endingNoContactId === item.candidate.id}
                            className="shrink-0 text-xs h-7 px-2"
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${endingNoContactId === item.candidate.id ? 'animate-spin' : ''}`} />
                            End NC
                          </Button>
                        </div>
                      );
                    }

                    if (item.type === "notification" && item.notification && item.candidate) {
                      const getNotifStyles = () => {
                        switch (item.notification!.notifType) {
                          case "oxytocin": return { bg: "bg-primary/5 hover:bg-primary/10", iconBg: "bg-primary/10", text: "text-primary" };
                          case "red_flags": return { bg: "bg-muted hover:bg-muted/80", iconBg: "bg-muted", text: "text-foreground" };
                          case "high_match": return { bg: "bg-primary/5 hover:bg-primary/10", iconBg: "bg-primary/10", text: "text-primary" };
                          case "low_match": return { bg: "bg-muted hover:bg-muted/80", iconBg: "bg-muted", text: "text-muted-foreground" };
                          case "stale": return { bg: "bg-muted hover:bg-muted/80", iconBg: "bg-muted", text: "text-muted-foreground" };
                          case "advice": return { bg: "bg-primary/5 hover:bg-primary/10", iconBg: "bg-primary/10", text: "text-primary" };
                          default: return { bg: "bg-primary/10 hover:bg-primary/20", iconBg: "bg-primary/20", text: "text-primary" };
                        }
                      };
                      const getNotifIcon = () => {
                        switch (item.notification!.icon) {
                          case "flame": return <Flame className="w-4 h-4" />;
                          case "alert": return <AlertTriangle className="w-4 h-4" />;
                          case "heart": return <Heart className="w-4 h-4" />;
                          case "trending": return <TrendingUp className="w-4 h-4" />;
                          case "clock": return <Clock className="w-4 h-4" />;
                          case "lightbulb": return <Lightbulb className="w-4 h-4" />;
                          default: return <Bell className="w-4 h-4" />;
                        }
                      };
                      const styles = getNotifStyles();
                      return (
                        <button
                          key={`notif-${item.notification.notifType}-${item.candidate.id}-${idx}`}
                          onClick={() => navigate(`/candidate/${item.candidate!.id}`)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${styles.bg}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg} ${styles.text}`}>
                            {getNotifIcon()}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className={`text-sm font-medium ${styles.text}`}>{item.notification.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.notification.message}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                      );
                    }

                    return null;
                  })}
                  
                  {recap.recentActivity.length > 5 && (
                    <button
                      onClick={() => setShowAllActivity(!showAllActivity)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAllActivity ? 'rotate-180' : ''}`} />
                      {showAllActivity ? 'See Less' : `See ${recap.recentActivity.length - 5} More`}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Healing Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <HealingScoreCard />
            </motion.div>

            {/* Self-Discovery Quizzes CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
            >
              <SelfDiscoveryCTA userId={user.id} variant="compact" />
            </motion.div>

            {/* Messages from DateBetter */}
            {adminMessages.length > 0 && (
              <motion.div 
                className="rounded-2xl bg-card border border-border overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="px-4 py-3 bg-[image:var(--gradient-subtle)] border-b border-border/50">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Messages
                    {adminMessages.filter(m => !m.is_read).length > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-primary text-primary-foreground">
                        {adminMessages.filter(m => !m.is_read).length} new
                      </span>
                    )}
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {adminMessages.slice(0, 3).map((msg) => {
                    const isFromAdmin = msg.sender_type !== 'user';
                    const handleMarkAsRead = async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (!msg.is_read) {
                        await supabase
                          .from("admin_messages")
                          .update({ is_read: true })
                          .eq("id", msg.id);
                        setAdminMessages(prev => 
                          prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m)
                        );
                      }
                    };

                    const handleClearMessage = async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (!msg.is_read) {
                        await supabase
                          .from("admin_messages")
                          .update({ is_read: true })
                          .eq("id", msg.id);
                      }
                      setAdminMessages(prev => prev.filter(m => m.id !== msg.id));
                      toast.success("Message cleared");
                    };

                    return (
                      <div
                        key={msg.id}
                        onClick={handleMarkAsRead}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                          msg.is_read 
                            ? 'bg-muted/50 hover:bg-muted' 
                            : 'bg-primary/10 hover:bg-primary/20 border border-primary/20'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          msg.is_read ? 'bg-muted' : 'bg-primary/20'
                        }`}>
                          {isFromAdmin ? (
                            <Bell className={`w-4 h-4 ${msg.is_read ? 'text-muted-foreground' : 'text-primary'}`} />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${msg.is_read ? 'text-foreground' : 'text-primary'}`}>
                              {msg.title}
                            </p>
                            {!msg.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                            {!isFromAdmin && (
                              <span className="text-xs text-muted-foreground">(Your reply)</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isFromAdmin && !msg.reply_to && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingToMessage(msg);
                                setReplyDialogOpen(true);
                              }}
                              className="text-xs h-7 px-2 text-muted-foreground hover:text-primary"
                            >
                              <Reply className="w-3 h-3 mr-1" />
                              Reply
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleClearMessage}
                            className="text-xs h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {adminMessages.length > 3 && (
                    <button
                      onClick={() => navigate("/notifications")}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      See All Messages
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            <UpgradeNudge />
            <FreeUpgradeBanner />

            {/* Pipeline Overflow Warning */}
            {activeCandidateCount >= 10 && !pipelineOverflowDismissed && (
              <div className="rounded-xl border border-border bg-muted/50 p-3 flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-600">Pipeline overloaded</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You have {activeCandidateCount} active leads. It&apos;s hard to give everyone quality attention — consider archiving anyone you&apos;re no longer pursuing.
                  </p>
                  <button
                    onClick={() => { setActiveTab("manage"); setStatusFilter("active"); }}
                    className="text-xs text-amber-600 font-medium mt-1.5 hover:underline"
                  >
                    Triage now →
                  </button>
                </div>
                <button
                  onClick={() => {
                    setPipelineOverflowDismissed(true);
                    try { localStorage.setItem("pipeline_overflow_dismissed", "true"); } catch {}
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {candidates.length === 0 && (
              <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border border-dashed py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Candidates Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your dating journey by adding your first candidate.
                </p>
                <Button onClick={() => navigate("/add-candidate")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Candidate
                </Button>
              </div>
            )}

            {/* D.E.V.I. CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <DeviCTA />
            </motion.div>

            {/* Wins Stats */}
            {wins.total > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <WinsStats
                  totalWins={wins.total}
                  thisMonthWins={wins.thisMonth}
                  winsByType={wins.byType}
                />
              </motion.div>
            )}

            {/* Referral CTA at bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <ReferralCard />
            </motion.div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 mt-0">
            {/* Quick Actions for Manage Tab */}
            <motion.div 
              className="grid grid-cols-2 gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Button
                onClick={() => navigate("/add-candidate")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Candidate
              </Button>
              <Button variant="outline" onClick={() => navigate("/patterns")} className="w-full border-border text-foreground hover:bg-primary/10">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Patterns
              </Button>
            </motion.div>

            {/* Quality Filter Indicator */}
            {qualityFilter && (
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${qualityFilter === "good" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  Showing: {qualityFilter === "good" ? "Good Vibes" : "Watch Out"}
                </span>
                <button 
                  onClick={() => setQualityFilter(null)} 
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Search and Filters */}
            {candidates.length > 0 ? (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
              >
                <CandidateSearch value={searchQuery} onChange={setSearchQuery} />
                <CandidateFilters
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
                <div data-tour="candidates-list">
                  <CandidatesList
                    candidates={filteredAndSortedCandidates}
                    onUpdate={fetchData}
                    showGroupHeaders={!searchQuery && sortBy === "status"}
                    candidateAlerts={candidateAlerts}
                  />
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border border-dashed py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Candidates Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your dating journey by adding your first candidate.
                </p>
                <Button onClick={() => navigate("/add-candidate")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Candidate
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Willingness to Pay Survey */}
      <WillingnessToPaySurvey
        open={showWtpSurvey}
        onOpenChange={setShowWtpSurvey}
        candidateCount={candidates.length}
      />

      {/* Reply to Admin Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to Admin</DialogTitle>
            <DialogDescription>
              {replyingToMessage && (
                <span className="block mt-2 p-2 bg-muted rounded text-sm">
                  <strong>Original:</strong> {replyingToMessage.title}
                  <br />
                  {replyingToMessage.message}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Type your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={4}
            />
            <Button 
              onClick={handleSendReply} 
              disabled={sendingReply || !replyContent.trim()}
              className="w-full"
            >
              {sendingReply ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Reply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Disclosure - fixed at bottom for App Store compliance */}
      <div className="fixed bottom-16 left-0 right-0 z-20 pb-safe-bottom bg-gradient-to-t from-background via-background/95 to-transparent pt-4 pb-2">
        <div className="max-w-lg mx-auto px-4">
          <AIDisclosure variant="compact" className="justify-center" />
        </div>
      </div>
      
      {/* Devi Intro Dialog for new users */}
      <DeviIntroDialog
        open={showDeviIntro && !showTour}
        onOpenChange={setShowDeviIntro}
        onDismiss={dismissDeviIntro}
      />

      {/* Text Simulator - candidate picker + simulator */}
      {textSimOpen && !textSimCandidate && candidates.length > 1 && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-background w-full h-[100dvh] flex flex-col"
          >
            <div className="p-4 space-y-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Who do you want to text?</h3>
                <Button variant="ghost" size="icon" onClick={() => setTextSimOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Pick a candidate to simulate a conversation with instead of reaching out.</p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-28 space-y-1">
              {candidates.map(c => (
                <button
                  key={c.id}
                  onClick={() => setTextSimCandidate(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
                    {c.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.nickname}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{(c.status || "").replace(/_/g, " ")}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {textSimCandidate && (
        <TextSimulator
          open={textSimOpen}
          onOpenChange={(open) => {
            setTextSimOpen(open);
            if (!open) setTextSimCandidate(null);
          }}
          candidateName={textSimCandidate.nickname}
          candidateId={textSimCandidate.id}
          candidateContext={[
            textSimCandidate.notes,
            textSimCandidate.end_reason ? `Ended because: ${textSimCandidate.end_reason}` : null,
            textSimCandidate.status ? `Status: ${textSimCandidate.status}` : null,
            textSimCandidate.their_attachment_style ? `Attachment: ${textSimCandidate.their_attachment_style}` : null,
          ].filter(Boolean).join(". ")}
          userGender={profile?.gender_identity?.includes("man") ? "male" : "female"}
        />
      )}
    </div>
  );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning ☀️";
  if (hour < 17) return "Good afternoon 🌤️";
  if (hour < 21) return "Good evening 🌙";
  return "Sweet dreams ✨";
}

export default Dashboard;
