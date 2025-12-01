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
} from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;
type AdviceTracking = Tables<"advice_tracking">;

type NoContactProgress = Tables<"no_contact_progress">;

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
}

const Patterns = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PatternStats | null>(null);

  useEffect(() => {
    if (user) {
      fetchPatternData();
    }
  }, [user]);

  const fetchPatternData = async () => {
    try {
      const [candidatesRes, interactionsRes, adviceRes, ncProgressRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("user_id", user!.id),
        supabase.from("interactions").select("*").eq("user_id", user!.id),
        supabase.from("advice_tracking").select("*").eq("user_id", user!.id),
        supabase.from("no_contact_progress").select("*").eq("user_id", user!.id),
      ]);

      const candidates = candidatesRes.data || [];
      const interactions = interactionsRes.data || [];
      const advice = adviceRes.data || [];
      const ncProgress = ncProgressRes.data || [];

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
        .slice(0, 5);

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
        .slice(0, 5);

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
        .slice(0, 5);

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
        .slice(0, 5);

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
      });
    } catch (error) {
      console.error("Error fetching pattern data:", error);
    } finally {
      setLoading(false);
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
            <h1 className="font-semibold text-foreground">Dating Patterns</h1>
            <p className="text-xs text-muted-foreground">Insights from your journey</p>
          </div>
          {stats && stats.totalCandidates > 0 && (
            <Button variant="ghost" size="icon" onClick={shareToInstagram}>
              <Share2 className="w-5 h-5" />
            </Button>
          )}
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-lg">
        {!stats || stats.totalCandidates === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <PieChart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Data Yet</h3>
              <p className="text-sm text-muted-foreground">
                Start adding candidates and logging interactions to see your dating patterns.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="dating" className="text-xs">Dating</TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
              <TabsTrigger value="nocontact" className="text-xs">No Contact</TabsTrigger>
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

              {stats.totalAdviceGiven === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-foreground mb-2">No Advice Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      AI advice insights will appear here once you start receiving recommendations.
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
