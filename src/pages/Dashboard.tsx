import React, { useEffect, useState, useMemo } from "react";
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
  RefreshCw,
  Lightbulb,
  Bot,
} from "lucide-react";
import { CandidateSearch } from "@/components/dashboard/CandidateSearch";
import { CandidateFilters, SortOption, StatusFilter } from "@/components/dashboard/CandidateFilters";
import { CandidatesList } from "@/components/dashboard/CandidatesList";
import { LogInteractionDialog } from "@/components/dashboard/LogInteractionDialog";
import { useTour, DASHBOARD_TOUR_STEPS } from "@/components/tour";
import { differenceInDays, addDays, format } from "date-fns";
import heroCouple from "@/assets/hero-couple.jpeg";
import { UpgradeNudge } from "@/components/subscription/UpgradeNudge";
import { FreeUpgradeBanner } from "@/components/subscription/FreeUpgradeBanner";
import { DailyLoggingCTA } from "@/components/dashboard/DailyLoggingCTA";
import { ReferralCard } from "@/components/dashboard/ReferralCard";

type Profile = Tables<"profiles">;
type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;

type RecentActivityItem = {
  type: "matched" | "interacted" | "ended" | "no_contact" | "notification";
  candidate?: Candidate;
  interaction?: Interaction;
  date: Date;
  notification?: {
    notifType: "oxytocin" | "red_flags" | "high_match" | "low_match" | "stale" | "advice";
    title: string;
    message: string;
    icon: "flame" | "alert" | "heart" | "trending" | "clock" | "lightbulb";
  };
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [sortBy, setSortBy] = useState<SortOption>("status");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [qualityFilter, setQualityFilter] = useState<"good" | "bad" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reopeningId, setReopeningId] = useState<string | null>(null);

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

  // Start tour for new users
  useEffect(() => {
    if (!loading && profile && !hasCompletedTour("dashboard")) {
      const timer = setTimeout(() => {
        startTour("dashboard", DASHBOARD_TOUR_STEPS);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, profile, startTour, hasCompletedTour]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [profileRes, candidatesRes, interactionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
        supabase.from("candidates").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false }),
        supabase.from("interactions").select("*").eq("user_id", user!.id).order("interaction_date", { ascending: false }).limit(50),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (candidatesRes.data) setCandidates(candidatesRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate cycle phase alerts
  const cycleAlerts = useMemo(() => {
    if (!profile?.track_cycle || !profile?.last_period_date) return null;

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
      "move in together", "intense", "overwhelming"
    ];
    
    candidates.forEach((candidate) => {
      const candidateInteractions = interactions.filter((i) => i.candidate_id === candidate.id);
      
      // Check candidate notes for love bombing language
      const candidateNotes = (candidate.notes || "").toLowerCase();
      const hasLoveBombingInCandidateNotes = loveBombingPhrases.some(phrase => candidateNotes.includes(phrase));
      
      if (hasLoveBombingInCandidateNotes) {
        alerts.push({ candidate, reason: "Love bombing signs in notes" });
        return; // Already flagged
      }
      
      // Check interaction notes
      const notesText = candidateInteractions.map(i => (i.notes || "").toLowerCase()).join(" ");
      const hasLoveBombingLanguage = loveBombingPhrases.some(phrase => notesText.includes(phrase));
      
      if (hasLoveBombingLanguage) {
        alerts.push({ candidate, reason: "Love bombing language detected" });
        return;
      }
      
      // Check for rapid interaction frequency (original logic)
      if (candidateInteractions.length < 3) return;
      
      const firstInteractionDate = candidateInteractions.length > 0 
        ? new Date(candidateInteractions[candidateInteractions.length - 1].interaction_date || candidate.created_at || "")
        : null;
      
      if (firstInteractionDate) {
        const daysSinceFirst = differenceInDays(new Date(), firstInteractionDate);
        const interactionsPerWeek = candidateInteractions.length / Math.max(1, daysSinceFirst / 7);
        
        if (daysSinceFirst <= 14 && candidateInteractions.length >= 7) {
          alerts.push({ candidate, reason: "Very intense start — 7+ interactions in 2 weeks" });
        } else if (interactionsPerWeek >= 5 && daysSinceFirst <= 30) {
          alerts.push({ candidate, reason: "Rapid escalation detected" });
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
        color: daysSince <= 2 ? "bg-pink-500/20 text-pink-600" : "bg-amber-500/20 text-amber-600"
      });
    });
    
    // Love bombing alerts
    loveBombingAlerts.forEach(({ candidate }) => {
      if (!alertsMap[candidate.id]) alertsMap[candidate.id] = [];
      alertsMap[candidate.id].push({
        type: "love_bombing",
        label: "⚠️ Love bombing?",
        color: "bg-orange-500/20 text-orange-600"
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

    // Oxytocin alerts (recent intimacy)
    interactions
      .filter((i) => i.interaction_type === "intimate")
      .forEach((interaction) => {
        const daysSince = differenceInDays(today, new Date(interaction.interaction_date || ""));
        if (daysSince <= 3) {
          const candidate = candidates.find((c) => c.id === interaction.candidate_id);
          if (candidate) {
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
  }, [candidates, interactions]);

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = [...candidates];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => c.nickname.toLowerCase().includes(query));
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((c) => c.status !== "archived" && c.status !== "no_contact");
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
      <div className="min-h-screen flex items-center justify-center bg-background">
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

  const activeCandidateCount = candidates.filter(
    (c) => c.status !== "archived" && c.status !== "no_contact"
  ).length;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Hero Background Image */}
      <div className="fixed inset-0 z-0">
        <img 
          src={heroCouple} 
          alt="" 
          className="w-full h-full object-cover object-top opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border bg-background/80">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {profile?.name ? `Hello ${profile.name}!` : "Hello!"}
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-primary/10" onClick={() => navigate("/notifications")}>
                <Bell className="w-5 h-5" />
                {(oxytocinAlerts.length > 0 || loveBombingAlerts.length > 0 || postIntimacyDropAlerts.length > 0 || candidates.filter(c => c.no_contact_active).length > 0 || cycleAlerts) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
              <Button data-tour="settings" variant="ghost" size="icon" className="text-foreground hover:bg-primary/10" onClick={() => navigate("/settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-4 max-w-lg pb-20">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setQualityFilter(null); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 backdrop-blur-sm border border-border">
            <TabsTrigger value="home" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Home</TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Manage Candidates</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4 mt-0">
            {/* Quick Actions */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  data-tour="add-candidate"
                  onClick={() => navigate("/add-candidate")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 gap-2 font-semibold shadow-lg shadow-primary/30"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Candidate</span>
                </Button>
                <div data-tour="log-interaction">
                  <LogInteractionDialog candidates={candidates} compact />
                </div>
              </div>
              <UpgradeNudge />
              <FreeUpgradeBanner />
              <DailyLoggingCTA interactions={interactions} candidates={candidates} />
              <ReferralCard />
              <Button
                variant="outline"
                onClick={() => navigate("/patterns")}
                className="w-full h-10 gap-2 border-border text-foreground hover:bg-primary/10"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">View Patterns</span>
              </Button>
            </div>

            {/* Alerts */}
            {(() => {
              const alerts: { key: string; icon: React.ReactNode; label: string; sub?: string; color: string; onClick?: () => void }[] = [];
              
              // D.E.V.I. AI Coach badge
              alerts.push({
                key: "devi",
                icon: <Bot className="w-3 h-3" />,
                label: "D.E.V.I.",
                sub: "AI Coach",
                color: "bg-primary/20 text-primary border-primary/30",
                onClick: () => navigate("/devi"),
              });

              // Cycle Setup CTA - only show if not completed onboarding (they haven't consciously skipped it yet)
              if (profile?.track_cycle && !profile?.last_period_date && !profile?.onboarding_completed) {
                alerts.push({
                  key: "cycle-setup",
                  icon: <Droplet className="w-3 h-3" />,
                  label: "Set up cycle",
                  color: "bg-secondary/20 text-secondary border-secondary/30",
                  onClick: () => navigate("/settings?tab=preferences&section=cycle"),
                });
              }

              // Cycle Alert
              if (cycleAlerts) {
                alerts.push({
                  key: "cycle-alert",
                  icon: cycleAlerts.icon,
                  label: cycleAlerts.phase,
                  sub: `Day ${cycleAlerts.dayInCycle}`,
                  color: "bg-accent/20 text-accent-foreground border-accent/30",
                });
              }

              // Oxytocin Alerts - bonding hormone high after intimacy
              oxytocinAlerts.forEach(({ candidate, daysSince, phase }) => {
                alerts.push({
                  key: `oxy-${candidate.id}`,
                  icon: <Flame className="w-3 h-3" />,
                  label: `${candidate.nickname}`,
                  sub: daysSince <= 2 ? "🔥 Bonding high" : "Clearing",
                  color: daysSince <= 2 ? "bg-pink-500/20 text-pink-600 border-pink-500/30" : "bg-amber-500/20 text-amber-600 border-amber-500/30",
                  onClick: () => navigate(`/candidate/${candidate.id}`),
                });
              });

              // Love Bombing Alerts - rapid escalation warning
              loveBombingAlerts.forEach(({ candidate, reason }) => {
                alerts.push({
                  key: `lb-${candidate.id}`,
                  icon: <AlertTriangle className="w-3 h-3" />,
                  label: candidate.nickname,
                  sub: "⚠️ Love bombing?",
                  color: "bg-orange-500/20 text-orange-600 border-orange-500/30",
                  onClick: () => navigate(`/candidate/${candidate.id}`),
                });
              });

              // No Contact Alerts
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

              // Recently Ended Relationships (within 48 hours)
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
                <div data-tour="cycle-status">
                <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
                  <CarouselContent className="-ml-2">
                    {alerts.map((alert) => (
                      <CarouselItem key={alert.key} className="pl-2 basis-auto">
                        <button
                          onClick={alert.onClick}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${alert.color}`}
                        >
                          {alert.icon}
                          <span>{alert.label}</span>
                          {alert.sub && <span className="opacity-60">• {alert.sub}</span>}
                        </button>
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
                </div>
              );
            })()}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div 
                className="cursor-pointer hover:scale-[1.02] transition-all rounded-xl p-3 bg-primary/10 backdrop-blur-sm border border-primary/20 text-center" 
                onClick={() => { setActiveTab("manage"); setStatusFilter("active"); setQualityFilter(null); }}
              >
                <div className="text-2xl font-bold text-primary">{activeCandidateCount}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div 
                className="cursor-pointer hover:scale-[1.02] transition-all rounded-xl p-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-center" 
                onClick={() => { setActiveTab("manage"); setStatusFilter("active"); setQualityFilter("good"); }}
              >
                <div className="text-2xl font-bold text-emerald-600">{recap.goodCandidates.length}</div>
                <div className="text-xs text-muted-foreground">Good Vibes</div>
              </div>
              <div 
                className="cursor-pointer hover:scale-[1.02] transition-all rounded-xl p-3 bg-rose-500/10 backdrop-blur-sm border border-rose-500/20 text-center" 
                onClick={() => { setActiveTab("manage"); setStatusFilter("active"); setQualityFilter("bad"); }}
              >
                <div className="text-2xl font-bold text-rose-600">{recap.badCandidates.length}</div>
                <div className="text-xs text-muted-foreground">Watch Out</div>
              </div>
            </div>

            {/* Candidate Recap */}
            {candidates.length > 0 && (
              <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Recent Activity
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {recap.recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                  {recap.recentActivity.map((item, idx) => {
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
                              <ThumbsUp className="w-4 h-4 text-emerald-500" />
                            )}
                            {item.interaction.overall_feeling && item.interaction.overall_feeling <= 2 && (
                              <ThumbsDown className="w-4 h-4 text-rose-500" />
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
                          case "oxytocin": return { bg: "bg-pink-500/10 hover:bg-pink-500/20", iconBg: "bg-pink-500/20", text: "text-pink-600" };
                          case "red_flags": return { bg: "bg-amber-500/10 hover:bg-amber-500/20", iconBg: "bg-amber-500/20", text: "text-amber-600" };
                          case "high_match": return { bg: "bg-emerald-500/10 hover:bg-emerald-500/20", iconBg: "bg-emerald-500/20", text: "text-emerald-600" };
                          case "low_match": return { bg: "bg-orange-500/10 hover:bg-orange-500/20", iconBg: "bg-orange-500/20", text: "text-orange-600" };
                          case "stale": return { bg: "bg-slate-500/10 hover:bg-slate-500/20", iconBg: "bg-slate-500/20", text: "text-slate-600" };
                          case "advice": return { bg: "bg-purple-500/10 hover:bg-purple-500/20", iconBg: "bg-purple-500/20", text: "text-purple-600" };
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
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.iconBg} ${styles.text}`}>
                            {getNotifIcon()}
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`text-sm font-medium ${styles.text}`}>{item.notification.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.notification.message}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      );
                    }

                    return null;
                  })}
                </div>
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
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 mt-0">
            {/* Quick Actions for Manage Tab */}
            <div className="grid grid-cols-2 gap-2">
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
            </div>

            {/* Quality Filter Indicator */}
            {qualityFilter && (
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${qualityFilter === "good" ? "bg-emerald-500/20 text-emerald-600" : "bg-rose-500/20 text-rose-600"}`}>
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
              <div className="space-y-3">
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
                    showGroupHeaders={statusFilter === "all" && sortBy === "status" && !qualityFilter}
                    candidateAlerts={candidateAlerts}
                  />
                </div>
              </div>
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
    </div>
  );
};

function getGreeting(name?: string): string {
  return name ? `Hello ${name}!` : "Hello!";
}

export default Dashboard;
