import React, { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import welcomeBg from "@/assets/welcome-bg.jpeg";

const WelcomeScreen = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();
      
      if (data?.name) {
        setUserName(data.name);
      } else if (user.email) {
        // Use email username as fallback
        const emailName = user.email.split("@")[0];
        // Capitalize first letter
        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
      }
    };
    
    fetchUserName();
  }, [user]);
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
        title={userName ? `Welcome, ${userName}!` : "Welcome to dateBetter"}
        subtitle="Your dating journey starts here"
      >
        <div className="space-y-8 animate-fade-in relative z-10">

        {/* Age Verification */}
        <div className="space-y-4">
          <Label className="text-base">Please confirm your date of birth</Label>
          
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
