import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { 
  Heart, 
  Users, 
  Sparkles, 
  Clock,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const relationshipGoals = [
  { value: "casual", label: "Casual Dating", icon: Clock, description: "Fun, no pressure" },
  { value: "dating", label: "Dating", icon: Heart, description: "Open to connection" },
  { value: "serious", label: "Serious Relationship", icon: Users, description: "Looking for the one" },
  { value: "unsure", label: "Not Sure Yet", icon: Sparkles, description: "Exploring options" },
];

const interestedInOptions = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "everyone", label: "Everyone" },
];

const QuickStartScreen = () => {
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const handleComplete = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          relationship_goal: data.relationshipGoal as any,
          interested_in: data.interestedIn,
          onboarding_completed: true,
          onboarding_step: 18,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile created! Welcome to dateBetter");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error completing quick start:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleContinueFullSetup = () => {
    // Switch to full setup mode and continue to next step
    updateData({ quickStartMode: false });
  };

  const canProceed = () => {
    if (step === 1) return !!data.name && data.name.length >= 2;
    if (step === 2) return !!data.relationshipGoal;
    if (step === 3) return (data.interestedIn?.length ?? 0) > 0;
    return false;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const toggleInterestedIn = (value: string) => {
    const current = data.interestedIn || [];
    if (current.includes(value)) {
      updateData({ interestedIn: current.filter(v => v !== value) });
    } else {
      updateData({ interestedIn: [...current, value] });
    }
  };

  return (
    <OnboardingLayout
      showProgress={false}
      showBack={step > 1}
      title="Quick Setup"
      subtitle={`Step ${step} of 3`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step 
                  ? "w-8 bg-primary" 
                  : s < step 
                    ? "w-6 bg-primary/50" 
                    : "w-6 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-1">What should we call you?</h2>
              <p className="text-sm text-muted-foreground">This is how D.E.V.I. will address you</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Your name or nickname</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={data.name || ""}
                onChange={(e) => updateData({ name: e.target.value })}
                className="text-lg py-6"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Relationship Goal */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-1">What are you looking for?</h2>
              <p className="text-sm text-muted-foreground">This helps us understand your dating goals</p>
            </div>
            
            <div className="grid gap-3">
              {relationshipGoals.map((goal) => {
                const Icon = goal.icon;
                return (
                  <OptionCard
                    key={goal.value}
                    selected={data.relationshipGoal === goal.value}
                    onClick={() => updateData({ relationshipGoal: goal.value })}
                    icon={<Icon className="w-4 h-4" />}
                    title={goal.label}
                    description={goal.description}
                    compact
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Interested In */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-1">Who are you interested in?</h2>
              <p className="text-sm text-muted-foreground">Select all that apply</p>
            </div>
            
            <div className="grid gap-3">
              {interestedInOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleInterestedIn(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                    data.interestedIn?.includes(option.value)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {data.interestedIn?.includes(option.value) && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleNext}
          disabled={!canProceed() || saving}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Setting up...
            </span>
          ) : step === 3 ? (
            <span className="flex items-center gap-2">
              Start Dating Smarter
              <Sparkles className="w-4 h-4" />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>

        {/* Option to continue full setup at end, or switch at step 1 */}
        {step === 3 ? (
          <p className="text-center text-xs text-muted-foreground">
            Want more accurate AI scoring?{" "}
            <button
              onClick={handleContinueFullSetup}
              className="text-primary font-semibold hover:underline"
            >
              Continue with full setup
            </button>
          </p>
        ) : step === 1 ? (
          <p className="text-center text-xs text-muted-foreground">
            Want more personalized insights?{" "}
            <button
              onClick={handleContinueFullSetup}
              className="text-primary hover:underline"
            >
              Complete full setup instead
            </button>
          </p>
        ) : null}
      </div>
    </OnboardingLayout>
  );
};

export default QuickStartScreen;
