import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SliderInput } from "../SliderInput";
import { MultiSelectOption } from "../MultiSelectOption";
import { OptionCard } from "../OptionCard";

const chemistryOptions = ["Humor", "Intelligence", "Confidence", "Kindness", "Ambition", "Creativity"];

const heightOptions = [
  { value: "no_preference", label: "No preference" },
  { value: "taller_than_me", label: "Taller than me" },
  { value: "shorter_than_me", label: "Shorter than me" },
  { value: "similar_height", label: "Similar height to me" },
];

const PhysicalPreferencesScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const toggleChemistry = (v: string) => {
    const current = data.chemistryFactors || [];
    updateData({ chemistryFactors: current.includes(v) ? current.filter(x => x !== v) : [...current, v] });
  };

  return (
    <OnboardingLayout title="Physical & Attraction" subtitle="What creates chemistry for you?">
      <div className="space-y-6 animate-fade-in">
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">These are preferences to help compatibility, not strict requirements</p>
        
        <SliderInput label="How important is physical attraction?" value={data.attractionImportance || 3} onChange={(v) => updateData({ attractionImportance: v })} min={1} max={5} leftLabel="Not very" rightLabel="Very important" />
        
        {/* Height Preference */}
        <div className="space-y-3">
          <Label>Does height matter to you?</Label>
          <div className="space-y-2">
            {heightOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.heightPreference === option.value}
                onClick={() => updateData({ heightPreference: option.value })}
                title={option.label}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>What creates chemistry for you?</Label>
          <div className="grid grid-cols-2 gap-2">
            {chemistryOptions.map((o) => (
              <MultiSelectOption key={o} selected={data.chemistryFactors?.includes(o) || false} onClick={() => toggleChemistry(o)} label={o} />
            ))}
          </div>
        </div>
        <Button onClick={nextStep} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default PhysicalPreferencesScreen;
