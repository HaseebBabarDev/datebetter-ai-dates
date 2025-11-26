import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";

const commOptions = [
  { value: "direct", label: "💬 Direct & honest" },
  { value: "diplomatic", label: "🕊️ Diplomatic" },
  { value: "emotional", label: "❤️ Emotional" },
  { value: "logical", label: "🧠 Logical" },
  { value: "adaptable", label: "🔄 Adaptable" },
];

const CommunicationScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Communication Style" subtitle="How do you connect?">
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-3">
          <Label>How do you communicate?</Label>
          {commOptions.map((o) => (
            <OptionCard key={o.value} selected={data.communicationStyle === o.value} onClick={() => updateData({ communicationStyle: o.value })} title={o.label} />
          ))}
        </div>
        <Button onClick={nextStep} disabled={!data.communicationStyle} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default CommunicationScreen;
