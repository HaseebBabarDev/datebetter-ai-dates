import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  Heart,
  AlertTriangle,
  Users,
  MessageCircle,
  Clock,
  Target,
  Lightbulb,
  BarChart3,
  PieChart,
  Share2,
  Star,
  Trophy,
  Check,
  X,
  HeartHandshake,
  HeartCrack,
  Home,
  Ban,
  Shield,
  Sparkles,
  MessageSquare,
  Brain,
  Repeat,
  Timer,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { WinsStats, useDeviWins } from "@/components/devi/WinsStats";

// Duration parsing utilities
const DURATION_ORDER = ['< 1 month', '1-3 months', '3-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'];

const parseDurationToMonths = (duration: string): number => {
  switch (duration) {
    case '< 1 month': return 0.5;
    case '1-3 months': return 2;
    case '3-6 months': return 4.5;
    case '6-12 months': return 9;
    case '1-2 years': return 18;
    case '2-5 years': return 42;
    case '5+ years': return 72;
    default: return 0;
  }
};

const getDurationLabel = (duration: string): string => {
  switch (duration) {
    case '< 1 month': return '<1mo';
    case '1-3 months': return '1-3mo';
    case '3-6 months': return '3-6mo';
    case '6-12 months': return '6-12mo';
    case '1-2 years': return '1-2yr';
    case '2-5 years': return '2-5yr';
    case '5+ years': return '5+yr';
    default: return duration;
  }
};

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;
type AdviceTracking = Tables<"advice_tracking">;
type DeviConversation = Tables<"devi_conversations">;
type DeviMessage = Tables<"devi_messages">;

type NoContactProgress = Tables<"no_contact_progress">;

interface CandidateDeviStats {
  candidateId: string;
  nickname: string;
  conversationCount: number;
  messageCount: number;
  lastChatDate: string | null;
}

interface PastRelationship {
  duration: string;
  howEnded: string;
  traumas: string[];
  notes?: string;
}

interface DurationAnalysis {
  avgDurationMonths: number;
  durationDistribution: { duration: string; count: number }[];
  traumaByDuration: { duration: string; traumas: { trauma: string; count: number }[] }[];
  longestRelationship: string | null;
  shortestRelationship: string | null;
  hasData: boolean;
}

interface TraumaPatternAnalysis {
  commonTraumas: { trauma: string; count: number; percentage: number }[];
  endingPatterns: { ending: string; count: number }[];
  totalRelationships: number;
  hasTraumaData: boolean;
  traumaNotes: string | null;
  durationAnalysis: DurationAnalysis;
}

interface PatternStats {
  totalCandidates: number;
  activeCandidates: number;
  archivedCandidates: number;
  noContactCandidates: number;
  avgCompatibilityScore: number;
  totalInteractions: number;
  commonRedFlags: { flag: string; count: number }[];
  commonGreenFlags: { flag: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  interactionTypes: { type: string; count: number }[];
  initiatorStats: { initiator: string; count: number }[];
  avgOverallFeeling: number;
  adviceAcceptanceRate: number;
  totalAdviceGiven: number;
  acceptedAdvice: number;
  declinedAdvice: number;
  pendingAdvice: number;
  meetingSources: { source: string; count: number }[];
  dateTypeSuccess: { type: string; avgFeeling: number; count: number }[];
  relationshipOutcomes: {
    active: number;
    ended: number;
    activeWithAcceptedAdvice: number;
    endedWithDeclinedAdvice: number;
  };
  noContactMetrics: {
    totalStarted: number;
    currentlyActive: number;
    completedJourneys: number;
    totalHooverAttempts: number;
    timesBrokeNC: number;
    avgDaysCompleted: number;
  };
  ncTrendData: { day: number; reached: number; hoover: number }[];
  deviMetrics: {
    totalConversations: number;
    totalMessages: number;
    candidatesWithChats: number;
    candidatesWithoutChats: number;
    avgMessagesPerConversation: number;
  };
  candidateDeviStats: CandidateDeviStats[];
  traumaPatterns: TraumaPatternAnalysis;
}

const Patterns = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PatternStats | null>(null);
  
  // Devi wins tracking
  const { wins } = useDeviWins(user?.id);

  useEffect(() => {
    if (user) {
      fetchPatternData();
    }
  }, [user]);

