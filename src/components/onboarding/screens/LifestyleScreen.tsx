import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { 
  Home, 
  Sparkles, 
  Scale, 
  Moon, 
  Laptop, 
  Building2, 
  RefreshCw, 
  Phone, 
  GraduationCap, 
  Briefcase 
} from "lucide-react";

const distanceOptions = [
  { value: "5mi", label: "Same neighborhood (5 miles)" },
  { value: "15mi", label: "Same city (15 miles)" },
  { value: "50mi", label: "Same region (50 miles)" },
  { value: "ldr", label: "Long distance OK" },
  { value: "relocate", label: "Will relocate for right person" },
];

const socialOptions = [
  { value: "homebody", label: "Homebody", icon: Home },
  { value: "social_butterfly", label: "Social butterfly", icon: Sparkles },
  { value: "balanced", label: "Balanced", icon: Scale },
  { value: "mood_dependent", label: "Depends on mood", icon: Moon },
];

const activityOptions = [
  { value: "sedentary", label: "Sedentary (little to no exercise)" },
  { value: "light", label: "Light (1-2 times/week)" },
  { value: "moderate", label: "Moderate (3-4 times/week)" },
  { value: "active", label: "Active (5+ times/week)" },
  { value: "very_active", label: "Very active (daily workouts)" },
];

const scheduleOptions = [
  { value: "remote_flexible", label: "Remote / Fully Flexible", icon: Laptop },
  { value: "hybrid", label: "Hybrid (mix of office & remote)", icon: RefreshCw },
  { value: "office_9_5", label: "Office 9-5", icon: Building2 },
  { value: "shift_work", label: "Shift Work (varied hours)", icon: RefreshCw },
  { value: "on_call", label: "On-Call / Variable", icon: Phone },
  { value: "overnight", label: "Overnight / Night Shift", icon: Moon },
  { value: "student", label: "Student Schedule", icon: GraduationCap },
  { value: "self_employed", label: "Self-Employed / Flexible", icon: Briefcase },
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
              <OptionCard 
                key={o.value} 
                selected={data.scheduleFlexibility === o.value} 
                onClick={() => updateData({ scheduleFlexibility: o.value })} 
                icon={<o.icon className="w-4 h-4" />}
                title={o.label} 
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Your social energy:</Label>
          <div className="grid grid-cols-2 gap-2">
            {socialOptions.map((o) => (
              <OptionCard 
                key={o.value} 
                selected={data.socialStyle === o.value} 
                onClick={() => updateData({ socialStyle: o.value })} 
                icon={<o.icon className="w-4 h-4" />}
                title={o.label} 
              />
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