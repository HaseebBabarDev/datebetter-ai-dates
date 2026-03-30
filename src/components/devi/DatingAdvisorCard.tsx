import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, Heart, Users, Sparkles, Check, ChevronDown, Edit2, AlertTriangle, Brain, Unlink, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RELATIONSHIP_GOALS = [
  { value: "serious_relationship", label: "Serious Relationship", icon: "💍" },
  { value: "casual_dating", label: "Casual Dating", icon: "🎯" },
  { value: "marriage", label: "Marriage", icon: "💒" },
  { value: "figuring_it_out", label: "Figuring It Out", icon: "🤔" },
  { value: "friendship_first", label: "Friendship First", icon: "🤝" },
  { value: "not_sure", label: "Not Sure Yet", icon: "❓" },
];

const RELATIONSHIP_STATUSES = [
  { value: "single", label: "Single" },
  { value: "dating", label: "Dating Someone" },
  { value: "situationship", label: "In a Situationship" },
  { value: "talking_stage", label: "Talking Stage" },
  { value: "complicated", label: "It's Complicated" },
  { value: "healing", label: "Healing / Moving On" },
];

const DEALBREAKER_OPTIONS = [
  "Dishonesty", "Poor communication", "No ambition", "Substance abuse",
  "Controlling behavior", "Emotionally unavailable", "Different life goals",
  "Disrespectful", "Poor hygiene", "No emotional intelligence",
];

interface DatingAdvisorCardProps {
  userProfile: any;
  candidate?: any;
  onConfirm: (summary: string) => void;
  onDismiss: () => void;
  existingMessages?: { role: string; content: string }[];
}

// Thresholds for "not healthy to proceed"
const LOW_HEALING_THRESHOLD = 40;
const LOW_COMPATIBILITY_THRESHOLD = 30;

