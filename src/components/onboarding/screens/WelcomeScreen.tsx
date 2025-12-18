import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Zap, Stars, ShieldCheck, Sparkles, ArrowRight, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import welcomeBg from "@/assets/welcome-bg.jpeg";

const WelcomeScreen = () => {
  const { data, updateData, nextStep, goToStep } = useOnboarding();
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [showIntakeChoice, setShowIntakeChoice] = useState(false);
  
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
    
    // Show intake choice modal
    setShowIntakeChoice(true);
  };

  const handleQuickStart = () => {
    // Quick start - just get essential info then go to completion
    // This will skip to step 5 (RelationshipGoalsScreen) which is essential
    setShowIntakeChoice(false);
    nextStep();
  };

  const handleDetailedSetup = () => {
    // Full detailed setup
    setShowIntakeChoice(false);
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
        <div className="space-y-5 animate-fade-in relative z-10">
          {/* Welcome Heading */}
          <div className="text-center mb-2">
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

          {/* Onboarding Info - Modern pill badges */}
          <div className="flex justify-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card shadow-sm border border-border/50">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">Quick Setup</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card shadow-sm border border-border/50">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">Private</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card shadow-sm border border-border/50">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">AI-Powered</span>
            </div>
          </div>

          {/* Age Verification */}
          <div className="space-y-3">
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

        {/* Intake Choice Modal - Modern Design */}
        <Dialog open={showIntakeChoice} onOpenChange={setShowIntakeChoice}>
          <DialogContent className="border-primary/20 max-w-sm p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6">
              <DialogHeader className="space-y-3">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <DialogTitle className="text-center text-xl">
                  How would you like to set up?
                </DialogTitle>
                <DialogDescription className="text-center text-sm">
                  Choose your path - you can always add more details later
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Quick Start Option */}
              <button
                onClick={handleQuickStart}
                className="w-full p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/30 transition-all group text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Quick Start</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Basic essentials only. Get started in under 2 minutes.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-3" />
                </div>
              </button>

              {/* Detailed Setup Option */}
              <button
                onClick={handleDetailedSetup}
                className="w-full p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/30 transition-all group text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center shrink-0 group-hover:bg-secondary/50 transition-colors">
                    <Layers className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground">Full Setup</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Give D.E.V.I. more details for smarter, personalized insights.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-3" />
                </div>
              </button>

              <p className="text-[11px] text-muted-foreground text-center pt-2">
                Your data is encrypted and never shared
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </OnboardingLayout>
    </div>
  );
};

export default WelcomeScreen;
