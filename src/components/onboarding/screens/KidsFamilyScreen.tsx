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
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-3">
          <Label>Do you have children?</Label>
          {kidsStatusOptions.map((o) => (
            <OptionCard key={o.value} selected={data.kidsStatus === o.value} onClick={() => updateData({ kidsStatus: o.value })} title={o.label} />
          ))}
        </div>
        <div className="space-y-3">
          <Label>Do you want (more) children?</Label>
          {kidsDesireOptions.map((o) => (
            <OptionCard key={o.value} selected={data.kidsDesire === o.value} onClick={() => updateData({ kidsDesire: o.value })} title={o.label} />
          ))}
        </div>
        <Button onClick={nextStep} disabled={!isValid} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default KidsFamilyScreen;
