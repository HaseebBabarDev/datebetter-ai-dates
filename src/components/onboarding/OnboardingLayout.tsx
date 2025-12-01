import React, { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  showProgress?: boolean;
  showBack?: boolean;
  title?: string;
  subtitle?: string;
  headerGradient?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  showProgress = true,
  showBack = true,
  title,
  subtitle,
  headerGradient = false,
}) => {
  const { currentStep, totalSteps, prevStep } = useOnboarding();
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const [isVisible, setIsVisible] = useState(false);
  const [displayStep, setDisplayStep] = useState(currentStep);

  useEffect(() => {
    // Fade out
    setIsVisible(false);
    
    // After fade out, update content and fade in
    const timer = setTimeout(() => {
      setDisplayStep(currentStep);
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // Initial mount animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {headerGradient ? (
        <header className="bg-[image:var(--gradient-header)] px-6 py-3 text-center">
          {showBack && currentStep > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 text-foreground hover:bg-foreground/10"
              onClick={prevStep}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-muted-foreground text-sm md:text-base">
              {subtitle}
            </p>
          )}
        </header>
      ) : (
        <header className="px-4 py-2 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-3">
            {showBack && currentStep > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground h-8 w-8"
                onClick={prevStep}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              dateBetter
            </h1>
          </div>
          {showProgress && currentStep > 0 && (
            <span className="text-xs text-muted-foreground">
              {currentStep}/{totalSteps - 1}
            </span>
          )}
        </header>
      )}

      {/* Progress Bar */}
      {showProgress && currentStep > 0 && (
        <div className="px-4 py-1">
          <Progress value={progress} className="h-1 transition-all duration-300" />
        </div>
      )}

      {/* Content with transition */}
      <main className="flex-1 overflow-auto">
        <div 
          key={displayStep}
          className={cn(
            "container max-w-lg mx-auto px-4 py-3 transition-all duration-300 ease-out",
            isVisible 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 translate-x-4"
          )}
        >
          {!headerGradient && title && (
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
              {subtitle && (
                <p className="text-muted-foreground text-sm">{subtitle}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};
