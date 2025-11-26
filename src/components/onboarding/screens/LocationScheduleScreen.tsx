import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { 
  Laptop, 
  Building2, 
  RefreshCw, 
  Phone, 
  GraduationCap, 
  Briefcase,
  Moon,
  Plane
} from "lucide-react";

const distanceOptions = [
  { value: "5mi", label: "Same neighborhood (5 mi)" },
  { value: "15mi", label: "Same city (15 mi)" },
  { value: "50mi", label: "Same region (50 mi)" },
  { value: "ldr", label: "Long distance OK" },
  { value: "relocate", label: "Will relocate" },
];

const scheduleOptions = [
  { value: "remote_flexible", label: "Remote / Flexible", icon: Laptop },
  { value: "hybrid", label: "Hybrid", icon: RefreshCw },
  { value: "office_9_5", label: "Office 9-5", icon: Building2 },
  { value: "shift_work", label: "Shift Work", icon: RefreshCw },
  { value: "on_call", label: "On-Call", icon: Phone },
  { value: "overnight", label: "Night Shift", icon: Moon },
  { value: "frequent_traveler", label: "Frequent Traveler", icon: Plane },
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "self_employed", label: "Self-Employed", icon: Briefcase },
];

const LocationScheduleScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Location & Schedule" subtitle="Your availability">
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-3">
          <Label>How far will you travel for love?</Label>
          {distanceOptions.map((o) => (
            <OptionCard 
              key={o.value} 
              selected={data.distancePreference === o.value} 
              onClick={() => updateData({ distancePreference: o.value })} 
              title={o.label} 
            />
          ))}
        </div>

        <div className="space-y-3">
          <Label>Your work schedule:</Label>
          <p className="text-xs text-muted-foreground">Helps match compatible schedules</p>
        <div className="grid grid-cols-2 gap-2">
            {scheduleOptions.map((o) => (
              <OptionCard 
                key={o.value} 
                selected={data.scheduleFlexibility === o.value} 
                onClick={() => updateData({ scheduleFlexibility: o.value })} 
                icon={<o.icon />}
                title={o.label}
                compact
              />
            ))}
          </div>
        </div>

        <Button onClick={nextStep} disabled={!data.distancePreference || !data.scheduleFlexibility} className="w-full" size="lg">
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default LocationScheduleScreen;
