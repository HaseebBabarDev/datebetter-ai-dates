import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";

const distanceOptions = [
  { value: "5mi", label: "Same neighborhood (5 miles)" },
  { value: "15mi", label: "Same city (15 miles)" },
  { value: "50mi", label: "Same region (50 miles)" },
  { value: "ldr", label: "Long distance OK" },
  { value: "relocate", label: "Will relocate for right person" },
];

const socialOptions = [
  { value: "homebody", label: "🏠 Homebody" },
  { value: "social_butterfly", label: "🦋 Social butterfly" },
  { value: "balanced", label: "⚖️ Balanced" },
  { value: "mood_dependent", label: "🌙 Depends on mood" },
];

const activityOptions = [
  { value: "sedentary", label: "Sedentary (little to no exercise)" },
  { value: "light", label: "Light (1-2 times/week)" },
  { value: "moderate", label: "Moderate (3-4 times/week)" },
  { value: "active", label: "Active (5+ times/week)" },
  { value: "very_active", label: "Very active (daily workouts)" },
];

const scheduleOptions = [
  { value: "remote_flexible", label: "🏡 Remote / Fully Flexible" },
  { value: "hybrid", label: "🔄 Hybrid (mix of office & remote)" },
  { value: "office_9_5", label: "🏢 Office 9-5" },
  { value: "shift_work", label: "🔄 Shift Work (varied hours)" },
  { value: "on_call", label: "📞 On-Call / Variable" },
  { value: "overnight", label: "🌙 Overnight / Night Shift" },
  { value: "student", label: "📚 Student Schedule" },
  { value: "self_employed", label: "💼 Self-Employed / Flexible" },
];

const LifestyleScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Lifestyle & Location" subtitle="Your daily life">
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-3">
          <Label>How far will you travel for love?</Label>
          {distanceOptions.map((o) => (
            <OptionCard key={o.value} selected={data.distancePreference === o.value} onClick={() => updateData({ distancePreference: o.value })} title={o.label} />
          ))}
        </div>

        <div className="space-y-3">
          <Label>Your work schedule:</Label>
          <p className="text-xs text-muted-foreground">This helps match you with compatible schedules</p>
          <div className="grid grid-cols-2 gap-2">
            {scheduleOptions.map((o) => (
              <OptionCard key={o.value} selected={data.scheduleFlexibility === o.value} onClick={() => updateData({ scheduleFlexibility: o.value })} title={o.label} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Your social energy:</Label>
          <div className="grid grid-cols-2 gap-2">
            {socialOptions.map((o) => (
              <OptionCard key={o.value} selected={data.socialStyle === o.value} onClick={() => updateData({ socialStyle: o.value })} title={o.label} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Your activity level:</Label>
          {activityOptions.map((o) => (
            <OptionCard key={o.value} selected={data.activityLevel === o.value} onClick={() => updateData({ activityLevel: o.value })} title={o.label} />
          ))}
        </div>

        <Button onClick={nextStep} disabled={!data.distancePreference} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default LifestyleScreen;