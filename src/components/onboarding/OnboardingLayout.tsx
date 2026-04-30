import React, { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  showProgress?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  headerGradient?: boolean;
  emoji?: string;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  showProgress = true,
  showBack = true,
  onBack,
  title,
  subtitle,
  headerGradient = false,
  emoji,
}) => {
  const { currentStep, totalSteps, prevStep } = useOnboarding();
  const navigate = useNavigate();
  const { user } = useAuth();
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const [skipping, setSkipping] = useState(false);

  const handleBack = onBack || prevStep;

  const handleSkipOnboarding = async () => {
    if (!user) return;
    setSkipping(true);
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true, onboarding_step: 0 })
        .eq("user_id", user.id);
      navigate("/devi", { replace: true });
    } catch (err) {
      toast.error("Something went wrong");
      setSkipping(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      {headerGradient ? (
        <header
          className="bg-[image:var(--gradient-header)] px-4 pb-3 text-center relative"
          style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0.75rem)" }}
        >
          {showBack && (onBack || currentStep > 0) && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 text-foreground hover:bg-foreground/10 h-9 w-9"
              style={{ top: "max(env(safe-area-inset-top, 0px), 0.75rem)" }}
              onClick={handleBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
              {subtitle}
            </p>
          )}
        </header>
      ) : (
        <header
          className="px-4 pb-2 flex items-center justify-between border-b border-border/30"
          style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0.75rem)" }}
        >
          <div className="flex items-center gap-2">
            {showBack && (onBack || currentStep > 0) && (
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground h-9 w-9"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              dateBetter
            </h1>
          </div>
          {showProgress && currentStep > 0 && (
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
              {currentStep}/{totalSteps - 1}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            onClick={handleSkipOnboarding}
            disabled={skipping}
          >
            {skipping ? "..." : "Skip"}
          </Button>
        </header>
      )}

      {/* Progress Bar */}
      {showProgress && currentStep > 0 && (
        <div className="px-4 py-1.5">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
            <motion.div
              className="h-full rounded-full bg-[image:var(--gradient-primary)]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Content with transition */}
      <main className="flex-1 overflow-y-auto overscroll-contain pb-safe-bottom">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="max-w-lg mx-auto px-4 py-4 pb-8"
          >
            {!headerGradient && title && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.3 }}
                className="mb-4"
              >
                <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 overflow-visible">
                  {emoji && <span className="text-xl leading-none shrink-0">{emoji}</span>}
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{subtitle}</p>
                )}
              </motion.div>
            )}
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
