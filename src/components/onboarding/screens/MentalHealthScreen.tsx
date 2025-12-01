import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { MultiSelectOption } from "../MultiSelectOption";
import { SliderInput } from "../SliderInput";
import { Heart, Shield } from "lucide-react";

const neurodivergentOptions = [
  { value: "yes", label: "Yes" },
  { value: "exploring", label: "Exploring/Questioning" },
  { value: "no", label: "No" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const neurodivergenceTypes = [
  "ADHD",
  "Autism/ASD",
  "Dyslexia",
  "Dyspraxia",
  "Dyscalculia",
  "OCD",
  "Tourette's",
  "Other",
];

const opennessOptions = [
  { value: "very_open", label: "Very open to discussing" },
  { value: "selective", label: "Share with trusted people" },
  { value: "private", label: "Keep it private" },
  { value: "still_learning", label: "Still learning about myself" },
];

const MentalHealthScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const toggleType = (type: string) => {
    const current = data.neurodivergenceTypes || [];
    updateData({
      neurodivergenceTypes: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    });
  };

  return (
    <OnboardingLayout title="Mental Health & Neurodivergence" subtitle="Understanding yourself better">
      <div className="space-y-6 animate-fade-in">
        {/* Privacy notice */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            This is completely optional and private. Share only what you're comfortable with.
          </p>
        </div>

        <div className="space-y-3">
          <Label>Do you identify as neurodivergent?</Label>
          <div className="grid grid-cols-2 gap-2">
            {neurodivergentOptions.map((o) => (
              <OptionCard
                key={o.value}
                selected={data.isNeurodivergent === o.value}
                onClick={() => updateData({ isNeurodivergent: o.value })}
                title={o.label}
                compact
              />
            ))}
          </div>
        </div>

        {(data.isNeurodivergent === "yes" || data.isNeurodivergent === "exploring") && (
          <div className="space-y-3">
            <Label>Which applies to you? (Select all)</Label>
            <div className="grid grid-cols-2 gap-2">
              {neurodivergenceTypes.map((type) => (
                <MultiSelectOption
                  key={type}
                  selected={data.neurodivergenceTypes?.includes(type) || false}
                  onClick={() => toggleType(type)}
                  label={type}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label>How open are you about mental health?</Label>
          <div className="grid grid-cols-2 gap-2">
            {opennessOptions.map((o) => (
              <OptionCard
                key={o.value}
                selected={data.mentalHealthOpenness === o.value}
                onClick={() => updateData({ mentalHealthOpenness: o.value })}
                title={o.label}
                compact
              />
            ))}
          </div>
        </div>

        <SliderInput
          label="How important is partner understanding?"
          value={data.mentalHealthImportance || 3}
          onChange={(v) => updateData({ mentalHealthImportance: v })}
          min={1}
          max={5}
          leftLabel="Not important"
          rightLabel="Very important"
        />

        <Button onClick={nextStep} disabled={!data.isNeurodivergent || !data.mentalHealthOpenness} className="w-full" size="lg">
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default MentalHealthScreen;
