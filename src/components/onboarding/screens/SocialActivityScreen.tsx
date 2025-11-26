import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { Home, Sparkles, Scale, Moon } from "lucide-react";

const socialOptions = [
  { value: "homebody", label: "Homebody", icon: Home },
  { value: "social_butterfly", label: "Social butterfly", icon: Sparkles },
  { value: "balanced", label: "Balanced", icon: Scale },
  { value: "mood_dependent", label: "Depends on mood", icon: Moon },
];

const activityOptions = [
  { value: "sedentary", label: "Sedentary (little exercise)" },
  { value: "light", label: "Light (1-2x/week)" },
  { value: "moderate", label: "Moderate (3-4x/week)" },
  { value: "active", label: "Active (5+/week)" },
  { value: "very_active", label: "Very active (daily)" },
];

const SocialActivityScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Social & Activity" subtitle="Your energy">
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-3">
          <Label>Your social energy:</Label>
          <div className="grid grid-cols-2 gap-2">
            {socialOptions.map((o) => (
              <OptionCard 
                key={o.value} 
                selected={data.socialStyle === o.value} 
                onClick={() => updateData({ socialStyle: o.value })} 
                icon={<o.icon />}
                title={o.label}
                compact
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Your activity level:</Label>
          {activityOptions.map((o) => (
            <OptionCard 
              key={o.value} 
              selected={data.activityLevel === o.value} 
              onClick={() => updateData({ activityLevel: o.value })} 
              title={o.label} 
            />
          ))}
        </div>

        <Button onClick={nextStep} className="w-full" size="lg">
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default SocialActivityScreen;