  const fetchPatternData = async () => {
    try {
      const [candidatesRes, interactionsRes, adviceRes, ncProgressRes, deviConversationsRes, deviMessagesRes, profileRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("user_id", user!.id),
        supabase.from("interactions").select("*").eq("user_id", user!.id),
        supabase.from("advice_tracking").select("*").eq("user_id", user!.id),
        supabase.from("no_contact_progress").select("*").eq("user_id", user!.id),
        supabase.from("devi_conversations").select("*").eq("user_id", user!.id),
        supabase.from("devi_messages").select("*").eq("user_id", user!.id),
        supabase.from("profiles").select("past_relationship_traumas, relationship_trauma_notes").eq("user_id", user!.id).single(),
      ]);

      const candidates = candidatesRes.data || [];
      const interactions = interactionsRes.data || [];
      const advice = adviceRes.data || [];
      const ncProgress = ncProgressRes.data || [];
      const deviConversations = deviConversationsRes.data || [];
      const deviMessages = deviMessagesRes.data || [];
      const profile = profileRes.data;

      // Analyze trauma patterns from past relationships
      const pastRelationships: PastRelationship[] = Array.isArray(profile?.past_relationship_traumas) 
        ? (profile.past_relationship_traumas as unknown as PastRelationship[])
        : [];
      
      const traumaCounts: Record<string, number> = {};
      const endingCounts: Record<string, number> = {};
      const durationCounts: Record<string, number> = {};
      const traumaByDuration: Record<string, Record<string, number>> = {};
      
      pastRelationships.forEach((rel) => {
        if (rel.traumas && Array.isArray(rel.traumas)) {
          rel.traumas.forEach((trauma: string) => {
            traumaCounts[trauma] = (traumaCounts[trauma] || 0) + 1;
          });
        }
        if (rel.howEnded) {
          endingCounts[rel.howEnded] = (endingCounts[rel.howEnded] || 0) + 1;
        }
        if (rel.duration) {
          durationCounts[rel.duration] = (durationCounts[rel.duration] || 0) + 1;
          
          // Track traumas by duration
          if (!traumaByDuration[rel.duration]) {
            traumaByDuration[rel.duration] = {};
          }
          if (rel.traumas && Array.isArray(rel.traumas)) {
            rel.traumas.forEach((trauma: string) => {
              traumaByDuration[rel.duration][trauma] = (traumaByDuration[rel.duration][trauma] || 0) + 1;
            });
          }
        }
      });

      const totalRelationships = pastRelationships.length;
      const commonTraumas = Object.entries(traumaCounts)
        .map(([trauma, count]) => ({ 
          trauma, 
          count, 
          percentage: totalRelationships > 0 ? Math.round((count / totalRelationships) * 100) : 0 
        }))
        .sort((a, b) => b.count - a.count);
      
      const endingPatterns = Object.entries(endingCounts)
        .map(([ending, count]) => ({ ending, count }))
        .sort((a, b) => b.count - a.count);

      // Duration analysis
      const durationDistribution = Object.entries(durationCounts)
        .map(([duration, count]) => ({ duration, count }))
        .sort((a, b) => DURATION_ORDER.indexOf(a.duration) - DURATION_ORDER.indexOf(b.duration));
      
      const durations = pastRelationships.map(r => r.duration).filter(Boolean);
      const avgDurationMonths = durations.length > 0
        ? durations.reduce((sum, d) => sum + parseDurationToMonths(d), 0) / durations.length
        : 0;
      
      const sortedDurations = [...durations].sort(
        (a, b) => parseDurationToMonths(b) - parseDurationToMonths(a)
      );
      
      const traumaByDurationArray = Object.entries(traumaByDuration)
        .map(([duration, traumas]) => ({
          duration,
          traumas: Object.entries(traumas)
            .map(([trauma, count]) => ({ trauma, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
        }))
        .sort((a, b) => DURATION_ORDER.indexOf(a.duration) - DURATION_ORDER.indexOf(b.duration));

      const durationAnalysis: DurationAnalysis = {
        avgDurationMonths,
        durationDistribution,
        traumaByDuration: traumaByDurationArray,
        longestRelationship: sortedDurations[0] || null,
        shortestRelationship: sortedDurations[sortedDurations.length - 1] || null,
        hasData: durations.length > 0,
      };

      const traumaPatterns: TraumaPatternAnalysis = {
        commonTraumas,
        endingPatterns,
        totalRelationships,
        hasTraumaData: totalRelationships > 0,
        traumaNotes: profile?.relationship_trauma_notes || null,
        durationAnalysis,
      };

      // Calculate stats
      const activeCandidates = candidates.filter(
        (c) => c.status !== "archived" && c.status !== "no_contact"
      );
      const archivedCandidates = candidates.filter((c) => c.status === "archived");
      const noContactCandidates = candidates.filter((c) => c.status === "no_contact");

      // Average compatibility score
      const scoresWithValues = candidates.filter((c) => c.compatibility_score !== null);
      const avgCompatibilityScore = scoresWithValues.length
        ? Math.round(
            scoresWithValues.reduce((sum, c) => sum + (c.compatibility_score || 0), 0) /
              scoresWithValues.length
          )
        : 0;

      // Red flags frequency
      const redFlagCounts: Record<string, number> = {};
      candidates.forEach((c) => {
        const flags = Array.isArray(c.red_flags) ? c.red_flags : [];
        flags.forEach((flag: string) => {
          redFlagCounts[flag] = (redFlagCounts[flag] || 0) + 1;
        });
      });
      const commonRedFlags = Object.entries(redFlagCounts)
        .map(([flag, count]) => ({ flag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Green flags frequency
      const greenFlagCounts: Record<string, number> = {};
      candidates.forEach((c) => {
        const flags = Array.isArray(c.green_flags) ? c.green_flags : [];
        flags.forEach((flag: string) => {
          greenFlagCounts[flag] = (greenFlagCounts[flag] || 0) + 1;
        });
      });
      const commonGreenFlags = Object.entries(greenFlagCounts)
        .map(([flag, count]) => ({ flag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Status distribution
      const statusCounts: Record<string, number> = {};
      candidates.forEach((c) => {
        const status = c.status || "just_matched";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const statusDistribution = Object.entries(statusCounts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      // Interaction types
      const interactionTypeCounts: Record<string, number> = {};
      interactions.forEach((i) => {
        interactionTypeCounts[i.interaction_type] =
          (interactionTypeCounts[i.interaction_type] || 0) + 1;
      });
      const interactionTypes = Object.entries(interactionTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Initiator stats
      const initiatorCounts: Record<string, number> = {};
      interactions.forEach((i) => {
        if (i.who_initiated) {
          initiatorCounts[i.who_initiated] = (initiatorCounts[i.who_initiated] || 0) + 1;
        }
      });
      const initiatorStats = Object.entries(initiatorCounts)
        .map(([initiator, count]) => ({ initiator, count }))
        .sort((a, b) => b.count - a.count);

      // Average overall feeling
      const feelingsWithValues = interactions.filter((i) => i.overall_feeling !== null);
      const avgOverallFeeling = feelingsWithValues.length
        ? feelingsWithValues.reduce((sum, i) => sum + (i.overall_feeling || 0), 0) /
          feelingsWithValues.length
        : 0;

      // Advice stats
      const respondedAdvice = advice.filter((a) => a.response !== null);
      const acceptedAdvice = advice.filter((a) => a.response === "accepted");
      const declinedAdvice = advice.filter((a) => a.response === "declined");
      const pendingAdvice = advice.filter((a) => a.response === null);
      const adviceAcceptanceRate = respondedAdvice.length
        ? Math.round((acceptedAdvice.length / respondedAdvice.length) * 100)
        : 0;

      // Relationship outcomes - active vs ended
      const activeStatuses = ['just_matched', 'texting', 'planning_date', 'dating', 'dating_casually', 'getting_serious', 'serious_relationship'];
      const endedStatuses = ['no_contact', 'archived'];
      const activeRelationships = candidates.filter((c) => activeStatuses.includes(c.status || ''));
      const endedRelationships = candidates.filter((c) => endedStatuses.includes(c.status || ''));

      // Correlation: advice acceptance vs relationship outcome
      const candidatesWithAcceptedAdvice = new Set(
        acceptedAdvice.map((a) => a.candidate_id)
      );
      const candidatesWithDeclinedAdvice = new Set(
        declinedAdvice.map((a) => a.candidate_id)
      );
      
      const activeWithAcceptedAdvice = activeRelationships.filter(
        (c) => candidatesWithAcceptedAdvice.has(c.id)
      ).length;
      const endedWithDeclinedAdvice = endedRelationships.filter(
        (c) => candidatesWithDeclinedAdvice.has(c.id) && !candidatesWithAcceptedAdvice.has(c.id)
      ).length;

      // Meeting sources
      const sourceCounts: Record<string, number> = {};
      candidates.forEach((c) => {
        const source = c.met_app || c.met_via || "Unknown";
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      const meetingSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Date type success rates (average feeling per type)
      const dateTypeStats: Record<string, { total: number; count: number }> = {};
      interactions.forEach((i) => {
        if (i.overall_feeling !== null) {
          if (!dateTypeStats[i.interaction_type]) {
            dateTypeStats[i.interaction_type] = { total: 0, count: 0 };
          }
          dateTypeStats[i.interaction_type].total += i.overall_feeling;
          dateTypeStats[i.interaction_type].count += 1;
        }
      });
      const dateTypeSuccess = Object.entries(dateTypeStats)
        .map(([type, { total, count }]) => ({
          type,
          avgFeeling: Math.round((total / count) * 10) / 10,
          count,
        }))
        .sort((a, b) => b.avgFeeling - a.avgFeeling)
        .slice(0, 6);

      // No Contact Metrics
      const candidatesWhoStartedNC = candidates.filter(
        (c) => c.no_contact_start_date !== null
      );
      const currentlyActiveNC = candidates.filter(
        (c) => c.no_contact_active === true
      );
      const completedJourneys = candidates.filter(
        (c) => c.no_contact_day && c.no_contact_day >= 30
      );
      const totalHooverAttempts = ncProgress.filter((p) => p.hoover_attempt === true).length;
      const timesBrokeNC = ncProgress.filter((p) => p.broke_nc === true).length;
      
      // Calculate avg days completed for those who started NC
      const daysPerCandidate: Record<string, number> = {};
      ncProgress.forEach((p) => {
        if (!daysPerCandidate[p.candidate_id] || p.day_number > daysPerCandidate[p.candidate_id]) {
          daysPerCandidate[p.candidate_id] = p.day_number;
        }
      });
      const allDays = Object.values(daysPerCandidate);
      const avgDaysCompleted = allDays.length
        ? Math.round(allDays.reduce((sum, d) => sum + d, 0) / allDays.length)
        : 0;

      // NC Trend Data - how many people reached each day
      const ncTrendData: { day: number; reached: number; hoover: number }[] = [];
      for (let day = 1; day <= 30; day++) {
        const reachedThisDay = ncProgress.filter((p) => p.day_number >= day).length;
        const hooverOnDay = ncProgress.filter((p) => p.day_number === day && p.hoover_attempt).length;
        ncTrendData.push({ day, reached: reachedThisDay, hoover: hooverOnDay });
      }

      // Devi Engagement Metrics
      const conversationsWithCandidates = deviConversations.filter((c) => c.candidate_id !== null);
      const candidateIdsWithChats = new Set(conversationsWithCandidates.map((c) => c.candidate_id));
      const candidatesWithChats = candidates.filter((c) => candidateIdsWithChats.has(c.id)).length;
      const candidatesWithoutChats = candidates.length - candidatesWithChats;
      
      const avgMessagesPerConversation = deviConversations.length > 0
        ? Math.round(deviMessages.length / deviConversations.length)
        : 0;

      // Per-candidate Devi stats
      const candidateDeviStats: CandidateDeviStats[] = candidates.map((candidate) => {
        const candidateConversations = deviConversations.filter((c) => c.candidate_id === candidate.id);
        const conversationIds = new Set(candidateConversations.map((c) => c.id));
        const candidateMessages = deviMessages.filter((m) => conversationIds.has(m.conversation_id));
        
        const lastConversation = candidateConversations
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

        return {
          candidateId: candidate.id,
          nickname: candidate.nickname,
          conversationCount: candidateConversations.length,
          messageCount: candidateMessages.length,
          lastChatDate: lastConversation?.updated_at || null,
        };
      }).sort((a, b) => b.messageCount - a.messageCount);

      setStats({
        totalCandidates: candidates.length,
        activeCandidates: activeCandidates.length,
        archivedCandidates: archivedCandidates.length,
        noContactCandidates: noContactCandidates.length,
        avgCompatibilityScore,
        totalInteractions: interactions.length,
        commonRedFlags,
        commonGreenFlags,
        statusDistribution,
        interactionTypes,
        initiatorStats,
        avgOverallFeeling,
        adviceAcceptanceRate,
        totalAdviceGiven: advice.length,
        acceptedAdvice: acceptedAdvice.length,
        declinedAdvice: declinedAdvice.length,
        pendingAdvice: pendingAdvice.length,
        meetingSources,
        dateTypeSuccess,
        relationshipOutcomes: {
          active: activeRelationships.length,
          ended: endedRelationships.length,
          activeWithAcceptedAdvice,
          endedWithDeclinedAdvice,
        },
        noContactMetrics: {
          totalStarted: candidatesWhoStartedNC.length,
          currentlyActive: currentlyActiveNC.length,
          completedJourneys: completedJourneys.length,
          totalHooverAttempts,
          timesBrokeNC,
          avgDaysCompleted,
        },
        ncTrendData,
        deviMetrics: {
          totalConversations: deviConversations.length,
          totalMessages: deviMessages.length,
          candidatesWithChats,
          candidatesWithoutChats,
          avgMessagesPerConversation,
        },
        candidateDeviStats,
        traumaPatterns,
      });
    } catch (error) {
      console.error("Error fetching pattern data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[image:var(--gradient-page)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatInteractionType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getInitiatorLabel = (initiator: string) => {
    switch (initiator) {
      case "me":
        return "You";
      case "them":
        return "Them";
      case "mutual":
        return "Mutual";
      default:
        return initiator;
    }
  };

  const shareToInstagram = async () => {
    if (!stats) return;
    
    // Create shareable content
    const shareText = `My Dating Patterns 💕\n\n` +
      `📊 ${stats.totalCandidates} people tracked\n` +
      `💫 ${stats.avgCompatibilityScore}% avg compatibility\n` +
      `${stats.dateTypeSuccess[0] ? `🏆 Best date type: ${formatInteractionType(stats.dateTypeSuccess[0].type)}` : ''}\n` +
      `${stats.avgOverallFeeling > 0 ? `⭐ ${stats.avgOverallFeeling.toFixed(1)}/5 avg date feeling` : ''}\n\n` +
      `Track your dating journey with intention ✨`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Dating Patterns',
          text: shareText,
        });
        toast.success("Ready to share!");
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard! Paste in your Instagram story");
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard!");
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[image:var(--gradient-page)] pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-[image:var(--gradient-header)] backdrop-blur-xl border-b border-border/50 z-10 pt-safe-top">
        <div className="px-4 py-3 max-w-lg mx-auto flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-xl hover:bg-primary/10 h-9 w-9"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="rounded-xl hover:bg-primary/10 h-9 w-9"
          >
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground text-base truncate">Dating Patterns</h1>
              <p className="text-xs text-muted-foreground truncate">Insights from your journey</p>
            </div>
          </div>
          {stats && stats.totalCandidates > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={shareToInstagram}
              className="rounded-xl hover:bg-primary/10 h-9 w-9"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="px-4 py-3 max-w-lg mx-auto">
        {!stats || stats.totalCandidates === 0 ? (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                <PieChart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">No Data Yet</h3>
              <p className="text-sm text-muted-foreground">
                Start adding candidates and logging interactions to see your dating patterns.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 h-auto p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="overview" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">Overview</TabsTrigger>
              <TabsTrigger value="dating" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">Dating</TabsTrigger>
              <TabsTrigger value="insights" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">Insights</TabsTrigger>
              <TabsTrigger value="nocontact" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">No Contact</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{stats.totalCandidates}</div>
                      <div className="text-xs text-muted-foreground">Total Candidates</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-2xl font-bold">{stats.totalInteractions}</div>
                      <div className="text-xs text-muted-foreground">Interactions</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-2xl font-bold">{stats.avgCompatibilityScore}%</div>
                      <div className="text-xs text-muted-foreground">Avg Compatibility</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-2xl font-bold">{stats.avgOverallFeeling.toFixed(1)}/5</div>
                      <div className="text-xs text-muted-foreground">Avg Date Feeling</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wins Stats */}
              {wins.total > 0 && (
                <WinsStats
                  totalWins={wins.total}
                  thisMonthWins={wins.thisMonth}
                  winsByType={wins.byType}
                />
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Where They Are
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.statusDistribution.map(({ status, count }) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-xs">{formatStatus(status)}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(count / stats.totalCandidates) * 100}
                          className="w-24 h-2"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {stats.totalCandidates > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-pink-500" />
                      Relationship Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-green-500/10 rounded-lg text-center">
                        <Heart className="w-4 h-4 mx-auto mb-1 text-green-600" />
                        <div className="text-xl font-bold text-green-600">{stats.relationshipOutcomes.active}</div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <HeartCrack className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-xl font-bold">{stats.relationshipOutcomes.ended}</div>
                        <div className="text-xs text-muted-foreground">Ended</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Dating Tab */}
            <TabsContent value="dating" className="space-y-4">
              {stats.commonRedFlags.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Recurring Red Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Patterns you keep encountering — be aware of these
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {stats.commonRedFlags.map(({ flag }) => (
                        <Badge
                          key={flag}
                          variant="secondary"
                          className="bg-destructive/10 text-destructive"
                        >
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.commonGreenFlags.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-green-500" />
                      What You Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Green flags you've noticed — keep looking for these
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {stats.commonGreenFlags.map(({ flag }) => (
                        <Badge key={flag} variant="secondary" className="bg-green-500/10 text-green-600">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.dateTypeSuccess.length > 0 && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-green-500" />
                      Best Date Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Date types with highest success (avg feeling)
                    </p>
                    {stats.dateTypeSuccess.map(({ type, avgFeeling, count }, index) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Star className="w-4 h-4 text-yellow-500" />}
                          <span className="text-xs">{formatInteractionType(type)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= Math.round(avgFeeling) ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">({count})</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {stats.interactionTypes.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Your Date Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stats.interactionTypes.map(({ type, count }) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-xs">{formatInteractionType(type)}</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(count / stats.totalInteractions) * 100}
                            className="w-24 h-2"
                          />
                          <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {stats.initiatorStats.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Who Makes the Move?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {stats.initiatorStats.map(({ initiator, count }) => {
                        const total = stats.initiatorStats.reduce((sum, i) => sum + i.count, 0);
                        const percent = Math.round((count / total) * 100);
                        return (
                          <div key={initiator} className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-xl font-bold">{percent}%</div>
                            <div className="text-xs text-muted-foreground">
                              {getInitiatorLabel(initiator)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.meetingSources.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Where You Meet People
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stats.meetingSources.map(({ source, count }) => (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-xs capitalize">{source.replace("_", " ")}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-4">
              {/* Trauma Pattern Analysis */}
              {stats.traumaPatterns.hasTraumaData && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="w-5 h-5 text-amber-500" />
                      Relationship Trauma Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Recurring themes from {stats.traumaPatterns.totalRelationships} past relationship{stats.traumaPatterns.totalRelationships !== 1 ? 's' : ''} — awareness is the first step to healing
                    </p>
                    
                    {/* Common Traumas */}
                    {stats.traumaPatterns.commonTraumas.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium">Recurring Patterns</span>
                        </div>
                        <div className="space-y-2">
                          {stats.traumaPatterns.commonTraumas.slice(0, 6).map(({ trauma, count, percentage }) => (
                            <div key={trauma} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs">{trauma}</span>
                                <span className="text-xs text-muted-foreground">
                                  {count}x ({percentage}%)
                                </span>
                              </div>
                              <Progress 
                                value={percentage} 
                                className="h-2 [&>div]:bg-amber-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* How Relationships Ended */}
                    {stats.traumaPatterns.endingPatterns.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <HeartCrack className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">How They Ended</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {stats.traumaPatterns.endingPatterns.map(({ ending, count }) => (
                            <Badge 
                              key={ending} 
                              variant="secondary" 
                              className="bg-muted text-muted-foreground"
                            >
                              {ending} ({count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trauma Notes Summary */}
                    {stats.traumaPatterns.traumaNotes && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground italic">
                          "{stats.traumaPatterns.traumaNotes.slice(0, 150)}{stats.traumaPatterns.traumaNotes.length > 150 ? '...' : ''}"
                        </p>
                      </div>
                    )}

                    {/* Insights */}
                    {stats.traumaPatterns.commonTraumas.length > 0 && (
                      <div className="p-3 bg-amber-500/10 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-amber-700">Insight</span>
                            {stats.traumaPatterns.commonTraumas[0] && (
                              <p className="text-xs text-muted-foreground">
                                "{stats.traumaPatterns.commonTraumas[0].trauma}" appeared in {stats.traumaPatterns.commonTraumas[0].percentage}% of your past relationships. 
                                Consider discussing this pattern with D.E.V.I.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Relationship Duration Analysis */}
              {stats.traumaPatterns.durationAnalysis.hasData && (
                <Card className="border-purple-500/30 bg-purple-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Timer className="w-5 h-5 text-purple-500" />
                      Relationship Duration Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Understanding how long your relationships typically last
                    </p>

                    {/* Duration Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-purple-500/10 rounded-lg text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {stats.traumaPatterns.durationAnalysis.avgDurationMonths < 12 
                            ? `${Math.round(stats.traumaPatterns.durationAnalysis.avgDurationMonths)}mo`
                            : `${(stats.traumaPatterns.durationAnalysis.avgDurationMonths / 12).toFixed(1)}yr`
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Length</div>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-lg text-center">
                        <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-600" />
                        <div className="text-sm font-bold text-green-600">
                          {getDurationLabel(stats.traumaPatterns.durationAnalysis.longestRelationship || '')}
                        </div>
                        <div className="text-xs text-muted-foreground">Longest</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <TrendingDown className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm font-bold">
                          {getDurationLabel(stats.traumaPatterns.durationAnalysis.shortestRelationship || '')}
                        </div>
                        <div className="text-xs text-muted-foreground">Shortest</div>
                      </div>
                    </div>

                    {/* Duration Distribution Chart */}
                    {stats.traumaPatterns.durationAnalysis.durationDistribution.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Duration Distribution</span>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.traumaPatterns.durationAnalysis.durationDistribution.map(d => ({
                              ...d,
                              label: getDurationLabel(d.duration)
                            }))}>
                              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                              <Tooltip 
                                formatter={(value: number) => [`${value} relationship${value !== 1 ? 's' : ''}`, 'Count']}
                                labelFormatter={(label) => `Duration: ${label}`}
                              />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                                {stats.traumaPatterns.durationAnalysis.durationDistribution.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={`hsl(270, 70%, ${60 - index * 5}%)`} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Trauma by Duration Correlation */}
                    {stats.traumaPatterns.durationAnalysis.traumaByDuration.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Trauma Patterns by Duration</span>
                        </div>
                        <div className="space-y-2">
                          {stats.traumaPatterns.durationAnalysis.traumaByDuration.slice(0, 4).map(({ duration, traumas }) => (
                            <div key={duration} className="space-y-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                {duration}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {traumas.map(({ trauma, count }) => (
                                  <Badge 
                                    key={trauma} 
                                    variant="secondary" 
                                    className="text-xs bg-purple-500/10 text-purple-700"
                                  >
                                    {trauma} ({count})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Duration Insight */}
                    {stats.traumaPatterns.durationAnalysis.avgDurationMonths > 0 && (
                      <div className="p-3 bg-purple-500/10 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-purple-700">Pattern Insight</span>
                            <p className="text-xs text-muted-foreground">
                              {stats.traumaPatterns.durationAnalysis.avgDurationMonths < 6
                                ? "Your relationships tend to be shorter. This could indicate quick identification of incompatibility, or patterns worth exploring with D.E.V.I."
                                : stats.traumaPatterns.durationAnalysis.avgDurationMonths < 18
                                ? "Your relationships typically last 6 months to over a year, suggesting you invest time before deciding."
                                : "You tend toward longer-term relationships, showing commitment to making things work."
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* D.E.V.I. Engagement Overview */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    D.E.V.I. Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-primary/10 rounded-lg text-center">
                      <MessageSquare className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <div className="text-lg font-bold text-primary">{stats.deviMetrics.totalConversations}</div>
                      <div className="text-xs text-muted-foreground">Conversations</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <MessageCircle className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-lg font-bold">{stats.deviMetrics.totalMessages}</div>
                      <div className="text-xs text-muted-foreground">Messages</div>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <Users className="w-4 h-4 mx-auto mb-1 text-green-600" />
                      <div className="text-lg font-bold text-green-600">{stats.deviMetrics.candidatesWithChats}</div>
                      <div className="text-xs text-muted-foreground">Discussed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Per-Candidate Devi Stats */}
              {stats.candidateDeviStats.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Devi Chats by Candidate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stats.candidateDeviStats.slice(0, 8).map((candidate) => (
                      <div 
                        key={candidate.candidateId} 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/candidate/${candidate.candidateId}`)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${candidate.conversationCount > 0 ? 'bg-green-500' : 'bg-amber-400'}`} />
                          <span className="text-sm truncate">{candidate.nickname}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-medium">{candidate.messageCount}</span>
                            <span className="text-xs text-muted-foreground ml-1">msgs</span>
                          </div>
                          {candidate.lastChatDate && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(candidate.lastChatDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {candidate.conversationCount === 0 && (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                              No chats
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {stats.totalAdviceGiven > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      AI Advice Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-green-500/10 rounded-lg text-center">
                        <Check className="w-4 h-4 mx-auto mb-1 text-green-600" />
                        <div className="text-lg font-bold text-green-600">{stats.acceptedAdvice}</div>
                        <div className="text-xs text-muted-foreground">Accepted</div>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-lg text-center">
                        <X className="w-4 h-4 mx-auto mb-1 text-red-500" />
                        <div className="text-lg font-bold text-red-500">{stats.declinedAdvice}</div>
                        <div className="text-xs text-muted-foreground">Declined</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-lg font-bold">{stats.pendingAdvice}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Acceptance Rate</span>
                        <span className="text-xs font-medium">{stats.adviceAcceptanceRate}%</span>
                      </div>
                      <Progress value={stats.adviceAcceptanceRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {(stats.relationshipOutcomes.activeWithAcceptedAdvice > 0 || stats.relationshipOutcomes.endedWithDeclinedAdvice > 0) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-pink-500" />
                      Advice Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.relationshipOutcomes.activeWithAcceptedAdvice > 0 && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          {stats.relationshipOutcomes.activeWithAcceptedAdvice} active relationship{stats.relationshipOutcomes.activeWithAcceptedAdvice > 1 ? 's' : ''} followed advice
                        </p>
                      )}
                      {stats.relationshipOutcomes.endedWithDeclinedAdvice > 0 && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <X className="w-4 h-4 text-red-400" />
                          {stats.relationshipOutcomes.endedWithDeclinedAdvice} ended relationship{stats.relationshipOutcomes.endedWithDeclinedAdvice > 1 ? 's' : ''} ignored advice
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.totalAdviceGiven === 0 && stats.deviMetrics.totalConversations === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-foreground mb-2">Start Chatting with D.E.V.I.</h3>
                    <p className="text-sm text-muted-foreground">
                      Get personalized dating advice and insights by chatting with D.E.V.I. about your candidates.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* No Contact Tab */}
            <TabsContent value="nocontact" className="space-y-4">
              {stats.noContactMetrics.totalStarted > 0 ? (
                <>
                  <Card className="border-purple-500/30 bg-purple-500/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-500" />
                        No Contact Journey
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Tracking your healing boundaries
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-purple-500/10 rounded-lg text-center">
                          <Ban className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                          <div className="text-lg font-bold text-purple-600">{stats.noContactMetrics.totalStarted}</div>
                          <div className="text-xs text-muted-foreground">Started</div>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-lg text-center">
                          <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                          <div className="text-lg font-bold text-amber-600">{stats.noContactMetrics.currentlyActive}</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-lg text-center">
                          <Trophy className="w-4 h-4 mx-auto mb-1 text-green-500" />
                          <div className="text-lg font-bold text-green-600">{stats.noContactMetrics.completedJourneys}</div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Contact Attempts Rejected</span>
                            <span className="text-sm font-bold">{stats.noContactMetrics.totalHooverAttempts}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Times they tried to contact you</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Broke NC</span>
                            <span className="text-sm font-bold text-red-500">{stats.noContactMetrics.timesBrokeNC}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Times you broke no contact</p>
                        </div>
                      </div>

                      {stats.noContactMetrics.avgDaysCompleted > 0 && (
                        <div className="p-3 bg-primary/5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-primary">Average Days Completed</span>
                            <span className="text-lg font-bold text-primary">{stats.noContactMetrics.avgDaysCompleted}/30</span>
                          </div>
                          <Progress 
                            value={(stats.noContactMetrics.avgDaysCompleted / 30) * 100} 
                            className="h-2 mt-2" 
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {stats.ncTrendData.length > 0 && stats.ncTrendData[0].reached > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-primary" />
                          30-Day Progress Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.ncTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="ncGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis 
                                dataKey="day" 
                                tick={{ fontSize: 10 }} 
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value % 5 === 0 ? `D${value}` : ''}
                              />
                              <YAxis 
                                tick={{ fontSize: 10 }} 
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  background: 'hsl(var(--background))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                                formatter={(value: number, name: string) => [
                                  value, 
                                  name === 'reached' ? 'People Reached' : 'Contact Attempts Rejected'
                                ]}
                                labelFormatter={(label) => `Day ${label}`}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="reached" 
                                stroke="hsl(var(--primary))" 
                                fill="url(#ncGradient)"
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          People who reached each day in their NC journey
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-foreground mb-2">No Contact Data Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      No contact journey metrics will appear here once you start a no-contact period with someone.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Patterns;
