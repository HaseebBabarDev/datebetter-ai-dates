import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Heart, AlertTriangle, Sparkles, RefreshCw, CheckCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EX_CONTACT_OPTIONS = [
  { value: "no_contact", label: "No contact at all" },
  { value: "occasional", label: "Occasional contact (rare texts/calls)" },
  { value: "regular", label: "Regular contact (friends)" },
  { value: "frequent", label: "Frequent contact (talk often)" },
  { value: "still_connected", label: "Still emotionally connected" },
  { value: "not_applicable", label: "No significant exes" },
];

// Behavioral indicators — we infer healing instead of asking the user to score themselves
const THINK_ABOUT_EX_OPTIONS = [
  { value: "rarely", label: "Rarely or never", score: 95 },
  { value: "sometimes", label: "A few times a month", score: 75 },
  { value: "weekly", label: "Most weeks", score: 50 },
  { value: "daily", label: "Most days", score: 25 },
  { value: "constantly", label: "Constantly / can't stop", score: 5 },
];

const CHECK_THEIR_SOCIALS_OPTIONS = [
  { value: "never", label: "Never — I don't follow them", score: 95 },
  { value: "rarely", label: "Once in a while", score: 70 },
  { value: "weekly", label: "Weekly", score: 40 },
  { value: "daily", label: "Daily or more", score: 10 },
];

const NEW_PARTNERS_FEELING_OPTIONS = [
  { value: "excited", label: "Excited to meet someone new", score: 90 },
  { value: "open", label: "Open but cautious", score: 70 },
  { value: "comparing", label: "I keep comparing them to my ex", score: 35 },
  { value: "numb", label: "Numb or not interested yet", score: 25 },
  { value: "havent_tried", label: "Haven't tried yet", score: 50 },
];

const REPEAT_PATTERNS_OPTIONS = [
  { value: "no", label: "No, I've broken the cycle", score: 90 },
  { value: "aware", label: "I notice them but catch myself", score: 65 },
  { value: "sometimes", label: "Sometimes, despite trying", score: 40 },
  { value: "yes", label: "Yes, the same patterns keep showing up", score: 15 },
];

const HealingAssessmentScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const { user } = useAuth();
  
  const [exContactStatus, setExContactStatus] = useState(data.exContactStatus || "");
  const [thinkAboutEx, setThinkAboutEx] = useState<string>("");
  const [checkTheirSocials, setCheckTheirSocials] = useState<string>("");
  const [newPartnersFeeling, setNewPartnersFeeling] = useState<string>("");
  const [repeatPatterns, setRepeatPatterns] = useState<string>("");

  // Score calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [healingScore, setHealingScore] = useState<number | null>(null);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [showDisclosure, setShowDisclosure] = useState(false);

  const handleExContactChange = (value: string) => {
    setExContactStatus(value);
    updateData({ exContactStatus: value });
  };

  // Derive 0–100 indicators from behavioral answers (no self-rating)
  const deriveOverExLevel = () => {
    const a = THINK_ABOUT_EX_OPTIONS.find((o) => o.value === thinkAboutEx)?.score;
    const b = CHECK_THEIR_SOCIALS_OPTIONS.find((o) => o.value === checkTheirSocials)?.score;
    const c = NEW_PARTNERS_FEELING_OPTIONS.find((o) => o.value === newPartnersFeeling)?.score;
    const vals = [a, b, c].filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return 50;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  };

  const deriveAttachmentToPast = () => {
    const r = REPEAT_PATTERNS_OPTIONS.find((o) => o.value === repeatPatterns)?.score;
    // High "still attached to past" = low score on broken-cycle question
    if (typeof r !== "number") return 50;
    return Math.max(0, Math.min(100, 100 - r));
  };

  const calculateScore = async () => {
    if (!user) return;
    
    setIsCalculating(true);
    try {
      // First save the assessment data to profile
      await supabase
        .from("profiles")
        .update({
          ex_contact_status: exContactStatus,
          over_ex_level: overExLevel,
          attachment_to_past: attachmentToPast,
        })
        .eq("user_id", user.id);

      // Then calculate the healing score
      const { data: scoreData, error } = await supabase.functions.invoke("calculate-healing-score", {
        body: { triggerType: "assessment" },
      });

      if (error) throw error;

      setHealingScore(scoreData.healingScore);
      setAiInsights(scoreData.aiInsights);
      setShowDisclosure(scoreData.showDisclosure);
    } catch (error) {
      console.error("Error calculating healing score:", error);
      // Calculate locally as fallback
      let baseScore = 50;
      const exContactScores: Record<string, number> = {
        "no_contact": 15,
        "occasional": 12,
        "regular": 8,
        "frequent": 4,
        "still_connected": 0,
        "not_applicable": 15,
      };
      baseScore += exContactScores[exContactStatus || "not_applicable"] || 0;
      baseScore += Math.round(overExLevel * 0.25);
      baseScore += Math.round((100 - attachmentToPast) * 0.2);
      const score = Math.max(0, Math.min(100, baseScore));
      setHealingScore(score);
      setShowDisclosure(score < 75);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleContinue = () => {
    updateData({
      exContactStatus,
      overExLevel,
      attachmentToPast,
    });
    nextStep();
  };

  const getOverExLabel = (value: number) => {
    if (value <= 20) return "Still deeply attached";
    if (value <= 40) return "Working through it";
    if (value <= 60) return "Making progress";
    if (value <= 80) return "Mostly moved on";
    return "Completely over them";
  };

  const getAttachmentLabel = (value: number) => {
    if (value <= 20) return "Very detached";
    if (value <= 40) return "Mostly detached";
    if (value <= 60) return "Neutral";
    if (value <= 80) return "Somewhat attached";
    return "Very attached to past";
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const getReadinessMessage = (score: number) => {
    if (score >= 75) return { text: "Ready to date!", color: "text-green-600", icon: <CheckCircle className="w-5 h-5" /> };
    if (score >= 50) return { text: "Getting there", color: "text-amber-600", icon: <TrendingUp className="w-5 h-5" /> };
    return { text: "Focus on healing first", color: "text-rose-600", icon: <Heart className="w-5 h-5" /> };
  };

  const canCalculate = exContactStatus !== "";

  return (
    <OnboardingLayout
      title="Healing Check-In"
      subtitle="Understanding where you are in your healing journey helps D.E.V.I. support you better"
      emoji="🌱"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Show score result if calculated */}
        {healingScore !== null ? (
          <div className="space-y-4">
            {/* Score display */}
            <div className="text-center space-y-3 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Your Healing Score</span>
              </div>
              <div className={`text-5xl font-bold ${getScoreColor(healingScore)}`}>
                {healingScore}%
              </div>
              <Progress value={healingScore} className="h-3" />
              
              {/* Readiness indicator */}
              {(() => {
                const readiness = getReadinessMessage(healingScore);
                return (
                  <div className={`flex items-center justify-center gap-2 ${readiness.color} font-medium`}>
                    {readiness.icon}
                    <span>{readiness.text}</span>
                  </div>
                );
              })()}
            </div>

            {/* AI Insights */}
            {aiInsights && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">D.E.V.I.'s Insight</span>
                </div>
                <p className="text-sm text-muted-foreground">{aiInsights}</p>
              </div>
            )}

            {/* Disclosure for scores under 75 */}
            {showDisclosure && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Healing isn't linear</p>
                  <p>It's okay to not be "over it" yet. D.E.V.I. will help support your journey alongside dating. You can still date while healing — just be mindful of your emotional capacity.</p>
                </div>
              </div>
            )}

            <Button onClick={handleContinue} className="w-full" size="lg">
              Continue
            </Button>
          </div>
        ) : (
          <>
            {/* Info notice */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                D.E.V.I. will calculate your healing score and let you know if you're ready to date. 
                You can refresh this score anytime.
              </p>
            </div>

            {/* Ex Contact Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Are you still in contact with your ex(es)?</Label>
              <Select value={exContactStatus} onValueChange={handleExContactChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your situation..." />
                </SelectTrigger>
                <SelectContent>
                  {EX_CONTACT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Over Ex Slider */}
            {exContactStatus && exContactStatus !== "not_applicable" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">How over your most recent significant ex are you?</Label>
                  <p className="text-xs text-muted-foreground">Be honest — this helps D.E.V.I. support you better</p>
                </div>
                <div className="pt-2 pb-4">
                  <Slider
                    value={[overExLevel]}
                    onValueChange={handleOverExChange}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Still attached</span>
                    <span className="text-xs font-medium text-primary">{getOverExLabel(overExLevel)}</span>
                    <span className="text-xs text-muted-foreground">Completely over</span>
                  </div>
                </div>
              </div>
            )}

            {/* Attachment to Past Slider */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">How attached are you to past relationship patterns?</Label>
                <p className="text-xs text-muted-foreground">Consider if you find yourself repeating the same dynamics</p>
              </div>
              <div className="pt-2 pb-4">
                <Slider
                  value={[attachmentToPast]}
                  onValueChange={handleAttachmentChange}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Detached</span>
                  <span className="text-xs font-medium text-primary">{getAttachmentLabel(attachmentToPast)}</span>
                  <span className="text-xs text-muted-foreground">Very attached</span>
                </div>
              </div>
            </div>

            {/* Calculate Score button */}
            <Button 
              onClick={calculateScore} 
              className="w-full" 
              size="lg"
              disabled={!canCalculate || isCalculating}
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Calculate My Healing Score
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </OnboardingLayout>
  );
};

export default HealingAssessmentScreen;
