import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelectOption } from "../MultiSelectOption";

const dealbreakers = ["Dishonesty/lying", "Infidelity/cheating", "Active addiction", "Anger issues", "Emotional unavailability", "Financial irresponsibility", "Disrespect", "Laziness/no ambition", "Poor hygiene", "Rudeness to service workers"];

const BoundariesScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const toggle = (v: string) => {
    const current = data.dealbreakers || [];
    updateData({ dealbreakers: current.includes(v) ? current.filter(x => x !== v) : [...current, v] });
  };

  return (
    <OnboardingLayout title="Boundaries & Dealbreakers" subtitle="What you won't tolerate">
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-3">
          <Label>Absolute Dealbreakers:</Label>
          <div className="space-y-2">
            {dealbreakers.map((o) => (
              <MultiSelectOption key={o} selected={data.dealbreakers?.includes(o) || false} onClick={() => toggle(o)} label={o} />
            ))}
          </div>
        </div>
        <Button onClick={nextStep} disabled={(data.dealbreakers?.length || 0) === 0} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default BoundariesScreen;
