import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { RankedOption } from "../RankedOption";

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

const familyPriorityOptions = [
  { value: "timing", label: "Timeline for kids" },
  { value: "parenting_style", label: "Parenting style" },
  { value: "work_life", label: "Work-life balance" },
  { value: "extended_family", label: "Extended family involvement" },
  { value: "education", label: "Education priorities" },
  { value: "location", label: "Where to raise family" },
];

const KidsFamilyScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  
  const familyPriorities = data.familyPriorities || [];
  
  const handlePriorityClick = (value: string) => {
    const currentIndex = familyPriorities.indexOf(value);
    
    if (currentIndex !== -1) {
      // Remove if already selected
      updateData({ 
        familyPriorities: familyPriorities.filter(p => p !== value) 
      });
    } else if (familyPriorities.length < 2) {
      // Add if less than 2 selected
      updateData({ 
        familyPriorities: [...familyPriorities, value] 
      });
    }
  };
  
  const getRank = (value: string): number | null => {
    const index = familyPriorities.indexOf(value);
    return index !== -1 ? index + 1 : null;
  };

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
        
        <div className="space-y-2">
          <Label className="text-sm">Top 2 family priorities (rank in order)</Label>
          <p className="text-xs text-muted-foreground">Select your top 2 priorities</p>
          <div className="grid grid-cols-2 gap-2">
            {familyPriorityOptions.map((o) => (
              <RankedOption
                key={o.value}
                label={o.label}
                rank={getRank(o.value)}
                onClick={() => handlePriorityClick(o.value)}
                disabled={familyPriorities.length >= 2 && !familyPriorities.includes(o.value)}
              />
            ))}
          </div>
        </div>
        
        <Button onClick={nextStep} disabled={!isValid} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default KidsFamilyScreen;
