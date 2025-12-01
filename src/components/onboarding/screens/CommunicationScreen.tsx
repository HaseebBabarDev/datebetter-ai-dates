import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { MessageSquare, Feather, Heart, Brain, RefreshCw } from "lucide-react";

const commOptions = [
  { value: "direct", label: "Direct & honest", icon: MessageSquare },
  { value: "diplomatic", label: "Diplomatic", icon: Feather },
  { value: "emotional", label: "Emotional", icon: Heart },
  { value: "logical", label: "Logical", icon: Brain },
  { value: "adaptable", label: "Adaptable", icon: RefreshCw },
];

const CommunicationScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Communication Style" subtitle="How do you connect?">
      <div className="space-y-4 animate-fade-in">
        <div className="space-y-2">
          <Label className="text-sm">How do you communicate?</Label>
          <div className="space-y-1.5">
          {commOptions.map((o) => (
            <OptionCard 
              key={o.value} 
              selected={data.communicationStyle === o.value} 
              onClick={() => updateData({ communicationStyle: o.value })} 
              icon={<o.icon />}
              title={o.label}
              compact
            />
          ))}
          </div>
        </div>
        <Button onClick={nextStep} disabled={!data.communicationStyle} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default CommunicationScreen;