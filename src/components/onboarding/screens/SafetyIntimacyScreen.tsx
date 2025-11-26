import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { SliderInput } from "../SliderInput";
import { Lock } from "lucide-react";

const intimacyOptions = [
  { value: "exclusive", label: "Only in exclusive relationships" },
  { value: "emotional", label: "After emotional connection forms" },
  { value: "feels_right", label: "When it feels right" },
  { value: "casual_safe", label: "Casual is fine with safety" },
];

const SafetyIntimacyScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Safety & Intimacy" subtitle="Your boundaries are respected here">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
          <Lock className="w-4 h-4" /> This information is private and secure
        </div>
        <div className="space-y-3">
          <Label>I'm comfortable with intimacy:</Label>
          {intimacyOptions.map((o) => (
            <OptionCard key={o.value} selected={data.intimacyComfort === o.value} onClick={() => updateData({ intimacyComfort: o.value })} title={o.label} />
          ))}
        </div>
        <SliderInput label="Red flag detection sensitivity:" value={data.redFlagSensitivity || 5} onChange={(v) => updateData({ redFlagSensitivity: v })} min={1} max={10} leftLabel="Low" rightLabel="High" />
        <SliderInput label="Love bombing alerts:" value={data.loveBombingSensitivity || 5} onChange={(v) => updateData({ loveBombingSensitivity: v })} min={1} max={10} leftLabel="Low" rightLabel="High" />
        <Button onClick={nextStep} disabled={!data.intimacyComfort} className="w-full" size="lg">Complete Setup</Button>
      </div>
    </OnboardingLayout>
  );
};

export default SafetyIntimacyScreen;
