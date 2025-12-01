import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";

const attachmentOptions = [
  { value: "secure", label: "Secure", description: "Comfortable with intimacy and independence" },
  { value: "anxious", label: "Anxious", description: "Need reassurance, fear abandonment" },
  { value: "avoidant", label: "Avoidant", description: "Value independence, struggle with closeness" },
  { value: "disorganized", label: "Disorganized", description: "Mixed patterns, can be unpredictable" },
];

const PastPatternsScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Past Patterns & Attachment" subtitle="Understanding your relationship style">
      <div className="space-y-4 animate-fade-in">
        <div className="space-y-2">
          <Label className="text-sm">In relationships, I tend to be:</Label>
          <div className="space-y-1.5">
          {attachmentOptions.map((o) => (
            <OptionCard key={o.value} selected={data.attachmentStyle === o.value} onClick={() => updateData({ attachmentStyle: o.value })} title={o.label} description={o.description} compact />
          ))}
          </div>
        </div>
        <Button onClick={nextStep} disabled={!data.attachmentStyle} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default PastPatternsScreen;
