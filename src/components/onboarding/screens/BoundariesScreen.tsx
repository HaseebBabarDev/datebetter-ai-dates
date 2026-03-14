import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelectOption } from "../MultiSelectOption";
import { SliderInput } from "../SliderInput";

const dealbreakers = [
  "Dishonesty/lying",
  "Infidelity/cheating",
  "Active addiction",
  "Anger issues",
  "Emotional unavailability",
  "Financial irresponsibility",
  "Disrespect",
  "Laziness/no ambition",
  "Poor hygiene",
  "Rudeness to service workers",
];

const safetyPriorities = [
  "Meet in public first",
  "Tell someone where I am",
  "Video call before meeting",
  "Share location with friend",
  "Take my own transportation",
  "Set time limits for first dates",
];

const BoundariesScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const toggleDealbreaker = (v: string) => {
    const current = data.dealbreakers || [];
    updateData({
      dealbreakers: current.includes(v)
        ? current.filter((x) => x !== v)
        : [...current, v],
    });
  };

  const toggleSafetyPriority = (v: string) => {
    const current = data.safetyPriorities || [];
    updateData({
      safetyPriorities: current.includes(v)
        ? current.filter((x) => x !== v)
        : [...current, v],
    });
  };

  const canContinue = (data.dealbreakers?.length || 0) > 0;

  return (
    <OnboardingLayout
      title="Boundaries & Safety"
      subtitle="What you won't tolerate"
      emoji="🛡️"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Absolute Dealbreakers */}
        <div className="space-y-3">
          <Label>Absolute Dealbreakers:</Label>
          <div className="space-y-2">
            {dealbreakers.map((o) => (
              <MultiSelectOption
                key={o}
                selected={data.dealbreakers?.includes(o) || false}
                onClick={() => toggleDealbreaker(o)}
                label={o}
              />
            ))}
          </div>
        </div>

        {/* Safety Priorities */}
        <div className="space-y-3">
          <Label>Safety Priorities:</Label>
          <div className="space-y-2">
            {safetyPriorities.map((o) => (
              <MultiSelectOption
                key={o}
                selected={data.safetyPriorities?.includes(o) || false}
                onClick={() => toggleSafetyPriority(o)}
                label={o}
              />
            ))}
          </div>
        </div>

        {/* Boundary Strength Slider */}
        <SliderInput
          label="Boundary Strength"
          value={data.boundaryStrength || 3}
          onChange={(v) => updateData({ boundaryStrength: v })}
          leftLabel="Flexible"
          rightLabel="Firm"
        />

        <Button
          onClick={nextStep}
          disabled={!canContinue}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default BoundariesScreen;
