import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { Heart, Crown, Wallet, Users, Sparkles } from "lucide-react";

const motivationOptions = [
  { value: "love", label: "Love & Connection", description: "Looking for a genuine, committed relationship", icon: Heart },
  { value: "social_status", label: "Social Status", description: "Interested in high-profile or influential partners", icon: Crown },
  { value: "financial_help", label: "Financial Security", description: "Seeking stability and financial support", icon: Wallet },
  { value: "companionship", label: "Companionship", description: "Want someone to share life experiences with", icon: Users },
  { value: "adventure", label: "Adventure & Excitement", description: "Looking for fun and new experiences", icon: Sparkles },
];

const DatingMotivationScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const toggleMotivation = (value: string) => {
    const current = data.datingMotivation || [];
    if (current.includes(value)) {
      updateData({ datingMotivation: current.filter(v => v !== value) });
    } else {
      updateData({ datingMotivation: [...current, value] });
    }
  };

  const isValid = (data.datingMotivation?.length || 0) > 0;

  return (
    <OnboardingLayout
      title="What Are You Looking For?"
      subtitle="Be honest—this helps D.E.V.I. give you realistic advice"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Primary Motivation */}
        <div className="space-y-3">
          <Label className="text-base">What's driving your dating life right now? (select all that apply)</Label>
          <div className="space-y-2">
            {motivationOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={(data.datingMotivation || []).includes(option.value)}
                onClick={() => toggleMotivation(option.value)}
                icon={<option.icon className="w-5 h-5" />}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={nextStep}
          disabled={!isValid}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default DatingMotivationScreen;
