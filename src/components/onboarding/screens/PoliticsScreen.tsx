import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { SliderInput } from "../SliderInput";

const politicsOptions = [
  { value: "progressive", label: "Progressive" },
  { value: "liberal", label: "Liberal" },
  { value: "moderate", label: "Moderate" },
  { value: "conservative", label: "Conservative" },
  { value: "traditional", label: "Traditional" },
];

const PoliticsScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Politics & Social Values" subtitle="Your worldview">
      <div className="space-y-4 animate-fade-in">
        <div className="space-y-2">
          <Label className="text-sm">Your political views:</Label>
          <div className="space-y-1.5">
          {politicsOptions.map((o) => (
            <OptionCard key={o.value} selected={data.politics === o.value} onClick={() => updateData({ politics: o.value })} title={o.label} compact />
          ))}
          </div>
        </div>
        <SliderInput label="How important is political alignment?" value={data.politicsImportance || 3} onChange={(v) => updateData({ politicsImportance: v })} min={1} max={5} leftLabel="Not important" rightLabel="Very important" />
        <Button onClick={nextStep} disabled={!data.politics} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default PoliticsScreen;
