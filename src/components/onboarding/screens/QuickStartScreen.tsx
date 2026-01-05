import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { Slider } from "@/components/ui/slider";
import { 
  Heart, 
  Users, 
  Sparkles, 
  Clock,
  ArrowRight,
  CheckCircle2,
  Ruler,
  DollarSign,
  GraduationCap,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const relationshipGoals = [
  { value: "casual", label: "Casual Dating", icon: Clock, description: "Fun, no pressure" },
  { value: "situationship", label: "Situationship", icon: Sparkles, description: "Undefined connection" },
  { value: "dating", label: "Dating", icon: Heart, description: "Open to connection" },
  { value: "serious", label: "Serious Relationship", icon: Users, description: "Looking for the one" },
  { value: "unsure", label: "Not Sure Yet", icon: Sparkles, description: "Exploring options" },
];

const interestedInOptions = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "everyone", label: "Everyone" },
];

const heightOptions = [
  { value: "under_5_4", label: "Under 5'4\"" },
  { value: "5_4_to_5_7", label: "5'4\" - 5'7\"" },
  { value: "5_8_to_5_11", label: "5'8\" - 5'11\"" },
  { value: "6_0_plus", label: "6'0\" or taller" },
];

const incomeOptions = [
  { value: "under_50k", label: "Under $50k" },
  { value: "50k_100k", label: "$50k - $100k" },
  { value: "100k_200k", label: "$100k - $200k" },
  { value: "200k_plus", label: "$200k+" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const educationOptions = [
  { value: "high_school", label: "High School" },
  { value: "some_college", label: "Some College" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters_plus", label: "Master's or higher" },
];

const TOTAL_STEPS = 5;

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
          height: data.height,
          income_range: data.incomeRange,
          education_level: data.educationLevel,
          attraction_importance: data.attractionImportance,
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
    updateData({ quickStartMode: false });
  };

  const canProceed = () => {
    if (step === 1) return !!data.name && data.name.length >= 2;
    if (step === 2) return !!data.relationshipGoal;
    if (step === 3) return (data.interestedIn?.length ?? 0) > 0;
    if (step === 4) return !!data.height && !!data.educationLevel;
    if (step === 5) return !!data.incomeRange && (data.attractionImportance ?? 0) > 0;
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
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

  const getAttractionLabel = (value: number) => {
    if (value <= 2) return "Not very important";
    if (value <= 4) return "Somewhat important";
    if (value <= 6) return "Moderately important";
    if (value <= 8) return "Very important";
    return "Essential";
  };

  return (
    <OnboardingLayout
      showProgress={false}
      showBack={step > 1}
      onBack={handleBack}
      title="Quick Setup"
      subtitle={`Step ${step} of ${TOTAL_STEPS}`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
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

        {/* Step 4: Height & Education */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-1">About You</h2>
              <p className="text-sm text-muted-foreground">A few quick details</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-primary" />
                  Your Height
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {heightOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateData({ height: option.value })}
                      className={`p-3 rounded-xl border-2 transition-all text-center text-sm ${
                        data.height === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  Education Level
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {educationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateData({ educationLevel: option.value })}
                      className={`p-3 rounded-xl border-2 transition-all text-center text-sm ${
                        data.educationLevel === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Income & Attraction Importance */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-1">Final Details</h2>
              <p className="text-sm text-muted-foreground">Almost done!</p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Your Income Range
                </Label>
                <div className="grid gap-2">
                  {incomeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateData({ incomeRange: option.value })}
                      className={`p-3 rounded-xl border-2 transition-all text-left text-sm flex items-center justify-between ${
                        data.incomeRange === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span>{option.label}</span>
                      {data.incomeRange === option.value && (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  How important is physical attraction?
                </Label>
                <div className="px-2">
                  <Slider
                    value={[data.attractionImportance || 5]}
                    onValueChange={([val]) => updateData({ attractionImportance: val })}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Not important</span>
                    <span className="text-primary font-medium">
                      {getAttractionLabel(data.attractionImportance || 5)}
                    </span>
                    <span>Essential</span>
                  </div>
                </div>
              </div>
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
          ) : step === TOTAL_STEPS ? (
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

        {/* Option to continue full setup */}
        {step === TOTAL_STEPS ? (
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
