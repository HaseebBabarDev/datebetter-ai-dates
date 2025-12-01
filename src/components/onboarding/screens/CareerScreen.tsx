import React, { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PartyPopper } from "lucide-react";
import logo from "@/assets/logo.jpg";

const careerOptions = [
  { value: "student", label: "Student", subtitle: "" },
  { value: "early", label: "Early career", subtitle: "0-5 years" },
  { value: "established", label: "Established", subtitle: "5-15 years" },
  { value: "senior", label: "Senior/Executive", subtitle: "15+ years" },
  { value: "entrepreneur", label: "Entrepreneur", subtitle: "" },
  { value: "creator", label: "Content Creator", subtitle: "Creative" },
  { value: "athlete", label: "Pro Athlete", subtitle: "" },
  { value: "between", label: "Between jobs", subtitle: "" },
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

const incomeOptions = [
  { value: "under_25k", label: "Under $25,000" },
  { value: "25k_50k", label: "$25,000 - $50,000" },
  { value: "50k_75k", label: "$50,000 - $75,000" },
  { value: "75k_100k", label: "$75,000 - $100,000" },
  { value: "100k_150k", label: "$100,000 - $150,000" },
  { value: "150k_250k", label: "$150,000 - $250,000" },
  { value: "250k_plus", label: "$250,000+" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const preferredEducationOptions = [
  { value: "no_preference", label: "No preference" },
  ...educationOptions,
];

const preferredIncomeOptions = [
  { value: "no_preference", label: "No preference" },
  { value: "under_25k", label: "Under $25,000" },
  { value: "25k_50k", label: "$25,000 - $50,000" },
  { value: "50k_75k", label: "$50,000 - $75,000" },
  { value: "75k_100k", label: "$75,000 - $100,000" },
  { value: "100k_150k", label: "$100,000 - $150,000" },
  { value: "150k_250k", label: "$150,000 - $250,000" },
  { value: "250k_plus", label: "$250,000+" },
];

const CareerScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Check if user earns less than 100k but wants partner earning 250k+
  const lowIncomeRanges = ["under_25k", "25k_50k", "50k_75k", "75k_100k"];
  const userEarnsUnder100k = data.incomeRange && lowIncomeRanges.includes(data.incomeRange);
  const wantsTop1Percent = data.preferredIncomeRange === "250k_plus";
  const showIncomeWarning = userEarnsUnder100k && wantsTop1Percent;

  return (
    <>
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <PartyPopper className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Halfway there!</DialogTitle>
            <DialogDescription className="text-base">
              You're making great progress!
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowPopup(false)} className="w-full mt-2">
            Keep Going
          </Button>
        </DialogContent>
      </Dialog>

      <OnboardingLayout title="Career & Education" subtitle="Your professional life">
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label className="text-sm">Career status:</Label>
            <div className="grid grid-cols-2 gap-2">
            {careerOptions.map((o) => (
              <OptionCard key={o.value} selected={data.careerStage === o.value} onClick={() => updateData({ careerStage: o.value })} title={o.label} subtitle={o.subtitle} compact />
            ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Education level:</Label>
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
          <div className="space-y-2">
            <Label className="text-sm">Income range:</Label>
            <Select
              value={data.incomeRange}
              onValueChange={(value) => updateData({ incomeRange: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select income range" />
              </SelectTrigger>
              <SelectContent>
                {incomeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SliderInput label="Your career ambition:" value={data.ambitionLevel || 3} onChange={(v) => updateData({ ambitionLevel: v })} min={1} max={5} leftLabel="Relaxed" rightLabel="Very driven" />
          
          <div className="pt-2 border-t border-border/50">
            <Label className="text-sm text-muted-foreground mb-2 block">Partner's income & education preferences:</Label>
            <div className="space-y-2">
              <Select
                value={data.preferredEducationLevel}
                onValueChange={(value) => updateData({ preferredEducationLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Preferred education level" />
                </SelectTrigger>
                <SelectContent>
                  {preferredEducationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={data.preferredIncomeRange}
                onValueChange={(value) => updateData({ preferredIncomeRange: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Preferred income range" />
                </SelectTrigger>
                <SelectContent>
                  {preferredIncomeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {showIncomeWarning && (
                <div className="flex items-start gap-2.5 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-fade-in">
                  <img 
                    src={logo} 
                    alt="D.E.V.I." 
                    className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">D.E.V.I. says:</span> Your standards are valid. Men earning $250K+ are less common, so you may see fewer qualified candidates, but we're optimizing for quality over quantity.
                  </p>
                </div>
              )}
            </div>
          </div>
          <Button onClick={nextStep} disabled={!data.careerStage || !data.educationLevel} className="w-full" size="lg">Continue</Button>
        </div>
      </OnboardingLayout>
    </>
  );
};

export default CareerScreen;
