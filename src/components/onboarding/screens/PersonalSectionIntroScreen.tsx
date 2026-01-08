import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Shield, Heart, Lock, ArrowRight } from "lucide-react";

const PersonalSectionIntroScreen = () => {
  const { nextStep } = useOnboarding();

  return (
    <OnboardingLayout
      title="Getting Personal"
      subtitle="The next sections cover sensitive topics"
      showProgress={false}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Main message card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">We're about to get personal</h2>
            <p className="text-muted-foreground text-sm">
              The next few sections ask about your family background, past relationships, 
              and experiences that may have shaped who you are today.
            </p>
          </div>
        </div>

        {/* Why it matters */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-center">Why this matters</h3>
          
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Better pattern recognition</p>
                <p className="text-xs text-muted-foreground">
                  Understanding your past helps D.E.V.I. spot when you might be repeating unhealthy patterns
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
              <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">More personalized guidance</p>
                <p className="text-xs text-muted-foreground">
                  D.E.V.I. can offer advice that accounts for your unique experiences and triggers
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
              <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Your data is private</p>
                <p className="text-xs text-muted-foreground">
                  This information is encrypted and never shared. Skip any questions you're not ready to answer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue button */}
        <div className="space-y-3 pt-2">
          <Button onClick={nextStep} size="lg" className="w-full gap-2">
            I'm Ready to Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            You can always skip questions or come back later in Settings
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default PersonalSectionIntroScreen;