export const DatingAdvisorCard: React.FC<DatingAdvisorCardProps> = ({
  userProfile,
  candidate,
  onConfirm,
  onDismiss,
  existingMessages = [],
}) => {
  const navigate = useNavigate();
  
  // Profile completeness check (60% required)
  const PROFILE_COMPLETENESS_FIELDS = [
    'relationship_goal', 'relationship_status', 'attachment_style', 'communication_style',
    'love_languages', 'dealbreakers', 'gender_identity', 'interested_in', 'birth_date',
    'location', 'kids_desire', 'religion', 'politics', 'education_level',
    'dating_motivation', 'boundary_strength', 'healing_score',
  ];
  const filledFields = PROFILE_COMPLETENESS_FIELDS.filter(field => {
    const val = userProfile?.[field];
    if (val === null || val === undefined || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;
  const profileCompleteness = Math.round((filledFields / PROFILE_COMPLETENESS_FIELDS.length) * 100);
  const isProfileIncomplete = profileCompleteness < 60;

  // Check for low scores
  const healingScore = userProfile?.healing_score ?? null;
  const compatibilityScore = candidate?.compatibility_score ?? null;
  const hasLowHealing = healingScore !== null && healingScore < LOW_HEALING_THRESHOLD;
  const hasLowCompatibility = candidate && compatibilityScore !== null && compatibilityScore < LOW_COMPATIBILITY_THRESHOLD;
  const isUnhealthy = hasLowHealing || hasLowCompatibility;
  const [step, setStep] = useState<"review" | "edit-goal" | "edit-status" | "edit-dealbreakers">("review");
  const [selectedGoal, setSelectedGoal] = useState(userProfile?.relationship_goal || "");
  const [selectedStatus, setSelectedStatus] = useState(userProfile?.relationship_status || "");
  const [selectedDealbreakers, setSelectedDealbreakers] = useState<string[]>(
    Array.isArray(userProfile?.dealbreakers) ? userProfile.dealbreakers : []
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Detect in-progress dating plan from existing messages
  const detectPlanProgress = (): { lastStep: number; isComplete: boolean } | null => {
    if (!existingMessages || existingMessages.length === 0) return null;
    
    const assistantMsgs = existingMessages.filter(m => m.role === 'assistant');
    let lastStep = 0;
    let isComplete = false;
    
    for (const msg of assistantMsgs) {
      const stepMentions = msg.content.match(/Step (\d)/gi);
      if (stepMentions) {
        for (const mention of stepMentions) {
          const num = parseInt(mention.replace(/Step /i, ''));
          if (num > lastStep) lastStep = num;
        }
      }
      if (msg.content.match(/check in on your progress/i) || msg.content.match(/adjust any of these steps/i)) {
        isComplete = true;
      }
    }
    
    // Only consider it an in-progress plan if we found step references from the dating plan flow
    const hasPlanTrigger = existingMessages.some(m => 
      m.role === 'user' && (m.content.includes('dating plan') || m.content.includes('step-by-step action plan'))
    );
    
    if (!hasPlanTrigger || lastStep === 0) return null;
    return { lastStep, isComplete };
  };
  
  const planProgress = detectPlanProgress();

  const formatEnum = (value: string | null | undefined) => {
    if (!value) return "Not set";
    return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const currentGoalLabel = RELATIONSHIP_GOALS.find(g => g.value === selectedGoal)?.label || formatEnum(selectedGoal);
  const currentGoalIcon = RELATIONSHIP_GOALS.find(g => g.value === selectedGoal)?.icon || "🎯";
  const currentStatusLabel = RELATIONSHIP_STATUSES.find(s => s.value === selectedStatus)?.label || formatEnum(selectedStatus);

  const handleSaveAndConfirm = async () => {
    setSaving(true);
    
    // Save updates to profile if changed
    if (hasChanges && userProfile?.user_id) {
      const updates: any = {};
      if (selectedGoal !== userProfile?.relationship_goal) updates.relationship_goal = selectedGoal;
      if (selectedStatus !== userProfile?.relationship_status) updates.relationship_status = selectedStatus;
      
      const originalDealbreakers = Array.isArray(userProfile?.dealbreakers) ? userProfile.dealbreakers : [];
      if (JSON.stringify(selectedDealbreakers.sort()) !== JSON.stringify([...originalDealbreakers].sort())) {
        updates.dealbreakers = selectedDealbreakers;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", userProfile.user_id);
        
        if (error) {
          toast.error("Failed to update profile");
          setSaving(false);
          return;
        }
        toast.success("Goals updated!");
      }
    }

    // Build summary for D.E.V.I.
    const summary = `Here's my dating plan. My confirmed goals:
- Relationship Goal: ${currentGoalLabel}
- Current Status: ${currentStatusLabel}
- Key Dealbreakers: ${selectedDealbreakers.length > 0 ? selectedDealbreakers.join(", ") : "None specified"}
${hasChanges ? "(I just updated these — please use my new goals)" : "(These are confirmed and accurate)"}

Please give me a personalized step-by-step action plan based on where I am right now.`;

    onConfirm(summary);
    setSaving(false);
  };

  const toggleDealbreaker = (d: string) => {
    setHasChanges(true);
    setSelectedDealbreakers(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  // Circular progress for profile completeness
  const completeness = [selectedGoal, selectedStatus, selectedDealbreakers.length > 0].filter(Boolean).length;
  const totalFields = 3;
  const completenessPercent = Math.round((completeness / totalFields) * 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completenessPercent / 100) * circumference;

  if (step === "edit-goal") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Card className="border-primary/30 bg-card/90 backdrop-blur-sm overflow-hidden">
          <div className="bg-[image:var(--gradient-hero)] px-4 py-3">
            <h3 className="text-sm font-semibold text-primary-foreground">What are you looking for?</h3>
          </div>
          <CardContent className="p-3 space-y-2">
            {RELATIONSHIP_GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => { setSelectedGoal(g.value); setHasChanges(true); setStep("review"); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                  selectedGoal === g.value
                    ? "bg-primary/15 border-2 border-primary text-foreground font-medium"
                    : "bg-muted/50 border-2 border-transparent hover:bg-muted text-foreground"
                }`}
              >
                <span className="text-lg">{g.icon}</span>
                <span>{g.label}</span>
                {selectedGoal === g.value && <Check className="w-4 h-4 text-primary ml-auto" />}
              </button>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (step === "edit-status") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Card className="border-primary/30 bg-card/90 backdrop-blur-sm overflow-hidden">
          <div className="bg-[image:var(--gradient-hero)] px-4 py-3">
            <h3 className="text-sm font-semibold text-primary-foreground">Where are you right now?</h3>
          </div>
          <CardContent className="p-3 space-y-2">
            {RELATIONSHIP_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => { setSelectedStatus(s.value); setHasChanges(true); setStep("review"); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                  selectedStatus === s.value
                    ? "bg-primary/15 border-2 border-primary text-foreground font-medium"
                    : "bg-muted/50 border-2 border-transparent hover:bg-muted text-foreground"
                }`}
              >
                <span>{s.label}</span>
                {selectedStatus === s.value && <Check className="w-4 h-4 text-primary ml-auto" />}
              </button>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (step === "edit-dealbreakers") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Card className="border-primary/30 bg-card/90 backdrop-blur-sm overflow-hidden">
          <div className="bg-[image:var(--gradient-hero)] px-4 py-3">
            <h3 className="text-sm font-semibold text-primary-foreground">Your dealbreakers</h3>
            <p className="text-xs text-primary-foreground/70">Select all that apply</p>
          </div>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2 mb-4">
              {DEALBREAKER_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => toggleDealbreaker(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedDealbreakers.includes(d)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              className="w-full bg-[image:var(--gradient-hero)]"
              onClick={() => setStep("review")}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Profile completeness gate — require 60% before giving advice
  if (isProfileIncomplete) {
    const completenessRadius = 28;
    const completenessCirc = 2 * Math.PI * completenessRadius;
    const completenessOffset = completenessCirc - (profileCompleteness / 100) * completenessCirc;
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Card className="border-amber-500/30 bg-card/90 backdrop-blur-sm overflow-hidden">
          <div className="bg-amber-500/90 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <svg width="64" height="64" className="transform -rotate-90">
                  <circle cx="32" cy="32" r={completenessRadius} stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                  <circle
                    cx="32" cy="32" r={completenessRadius}
                    stroke="white" strokeWidth="4" fill="none"
                    strokeDasharray={completenessCirc}
                    strokeDashoffset={completenessOffset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{profileCompleteness}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">D.E.V.I. needs to know you first</h3>
                <p className="text-xs text-white/80">Complete at least 60% of your profile for a dating plan</p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Your profile is <span className="font-semibold text-foreground">{profileCompleteness}%</span> complete. 
              D.E.V.I. can't build a meaningful plan without understanding your goals, attachment style, and preferences.
            </p>

            <div className="space-y-2">
              <Button
                size="sm"
                className="w-full gap-2 text-xs bg-[image:var(--gradient-hero)] hover:opacity-90"
                onClick={() => { onDismiss(); navigate("/settings"); }}
              >
                <Edit2 className="w-4 h-4" />
                Complete my profile
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 text-xs"
                onClick={() => { onDismiss(); navigate("/self-discovery"); }}
              >
                <Sparkles className="w-4 h-4" />
                Take self-discovery quizzes
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Unhealthy score gate — show redirect instead of plan
  if (isUnhealthy) {
    const candidateName = candidate?.nickname || "this person";
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Card className="border-destructive/30 bg-card/90 backdrop-blur-sm overflow-hidden">
          <div className="bg-destructive/90 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-6 h-6 text-destructive-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-destructive-foreground">Let's pause here</h3>
                <p className="text-xs text-destructive-foreground/80">D.E.V.I. cares about your wellbeing first</p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            {hasLowHealing && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                <Heart className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Healing Score: {healingScore}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your healing score is very low right now. Pursuing a dating plan when you're still processing past hurt 
                    can lead to repeating unhealthy patterns. Let's focus on you first.
                  </p>
                </div>
              </div>
            )}

            {hasLowCompatibility && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Compatibility with {candidateName}: {compatibilityScore}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The compatibility score with {candidateName} is critically low. A dating plan here wouldn't be honest — 
                    this connection isn't healthy for you based on the data we have.
                  </p>
                </div>
              </div>
            )}

            <p className="text-sm text-foreground font-medium text-center">
              There's no dating plan here — and that's D.E.V.I. looking out for you. 💜
            </p>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                size="sm"
                className="w-full gap-2 text-xs"
                variant="outline"
                onClick={() => {
                  onDismiss();
                  onConfirm("Help me rewire my thoughts. I want to work on my mindset and break unhealthy dating patterns.");
                }}
              >
                <Brain className="w-4 h-4" />
                Help me rewire my thoughts
              </Button>

              {candidate && (
                <Button
                  size="sm"
                  className="w-full gap-2 text-xs bg-[image:var(--gradient-hero)] hover:opacity-90"
                  onClick={() => {
                    onDismiss();
                    navigate(`/detachment-plan/${candidate.id}`);
                  }}
                >
                  <Unlink className="w-4 h-4" />
                  Explore Detachment Plan for {candidateName}
                </Button>
              )}

              {hasLowHealing && !candidate && (
                <Button
                  size="sm"
                  className="w-full gap-2 text-xs bg-[image:var(--gradient-hero)] hover:opacity-90"
                  onClick={() => {
                    onDismiss();
                    navigate("/patterns?tab=healing");
                  }}
                >
                  <Heart className="w-4 h-4" />
                  Work on my healing journey
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Review step
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <Card className="border-primary/30 bg-card/90 backdrop-blur-sm overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-[image:var(--gradient-hero)] px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Circular completeness indicator */}
            <div className="relative flex-shrink-0">
              <svg width="64" height="64" className="transform -rotate-90">
                <circle cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                <circle
                  cx="32" cy="32" r={radius}
                  stroke="white" strokeWidth="4" fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-foreground">My Dating Plan</h3>
              <p className="text-xs text-primary-foreground/80">Review your goals to get your step-by-step plan</p>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Goal row */}
          <button
            onClick={() => setStep("edit-goal")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
              {currentGoalIcon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Relationship Goal</p>
              <p className="text-sm font-semibold text-foreground truncate">{currentGoalLabel || "Tap to set"}</p>
            </div>
            <Edit2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </button>

          {/* Status row */}
          <button
            onClick={() => setStep("edit-status")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Current Status</p>
              <p className="text-sm font-semibold text-foreground truncate">{currentStatusLabel || "Tap to set"}</p>
            </div>
            <Edit2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </button>

          {/* Dealbreakers row */}
          <button
            onClick={() => setStep("edit-dealbreakers")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Dealbreakers</p>
              <p className="text-sm text-foreground truncate">
                {selectedDealbreakers.length > 0
                  ? selectedDealbreakers.slice(0, 3).join(", ") + (selectedDealbreakers.length > 3 ? ` +${selectedDealbreakers.length - 3}` : "")
                  : "Tap to set"}
              </p>
            </div>
            <Edit2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </button>

          {/* Change indicator */}
          {hasChanges && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-primary font-medium text-center"
            >
              ✓ Goals updated — D.E.V.I. will use your new preferences
            </motion.p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={onDismiss}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs bg-[image:var(--gradient-hero)] hover:opacity-90 gap-1.5"
              onClick={handleSaveAndConfirm}
              disabled={saving}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {saving ? "Starting..." : hasChanges ? "Save & Start" : "Confirm & Start"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
