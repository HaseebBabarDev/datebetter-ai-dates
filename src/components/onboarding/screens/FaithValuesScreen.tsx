import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { SliderInput } from "../SliderInput";

const religionOptions = [
  { value: "none", label: "None/Agnostic/Atheist" },
  { value: "spiritual", label: "Spiritual but not religious" },
  { value: "christian_catholic", label: "Christianity (Catholic)" },
  { value: "christian_protestant", label: "Christianity (Protestant)" },
  { value: "jewish", label: "Judaism" },
  { value: "muslim", label: "Islam" },
  { value: "hindu", label: "Hinduism" },
  { value: "buddhist", label: "Buddhism" },
  { value: "other", label: "Other" },
];

const FaithValuesScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Faith & Values" subtitle="Your spiritual beliefs">
      <div className="space-y-4 animate-fade-in">
        <div className="space-y-2">
          <Label className="text-sm">Your religious/spiritual beliefs:</Label>
          <div className="space-y-1.5">
          {religionOptions.map((o) => (
            <OptionCard key={o.value} selected={data.religion === o.value} onClick={() => updateData({ religion: o.value })} title={o.label} compact />
          ))}
          </div>
        </div>
        <SliderInput label="How important is faith alignment?" value={data.faithImportance || 3} onChange={(v) => updateData({ faithImportance: v })} min={1} max={5} leftLabel="Not important" rightLabel="Must share faith" />
        <Button onClick={nextStep} disabled={!data.religion} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default FaithValuesScreen;
