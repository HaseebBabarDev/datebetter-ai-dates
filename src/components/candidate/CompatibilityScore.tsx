import React, { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Heart, Brain, Zap, Target, Users, Check, X, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type Candidate = Tables<"candidates">;
type AdviceTracking = Tables<"advice_tracking">;

interface ScoreBreakdown {
  overall_score: number;
  breakdown: {
    values_alignment: number;
    lifestyle_compatibility: number;
    emotional_compatibility: number;
    chemistry_score: number;
    future_goals: number;
  };
  strengths: string[];
  concerns: string[];
  advice: string;
}

interface CompatibilityScoreProps {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => void;
}

export const CompatibilityScore: React.FC<CompatibilityScoreProps> = ({
  candidate,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [adviceResponse, setAdviceResponse] = useState<AdviceTracking | null>(null);
  const [respondingToAdvice, setRespondingToAdvice] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const scoreData = candidate.score_breakdown as unknown as ScoreBreakdown | null;

  // Check if advice has already been responded to
  useEffect(() => {
    const checkAdviceResponse = async () => {
      if (!scoreData?.advice || !user) return;
      
      const { data } = await supabase
        .from("advice_tracking")
        .select("*")
        .eq("candidate_id", candidate.id)
        .eq("advice_text", scoreData.advice)
        .maybeSingle();
      
      if (data) {
        setAdviceResponse(data);
      }
    };
    
    checkAdviceResponse();
  }, [candidate.id, scoreData?.advice, user]);

  const calculateScore = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-compatibility`,
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
        const error = await response.json();
        throw new Error(error.error || "Failed to calculate");
      }

      const analysis = await response.json();
      
      onUpdate({
        compatibility_score: analysis.overall_score,
        score_breakdown: analysis,
        last_score_update: new Date().toISOString(),
      });

      // Reset advice response when new score is calculated
      setAdviceResponse(null);

      toast({
        title: "Compatibility Analyzed",
        description: `Score: ${analysis.overall_score}%`,
      });
    } catch (error) {
      console.error("Error calculating compatibility:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate compatibility",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const respondToAdvice = async (accepted: boolean) => {
    if (!scoreData?.advice || !user) return;
    
    setRespondingToAdvice(true);
    try {
      const { data, error } = await supabase
        .from("advice_tracking")
        .insert({
          user_id: user.id,
          candidate_id: candidate.id,
          advice_text: scoreData.advice,
          advice_type: "compatibility",
          response: accepted ? "accepted" : "declined",
          followed_through: accepted,
          responded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setAdviceResponse(data);
      toast({
        title: accepted ? "Advice Accepted" : "Advice Declined",
        description: accepted 
          ? "Great! We'll track how this goes." 
          : "No problem, we'll note your preference.",
      });
    } catch (error) {
      console.error("Error tracking advice:", error);
      toast({
        title: "Error",
        description: "Failed to save your response",
        variant: "destructive",
      });
    } finally {
      setRespondingToAdvice(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const breakdownItems = [
    { key: "values_alignment", label: "Values", icon: Heart },
    { key: "lifestyle_compatibility", label: "Lifestyle", icon: Users },
    { key: "emotional_compatibility", label: "Emotional", icon: Brain },
    { key: "chemistry_score", label: "Chemistry", icon: Zap },
    { key: "future_goals", label: "Goals", icon: Target },
  ];

  if (!scoreData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Compatibility Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get an AI-powered analysis of your compatibility based on your preferences and what you know about {candidate.nickname}.
          </p>
          <Button onClick={calculateScore} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Calculate Compatibility
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Compatibility Score
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={calculateScore} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(scoreData.overall_score)}`}>
            {scoreData.overall_score}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">Overall Compatibility</p>
        </div>

        {/* Breakdown */}
        {scoreData.breakdown && (
          <div className="space-y-3">
            {breakdownItems.map(({ key, label, icon: Icon }) => {
              const score = scoreData.breakdown?.[key as keyof typeof scoreData.breakdown] ?? 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </span>
                    <span className={getScoreColor(score)}>{score}%</span>
                  </div>
                  <Progress value={score} className={`h-2 [&>div]:${getScoreBg(score)}`} />
                </div>
              );
            })}
          </div>
        )}

        {/* Strengths */}
        {scoreData.strengths?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-green-600">Strengths</h4>
            <div className="flex flex-wrap gap-2">
              {scoreData.strengths.map((strength, i) => (
                <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-600">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {scoreData.concerns?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-orange-600">Areas to Watch</h4>
            <div className="flex flex-wrap gap-2">
              {scoreData.concerns.map((concern, i) => (
                <Badge key={i} variant="secondary" className="bg-orange-500/10 text-orange-600">
                  {concern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Advice with Accept/Decline */}
        {scoreData.advice && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-start gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">AI Advice</h4>
                <p className="text-sm text-muted-foreground mt-1">{scoreData.advice}</p>
              </div>
            </div>
            
            {adviceResponse ? (
              <div className={`text-sm px-3 py-2 rounded-md ${
                adviceResponse.response === "accepted" 
                  ? "bg-green-500/10 text-green-600" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {adviceResponse.response === "accepted" ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    You accepted this advice
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    You declined this advice
                  </span>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-green-500/30 text-green-600 hover:bg-green-500/10"
                  onClick={() => respondToAdvice(true)}
                  disabled={respondingToAdvice}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => respondToAdvice(false)}
                  disabled={respondingToAdvice}
                >
                  <X className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}
          </div>
        )}

        {candidate.last_score_update && (
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(candidate.last_score_update).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
