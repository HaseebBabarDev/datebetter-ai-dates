import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const DEVI_STYLES = [
  {
    value: "direct",
    label: "Direct",
    description: "Straight to the point. No fluff, just insights.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Warm but honest. The default experience.",
  },
  {
    value: "gentle",
    label: "Gentle",
    description: "Extra supportive and encouraging tone.",
  },
];

const DeviStyleScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const isValid = !!data.deviStyle;

  return (
    <OnboardingLayout
      title="How should D.E.V.I. talk to you?"
      subtitle="Choose your preferred communication style for your AI dating coach"
    >
      <div className="space-y-3">
        {DEVI_STYLES.map((style) => (
          <OptionCard
            key={style.value}
            selected={data.deviStyle === style.value}
            onClick={() => updateData({ deviStyle: style.value })}
            title={style.label}
            description={style.description}
          />
        ))}
      </div>

      <Button
        className="w-full mt-6"
        size="lg"
        disabled={!isValid}
        onClick={nextStep}
      >
        Continue
      </Button>
    </OnboardingLayout>
  );
};

export default DeviStyleScreen;
