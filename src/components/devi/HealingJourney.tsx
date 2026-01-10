import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Heart, Sparkles, TrendingUp, TrendingDown, RefreshCw, Send, AlertTriangle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface HealingData {
  healingScore: number | null;
  healingAssessmentDate: string | null;
  hasAssessmentData: boolean;
}

interface HealingJourneyProps {
  onClose?: () => void;
  compact?: boolean;
}

export const HealingJourney: React.FC<HealingJourneyProps> = ({ onClose, compact = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [healingData, setHealingData] = useState<HealingData | null>(null);
  const [dailyFeeling, setDailyFeeling] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latestResult, setLatestResult] = useState<{
    score: number;
    previousScore: number | null;
    scoreChange: number | null;
    aiInsights: string;
    showDisclosure: boolean;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchHealingData();
    }
  }, [user]);

  const fetchHealingData = async () => {
    if (!user) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("healing_score, healing_assessment_date, ex_contact_status, over_ex_level, attachment_to_past")
      .eq("user_id", user.id)
      .single();

    if (!error && profile) {
      setHealingData({
        healingScore: profile.healing_score,
        healingAssessmentDate: profile.healing_assessment_date,
        hasAssessmentData: !!(profile.ex_contact_status || profile.over_ex_level || profile.attachment_to_past),
      });
    }
  };

  const refreshHealingScore = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-healing-score", {
        body: { 
          triggerType: dailyFeeling ? "daily_checkin" : "manual_refresh",
          dailyFeeling: dailyFeeling || undefined,
        },
      });

      if (error) throw error;

      setLatestResult({
        score: data.healingScore,
        previousScore: data.previousScore,
        scoreChange: data.scoreChange,
        aiInsights: data.aiInsights,
        showDisclosure: data.showDisclosure,
      });

      setHealingData(prev => prev ? {
        ...prev,
        healingScore: data.healingScore,
        healingAssessmentDate: new Date().toISOString(),
      } : null);

      setDailyFeeling("");
      toast.success("Healing score updated!");
    } catch (error) {
      console.error("Error refreshing healing score:", error);
      toast.error("Failed to refresh healing score");
    } finally {
      setIsRefreshing(false);
    }
  };

  const goToAssessment = () => {
    navigate("/settings?tab=preferences&section=healing");
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  if (!healingData) {
    return null;
  }

  // Compact mode for Devi page header
  if (compact && healingData.healingScore !== null) {
    return (
      <button
        onClick={() => navigate("/patterns?tab=healing")}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <Heart className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{healingData.healingScore}%</span>
        <span className="text-xs text-muted-foreground">Healing</span>
      </button>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Healing Journey</h3>
              <p className="text-xs text-muted-foreground">Track your emotional progress</p>
            </div>
          </div>
          {healingData.healingScore !== null && (
            <div className={`text-2xl font-bold ${getScoreColor(healingData.healingScore)}`}>
              {healingData.healingScore}%
            </div>
          )}
        </div>

        {healingData.healingScore !== null ? (
          <>
            <div className="space-y-2">
              <Progress 
                value={healingData.healingScore} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Beginning</span>
                <span>Thriving</span>
              </div>
            </div>

            {/* Latest result with AI insights */}
            {latestResult && (
              <div className="space-y-3 animate-fade-in">
                {latestResult.scoreChange !== null && latestResult.scoreChange !== 0 && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${
                    latestResult.scoreChange > 0 ? "bg-green-500/10" : "bg-rose-500/10"
                  }`}>
                    {latestResult.scoreChange > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      latestResult.scoreChange > 0 ? "text-green-600" : "text-rose-600"
                    }`}>
                      {latestResult.scoreChange > 0 ? "+" : ""}{latestResult.scoreChange} points since last check
                    </span>
                  </div>
                )}

                {latestResult.aiInsights && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">D.E.V.I.'s Insight</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{latestResult.aiInsights}</p>
                  </div>
                )}

                {latestResult.showDisclosure && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-amber-600">Remember:</span> Healing isn't linear. 
                      Some days will feel like setbacks, but they're part of the journey. 
                      Every step forward counts, even the small ones.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Daily check-in */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tell D.E.V.I. how you feel today</label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="How are you feeling about your healing journey today?"
                  value={dailyFeeling}
                  onChange={(e) => setDailyFeeling(e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>
              <Button
                onClick={refreshHealingScore}
                disabled={isRefreshing}
                className="w-full gap-2"
                size="sm"
              >
                {isRefreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : dailyFeeling ? (
                  <Send className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {dailyFeeling ? "Share & Update Score" : "Refresh Healing Score"}
              </Button>
            </div>

            {/* View patterns link */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/patterns?tab=healing")}
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
            >
              View healing history
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {healingData.hasAssessmentData 
                ? "Calculate your first healing score to start tracking your progress."
                : "Complete the healing assessment to understand where you are in your journey."}
            </p>
            <Button
              onClick={healingData.hasAssessmentData ? refreshHealingScore : goToAssessment}
              disabled={isRefreshing}
              className="w-full gap-2"
            >
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {healingData.hasAssessmentData ? "Calculate Healing Score" : "Start Healing Assessment"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealingJourney;
