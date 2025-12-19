import React, { useState, useEffect, useMemo } from "react";
import { SelfWorthReminder } from "./SelfWorthReminder";

// Helper to render markdown-style bold (*text*) as actual bold
const renderWithBold = (text: string): React.ReactNode => {
  const parts = text.split(/\*([^*]+)\*/g);
  return parts.map((part, i) => 
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
};
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
import { RefreshCw, Heart, Brain, Zap, Target, Users, Check, X, Shield, ChevronDown, TrendingUp, AlertTriangle, Sparkles, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import logo from "@/assets/logo.jpg";

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

// Advice Section with Read More
const AdviceSection: React.FC<{
  advice: string;
  adviceResponse: AdviceTracking | null;
  respondingToAdvice: boolean;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ advice, adviceResponse, respondingToAdvice, onAccept, onDecline }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = advice.length > 500;
  
  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
      <div className="flex items-center gap-2 mb-3">
        <img 
          src={logo} 
          alt="D.E.V.I." 
          className="w-7 h-7 rounded-full object-cover ring-1 ring-primary/20"
        />
        <span className="text-xs font-semibold text-primary flex items-center gap-1">
          D.E.V.I. Advice
          <Sparkles className="w-3 h-3" />
        </span>
      </div>
      
      <div className="mb-3">
        <p className={`text-sm text-foreground leading-relaxed ${!expanded && isLong ? "line-clamp-[10]" : ""}`}>
          {advice}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:text-primary/80 mt-1 flex items-center gap-1 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
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
            onClick={onAccept}
            disabled={respondingToAdvice}
          >
            <Check className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onDecline}
            disabled={respondingToAdvice}
          >
            <X className="w-4 h-4 mr-1" />
            Decline
          </Button>
        </div>
      )}
    </div>
  );
};

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
  const [scoreJustUpdated, setScoreJustUpdated] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canUseUpdate, getRemainingUpdates, incrementUsage, refetch: refetchSubscription } = useSubscription();

  const scoreData = candidate.score_breakdown as unknown as ScoreBreakdown | null;
  const remainingUpdates = getRemainingUpdates(candidate.id);
  const canRefresh = canUseUpdate(candidate.id);

  // Check if advice has already been responded to
  useEffect(() => {
    const checkAdviceResponse = async () => {
      if (!scoreData?.advice || !user) {
        setAdviceResponse(null);
        return;
      }
      
      const { data } = await supabase
        .from("advice_tracking")
        .select("*")
        .eq("candidate_id", candidate.id)
        .eq("advice_text", scoreData.advice)
        .maybeSingle();
      
      // Reset to null when advice changes and no response exists yet
      setAdviceResponse(data || null);
    };
    
    checkAdviceResponse();
  }, [candidate.id, scoreData?.advice, user]);

  const calculateScore = async () => {
    // Check usage limit (first calculation is free, subsequent ones count as updates)
    const isFirstCalculation = !scoreData;
    if (!isFirstCalculation && !canRefresh) {
      toast({
        title: "Update Limit Reached",
        description: "Upgrade your plan for more D.E.V.I. updates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("calculate-compatibility", {
        body: { candidateId: candidate.id },
      });

      // Handle errors or undefined response - no change, no prompts
      if (fnError || !data || data?.error) {
        if (scoreData) {
          toast({
            title: "Score Unchanged",
            description: "Unable to refresh at this time.",
          });
        } else {
          toast({
            title: "Unable to Calculate",
            description: "Please try again later.",
          });
        }
        return;
      }

      const analysis = data;
      
      onUpdate({
        compatibility_score: analysis.overall_score,
        score_breakdown: analysis,
        last_score_update: new Date().toISOString(),
      });

      // Trigger score animation
      setScoreJustUpdated(true);
      setTimeout(() => setScoreJustUpdated(false), 1000);

      // Reset advice response when new score is calculated
      setAdviceResponse(null);

      // Track usage for refreshes (not first calculation)
      if (!isFirstCalculation) {
        await incrementUsage(candidate.id);
      }

      // Refetch subscription to update remaining count
      refetchSubscription();

      // Show toast with result
      toast({
        title: analysis.overall_score < 35 ? "Low Compatibility" : "Compatibility Analyzed",
        description: `Score: ${analysis.overall_score}%${!isFirstCalculation ? ` • ${remainingUpdates - 1} updates left` : ""}`,
        variant: analysis.overall_score < 35 ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Error calculating compatibility:", error);
      // Silent fail if score exists - no prompts needed
      if (scoreData) {
        toast({
          title: "Score Unchanged",
          description: "Unable to refresh at this time.",
        });
      } else {
        toast({
          title: "Unable to Calculate", 
          description: "Please try again later.",
          variant: "destructive",
        });
      }
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
    
    // Offer no contact mode when score is 37% or less for any advice response
    if (scoreData.overall_score <= 37) {
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
    { key: "values_alignment", label: "Values", color: "hsl(var(--primary))" },
    { key: "lifestyle_compatibility", label: "Lifestyle", color: "#f97316" },
    { key: "emotional_compatibility", label: "Emotional", color: "#a855f7" },
    { key: "chemistry_score", label: "Chemistry", color: "#fbbf24" },
  ];

  // Rainbow Arc Component - Feminine pink/purple palette with interactivity
  const RainbowArc = () => {
    const breakdown = scoreData?.breakdown;
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    if (!breakdown) return null;

    // Feminine pink/purple color palette
    const scores = [
      { label: "Chemistry", score: breakdown.chemistry_score, color: "#f472b6" },      // Pink 400
      { label: "Values", score: breakdown.values_alignment, color: "#fb923c" },        // Orange 400
      { label: "Emotional", score: breakdown.emotional_compatibility, color: "#c4b5fd" }, // Violet 300
      { label: "Lifestyle", score: breakdown.lifestyle_compatibility, color: "#fda4af" }, // Rose 300
    ].sort((a, b) => b.score - a.score);

    return (
      <div className="flex items-center gap-2">
        {/* Score list - left side */}
        <div className="flex-1 space-y-1.5">
          {scores.map((item, index) => (
            <div 
              key={item.label} 
              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all duration-200 ${
                hoveredIndex === index ? 'bg-muted/50 scale-[1.02]' : ''
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div 
                className="w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-light flex-shrink-0 transition-transform duration-200"
                style={{ 
                  borderColor: item.color, 
                  color: item.color,
                  transform: hoveredIndex === index ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {index + 1}
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground tracking-wide leading-tight">{item.label}</p>
                <p className="text-xs font-semibold text-foreground leading-tight">{item.score}%</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Rainbow arc - curves right, full visibility */}
        <div className="relative w-24 h-32 flex-shrink-0 overflow-visible">
          <svg viewBox="-5 0 95 140" className="w-full h-full overflow-visible">
            {scores.map((item, index) => {
              const baseRadius = 60;
              const radius = baseRadius - index * 13;
              const strokeWidth = 10;
              const circumference = Math.PI * radius;
              const progress = (item.score / 100) * circumference;
              const centerX = 5;
              const centerY = 70;
              const isHovered = hoveredIndex === index;
              
              return (
                <g 
                  key={item.label}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Background track */}
                  <path
                    d={`M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY + radius}`}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                    strokeLinecap="round"
                    opacity={0.15}
                    className="transition-all duration-200"
                  />
                  {/* Progress arc */}
                  <path
                    d={`M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY + radius}`}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${progress} ${circumference}`}
                    className="transition-all duration-300 ease-out"
                    style={{
                      filter: isHovered ? `drop-shadow(0 0 6px ${item.color})` : 'none'
                    }}
                  />
                  {/* End dot indicator */}
                  {item.score > 5 && (
                    <circle
                      cx={centerX + Math.sin((item.score / 100) * Math.PI) * radius}
                      cy={centerY - radius + (1 - Math.cos((item.score / 100) * Math.PI)) * radius}
                      r={isHovered ? 4 : 3}
                      fill={item.color}
                      className="transition-all duration-200"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

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
              <h3 className="font-semibold text-foreground">D.E.V.I. Compatibility</h3>
              <p className="text-xs text-muted-foreground">Dating Evaluation & Vetting Intelligence</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Get a D.E.V.I.-powered analysis of your compatibility based on your preferences and what you know about {candidate.nickname}.
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
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
      {/* Score Header */}
      <div className="relative p-5 pb-3 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Compatibility Score</h3>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={calculateScore} 
                    disabled={loading || !canRefresh} 
                    className="h-7 px-2 text-xs"
                  >
                    {canRefresh ? (
                      <>
                        <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Upgrade
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Refresh counts as a candidate update</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Overall Score */}
          <div className="text-center mb-4">
            <div 
              className={`text-5xl font-bold leading-none transition-all duration-300 ${getScoreColor(scoreData.overall_score)} ${
                scoreJustUpdated ? 'animate-scale-in scale-110' : ''
              }`}
            >
              {scoreData.overall_score}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall Compatibility</p>
          </div>

          {/* Rainbow Arc Breakdown */}
          {scoreData.breakdown && <RainbowArc />}
        </div>
      </div>

      <CardContent className="space-y-4 pt-2">

        {/* Key Insights - 1 Concern + 1 Strength */}
        {(firstStrength || firstConcern) && (
          <div className="space-y-2">
            {firstConcern && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-600 mb-0.5">Watch for</p>
                  <p className="text-sm text-foreground">{renderWithBold(firstConcern)}</p>
                </div>
              </div>
            )}
            {firstStrength && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-green-600 mb-0.5">Strength</p>
                  <p className="text-sm text-foreground">{renderWithBold(firstStrength)}</p>
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
                    <p className="text-sm text-foreground">{renderWithBold(strength)}</p>
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
                    <p className="text-sm text-foreground">{renderWithBold(concern)}</p>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* AI Advice */}
        {scoreData.advice && (
          <AdviceSection 
            advice={scoreData.advice}
            adviceResponse={adviceResponse}
            respondingToAdvice={respondingToAdvice}
            onAccept={() => respondToAdvice(true)}
            onDecline={() => respondToAdvice(false)}
          />
        )}

        {/* Self-Worth Reminder for abusive patterns */}
        <SelfWorthReminder 
          advice={scoreData.advice}
          concerns={scoreData.concerns}
          score={scoreData.overall_score}
        />

        {/* Updates remaining badge */}
        {canRefresh && (
          <div className="flex justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full cursor-help">
                    {remainingUpdates} updates remaining
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Analyze also counts toward updates</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
