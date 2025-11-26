import React, { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Sparkles, RefreshCw, Heart, Brain, Zap, Target, Users, Check, X, Lightbulb, Shield, ChevronDown, TrendingUp, AlertTriangle } from "lucide-react";
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
  onStartNoContact?: () => void;
  onAdviceResponded?: () => void;
}

export const CompatibilityScore: React.FC<CompatibilityScoreProps> = ({
  candidate,
  onUpdate,
  onStartNoContact,
  onAdviceResponded,
}) => {
  const [loading, setLoading] = useState(false);
  const [adviceResponse, setAdviceResponse] = useState<AdviceTracking | null>(null);
  const [respondingToAdvice, setRespondingToAdvice] = useState(false);
  const [showNoContactDialog, setShowNoContactDialog] = useState(false);
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

  // Check if advice mentions no contact
  const isNoContactAdvice = (advice: string) => {
    const lowerAdvice = advice.toLowerCase();
    return lowerAdvice.includes("no contact") || 
           lowerAdvice.includes("distance") || 
           lowerAdvice.includes("step back") ||
           lowerAdvice.includes("take a break") ||
           lowerAdvice.includes("space from");
  };

  const respondToAdvice = async (accepted: boolean) => {
    if (!scoreData?.advice || !user) return;
    
    // Check if accepting no contact advice
    if (accepted && isNoContactAdvice(scoreData.advice)) {
      setShowNoContactDialog(true);
      return;
    }
    
    await saveAdviceResponse(accepted);
  };

  const saveAdviceResponse = async (accepted: boolean) => {
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
      
      // Notify parent that advice was responded to
      if (onAdviceResponded) {
        onAdviceResponded();
      }
      
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

  const handleStartNoContact = async () => {
    setShowNoContactDialog(false);
    await saveAdviceResponse(true);
    if (onStartNoContact) {
      onStartNoContact();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 55) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 55) return "bg-orange-500";
    return "bg-red-500";
  };

  const breakdownItems = [
    { key: "values_alignment", label: "Values", icon: Heart },
    { key: "lifestyle_compatibility", label: "Lifestyle", icon: Users },
    { key: "emotional_compatibility", label: "Emotional", icon: Brain },
    { key: "chemistry_score", label: "Chemistry", icon: Zap },
  ];

  if (!scoreData) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
        <div className="relative p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="relative flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Compatibility</h3>
              <p className="text-xs text-muted-foreground">Powered by AI analysis</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
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
        </div>
      </Card>
    );
  }

  const [showAllInsights, setShowAllInsights] = useState(false);

  const firstStrength = scoreData.strengths?.[0];
  const firstConcern = scoreData.concerns?.[0];
  const remainingStrengths = scoreData.strengths?.slice(1) || [];
  const remainingConcerns = scoreData.concerns?.slice(1) || [];
  const hasMoreInsights = remainingStrengths.length > 0 || remainingConcerns.length > 0;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
      {/* Score Header */}
      <div className="relative p-6 pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Compatibility</h3>
              <p className="text-xs text-muted-foreground">AI-powered analysis</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(scoreData.overall_score)}`}>
              {scoreData.overall_score}%
            </div>
            <Button variant="ghost" size="sm" onClick={calculateScore} disabled={loading} className="h-6 px-2 text-xs">
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 pt-0">
        {/* Compact Breakdown */}
        {scoreData.breakdown && (
          <div className="grid grid-cols-4 gap-2">
            {breakdownItems.map(({ key, label, icon: Icon }) => {
              const score = scoreData.breakdown?.[key as keyof typeof scoreData.breakdown] ?? 0;
              return (
                <div key={key} className="text-center p-3 rounded-lg bg-muted/30">
                  <Icon className={`w-5 h-5 mx-auto mb-1.5 ${getScoreColor(score)}`} />
                  <div className={`text-base font-bold ${getScoreColor(score)}`}>{score}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Key Insights - 1 Strength + 1 Concern */}
        {(firstStrength || firstConcern) && (
          <div className="space-y-2">
            {firstStrength && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-green-600 mb-0.5">Strength</p>
                  <p className="text-sm text-foreground">{firstStrength}</p>
                </div>
              </div>
            )}
            {firstConcern && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-600 mb-0.5">Watch for</p>
                  <p className="text-sm text-foreground">{firstConcern}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsible More Insights */}
        {hasMoreInsights && (
          <Collapsible open={showAllInsights} onOpenChange={setShowAllInsights}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground">
                <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${showAllInsights ? "rotate-180" : ""}`} />
                {showAllInsights ? "Show less" : `${remainingStrengths.length + remainingConcerns.length} more insights`}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {remainingStrengths.map((strength, i) => (
                <div key={`s-${i}`} className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-600 mb-0.5">Strength</p>
                    <p className="text-sm text-foreground">{strength}</p>
                  </div>
                </div>
              ))}
              {remainingConcerns.map((concern, i) => (
                <div key={`c-${i}`} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-600 mb-0.5">Watch for</p>
                    <p className="text-sm text-foreground">{concern}</p>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* AI Advice */}
        {scoreData.advice && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-primary mb-1">AI Advice</p>
                <p className="text-sm text-foreground">{scoreData.advice}</p>
              </div>
            </div>
            
            {adviceResponse ? (
              <div className={`text-sm px-3 py-2 rounded-lg ${
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
                  className="flex-1 bg-green-600 hover:bg-green-700"
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
          <p className="text-[10px] text-muted-foreground text-center">
            Updated {new Date(candidate.last_score_update).toLocaleDateString()}
          </p>
        )}
      </CardContent>

      {/* No Contact Dialog */}
      <AlertDialog open={showNoContactDialog} onOpenChange={setShowNoContactDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Start No Contact Mode?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>The advice suggests creating distance from {candidate.nickname}.</p>
              <p>Would you like to start a 30-day No Contact journey?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => saveAdviceResponse(true)}>
              Accept Advice Only
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStartNoContact}>
              Start No Contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
