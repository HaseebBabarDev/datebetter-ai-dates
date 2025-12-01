import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OptionCard } from "../OptionCard";
import { AlertTriangle } from "lucide-react";

const kidsStatusOptions = [
  { value: "no_kids", label: "No children" },
  { value: "has_young_kids", label: "Yes, young children" },
  { value: "has_adult_kids", label: "Yes, adult children" },
];

const kidsDesireOptions = [
  { value: "definitely_yes", label: "Definitely yes" },
  { value: "maybe", label: "Maybe/Open to it" },
  { value: "definitely_no", label: "Definitely no" },
];

const KidsFamilyScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const isValid = data.kidsStatus && data.kidsDesire;

  return (
    <OnboardingLayout title="Kids & Family Planning" subtitle="Important for compatibility">
      <div className="space-y-4 animate-fade-in">
        <div className="space-y-2">
          <Label className="text-sm">Do you have children?</Label>
          <div className="grid grid-cols-2 gap-2">
          {kidsStatusOptions.map((o) => (
            <OptionCard key={o.value} selected={data.kidsStatus === o.value} onClick={() => updateData({ kidsStatus: o.value })} title={o.label} compact />
          ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Do you want (more) children?</Label>
          <div className="grid grid-cols-2 gap-2">
          {kidsDesireOptions.map((o) => (
            <OptionCard key={o.value} selected={data.kidsDesire === o.value} onClick={() => updateData({ kidsDesire: o.value })} title={o.label} compact />
          ))}
          </div>
        </div>
        <Button onClick={nextStep} disabled={!isValid} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default KidsFamilyScreen;
