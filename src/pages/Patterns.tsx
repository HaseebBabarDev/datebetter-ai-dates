import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;
type AdviceTracking = Tables<"advice_tracking">;

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
  meetingSources: { source: string; count: number }[];
  dateTypeSuccess: { type: string; avgFeeling: number; count: number }[];
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
      const [candidatesRes, interactionsRes, adviceRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("user_id", user!.id),
        supabase.from("interactions").select("*").eq("user_id", user!.id),
        supabase.from("advice_tracking").select("*").eq("user_id", user!.id),
      ]);

      const candidates = candidatesRes.data || [];
      const interactions = interactionsRes.data || [];
      const advice = adviceRes.data || [];

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

      // Advice acceptance rate
      const respondedAdvice = advice.filter((a) => a.response !== null);
      const acceptedAdvice = advice.filter((a) => a.response === "accepted");
      const adviceAcceptanceRate = respondedAdvice.length
        ? Math.round((acceptedAdvice.length / respondedAdvice.length) * 100)
        : 0;

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
        meetingSources,
        dateTypeSuccess,
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
        <div className="container mx-auto px-4 py-3 max-w-lg flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
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

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
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
          <>
            {/* Overview Stats */}
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

            {/* Status Distribution */}
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

            {/* Common Red Flags */}
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
                    {stats.commonRedFlags.map(({ flag, count }) => (
                      <Badge
                        key={flag}
                        variant="secondary"
                        className="bg-destructive/10 text-destructive"
                      >
                        {flag} ({count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Common Green Flags */}
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
                    {stats.commonGreenFlags.map(({ flag, count }) => (
                      <Badge key={flag} variant="secondary" className="bg-green-500/10 text-green-600">
                        {flag} ({count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Best Date Types */}
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

            {/* Interaction Patterns */}
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

            {/* Who Initiates */}
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

            {/* Meeting Sources */}
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

            {/* Advice Stats */}
            {stats.totalAdviceGiven > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    Advice Acceptance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Acceptance Rate</span>
                        <span className="text-sm font-medium">{stats.adviceAcceptanceRate}%</span>
                      </div>
                      <Progress value={stats.adviceAcceptanceRate} className="h-2" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    You've received {stats.totalAdviceGiven} pieces of AI advice
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Insight Summary */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {stats.activeCandidates > 3 && (
                  <p>
                    • You're actively talking to {stats.activeCandidates} people — consider focusing
                    on quality over quantity.
                  </p>
                )}
                {stats.commonRedFlags.length > 0 && (
                  <p>
                    • "{stats.commonRedFlags[0].flag}" keeps showing up. Pay attention to this
                    pattern.
                  </p>
                )}
                {stats.initiatorStats.find((i) => i.initiator === "me")?.count >
                  (stats.initiatorStats.find((i) => i.initiator === "them")?.count || 0) && (
                  <p>• You tend to initiate more — let them come to you sometimes.</p>
                )}
                {stats.avgOverallFeeling < 3 && (
                  <p>
                    • Your average date feeling is below 3. Consider what's making dates feel
                    underwhelming.
                  </p>
                )}
                {stats.adviceAcceptanceRate < 50 && stats.totalAdviceGiven > 2 && (
                  <p>• You decline most advice. Trust your gut, but stay open to new perspectives.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Patterns;
