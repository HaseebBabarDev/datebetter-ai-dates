import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { SliderInput } from "../SliderInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const careerOptions = [
  { value: "student", label: "Student" },
  { value: "early", label: "Early career (0-5 years)" },
  { value: "established", label: "Established (5-15 years)" },
  { value: "senior", label: "Senior/Executive (15+ years)" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "between", label: "Between opportunities" },
];

const educationOptions = [
  { value: "high_school", label: "High school" },
  { value: "some_college", label: "Some college" },
  { value: "associates", label: "Associate's degree" },
  { value: "bachelors", label: "Bachelor's degree" },
  { value: "masters", label: "Master's degree" },
  { value: "doctorate", label: "Doctorate/PhD" },
  { value: "trade_school", label: "Trade/Vocational school" },
];

const CareerScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  return (
    <OnboardingLayout title="Career & Education" subtitle="Your professional life">
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-3">
          <Label>Career status:</Label>
          {careerOptions.map((o) => (
            <OptionCard key={o.value} selected={data.careerStage === o.value} onClick={() => updateData({ careerStage: o.value })} title={o.label} />
          ))}
        </div>
        <div className="space-y-2">
          <Label>Education level:</Label>
          <Select
            value={data.educationLevel}
            onValueChange={(value) => updateData({ educationLevel: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select education level" />
            </SelectTrigger>
            <SelectContent>
              {educationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <SliderInput label="Your career ambition:" value={data.ambitionLevel || 3} onChange={(v) => updateData({ ambitionLevel: v })} min={1} max={5} leftLabel="Relaxed" rightLabel="Very driven" />
        <Button onClick={nextStep} disabled={!data.careerStage} className="w-full" size="lg">Continue</Button>
      </div>
    </OnboardingLayout>
  );
};

export default CareerScreen;
