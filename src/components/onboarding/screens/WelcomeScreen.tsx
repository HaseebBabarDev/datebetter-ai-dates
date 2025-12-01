import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Clock, Stars, ShieldCheck, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import welcomeBg from "@/assets/welcome-bg.jpeg";

const WelcomeScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [showReminder, setShowReminder] = useState(true);
  
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");

  const calculateAge = () => {
    if (!month || !day || !year) return null;
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleContinue = () => {
    const age = calculateAge();
    if (age === null) return;
    
    if (age < 18) {
      setShowAgeGate(true);
      return;
    }
    
    updateData({
      birthDate: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      ageConfirmed: true,
    });
    nextStep();
  };

  const isValid = month && day && year && year.length === 4 && data.ageConfirmed;

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${welcomeBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
      </div>

      <OnboardingLayout
        showProgress={false}
        showBack={false}
        headerGradient
        title="Welcome! Let's get started."
        subtitle="Your dating journey begins here"
      >
        <div className="space-y-4 animate-fade-in relative z-10">
          {/* Welcome Heading */}
          <div className="text-center mb-1">
            <h1 className="text-xl md:text-2xl font-poppins font-bold text-foreground">
              Let's Get Started!
            </h1>
          </div>

          {/* D.E.V.I. Badge */}
          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-primary/30 mx-auto w-fit">
            <Stars className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-foreground">D.E.V.I.</span>
            <span className="text-[10px] text-foreground/70">Dating Evaluation & Vetting Intelligence</span>
          </div>

          {/* Onboarding Info - Compact */}
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/30">
              <Clock className="w-3 h-3 text-primary shrink-0" />
              <span className="text-foreground/80">10-15 min</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/30">
              <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
              <span className="text-foreground/80">Private & secure</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/30">
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              <span className="text-foreground/80">Personalized</span>
            </div>
          </div>

          {/* Age Verification */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Please confirm your date of birth</Label>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Month</Label>
                <Input
                  type="number"
                  placeholder="MM"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="text-center"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Day</Label>
                <Input
                  type="number"
                  placeholder="DD"
                  min={1}
                  max={31}
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="text-center"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Year</Label>
                <Input
                  type="number"
                  placeholder="YYYY"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="text-center"
                />
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="ageConfirm"
              checked={data.ageConfirmed}
              onCheckedChange={(checked) => updateData({ ageConfirmed: checked === true })}
            />
            <Label htmlFor="ageConfirm" className="text-sm cursor-pointer leading-relaxed">
              I confirm I am 18 years or older
            </Label>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our{" "}
            <span className="text-primary hover:underline cursor-pointer">Terms</span> &{" "}
            <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
          </p>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!isValid}
            className="w-full"
            size="lg"
          >
            Get Started
          </Button>
        </div>

        {/* Age Gate Modal */}
        <Dialog open={showAgeGate} onOpenChange={setShowAgeGate}>
          <DialogContent className="border-alert border-2">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-alert flex items-center justify-center">
                  <Lock className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <DialogTitle className="text-center">
                You must be 18+ to use dateBetter
              </DialogTitle>
              <DialogDescription className="text-center">
                Come back when you're older! Dating apps require users to be 18 or older for safety reasons.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => window.close()} className="w-full">
              I Understand
            </Button>
          </DialogContent>
        </Dialog>

        {/* Intake Reminder Modal */}
        <Dialog open={showReminder} onOpenChange={setShowReminder}>
          <DialogContent className="border-primary/20 max-w-sm">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </div>
              <DialogTitle className="text-center">
                Take Your Time
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                This intake questionnaire takes about 10-15 minutes to complete. Your thoughtful answers help us provide personalized guidance for your dating journey. It's worth taking the time to answer honestly.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setShowReminder(false)} className="w-full">
              I'm Ready to Begin
            </Button>
          </DialogContent>
        </Dialog>
      </OnboardingLayout>
    </div>
  );
};

export default WelcomeScreen;
