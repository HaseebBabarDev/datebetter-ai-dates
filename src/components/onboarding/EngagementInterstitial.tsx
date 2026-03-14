import React, { useEffect, useState } from "react";
import { Sparkles, Heart, Brain, Shield, TrendingUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterstitialData {
  icon: React.ElementType;
  label: string;
  fact: string;
  accent: string;
}

const interstitials: Record<number, InterstitialData> = {
  5: {
    icon: Sparkles,
    label: "Did you know?",
    fact: "People who define their dating preferences clearly are 3x more likely to find compatible partners.",
    accent: "from-primary/20 to-secondary/20",
  },
  9: {
    icon: Heart,
    label: "Fun fact",
    fact: "Couples who share core values report 31% higher relationship satisfaction than those who don't.",
    accent: "from-pink-500/20 to-rose-500/20",
  },
  13: {
    icon: Brain,
    label: "Did you know?",
    fact: "Understanding your communication style can reduce misunderstandings by up to 40% in new relationships.",
    accent: "from-violet-500/20 to-indigo-500/20",
  },
  17: {
    icon: Shield,
    label: "You're doing great!",
    fact: "Self-awareness is the #1 predictor of healthy relationships — and you're building it right now.",
    accent: "from-emerald-500/20 to-teal-500/20",
  },
  21: {
    icon: TrendingUp,
    label: "Almost there!",
    fact: "Users who complete the full setup get 85% more accurate AI scoring and personalized insights.",
    accent: "from-amber-500/20 to-orange-500/20",
  },
  24: {
    icon: Lightbulb,
    label: "One last thing",
    fact: "Your AI assistant D.E.V.I. uses everything you've shared to protect you from red flags in real time.",
    accent: "from-cyan-500/20 to-blue-500/20",
  },
};

interface EngagementInterstitialProps {
  step: number;
  onComplete: () => void;
}

const EngagementInterstitial: React.FC<EngagementInterstitialProps> = ({ step, onComplete }) => {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const data = interstitials[step];

  useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setPhase("visible"), 50);
    // Start exit after 3 seconds
    const exitTimer = setTimeout(() => setPhase("exit"), 3000);
    // Complete after exit animation
    const completeTimer = setTimeout(() => onComplete(), 3500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!data) return null;

  const Icon = data.icon;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      {/* Animated background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-700",
          data.accent,
          phase !== "exit" && "opacity-100"
        )}
      />

      {/* Content */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center text-center max-w-sm transition-all duration-500 ease-out",
          phase === "enter" && "opacity-0 scale-90 translate-y-6",
          phase === "visible" && "opacity-100 scale-100 translate-y-0",
          phase === "exit" && "opacity-0 scale-95 -translate-y-4"
        )}
      >
        {/* Icon pulse */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-primary/5 animate-ping" />
        </div>

        {/* Label */}
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-widest text-primary mb-3 transition-all duration-500 delay-200",
            phase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          {data.label}
        </span>

        {/* Fact */}
        <p
          className={cn(
            "text-lg sm:text-xl font-semibold text-foreground leading-relaxed transition-all duration-500 delay-300",
            phase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}
        >
          {data.fact}
        </p>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full bg-primary/30 transition-all duration-1000",
                phase === "visible" && "bg-primary"
              )}
              style={{
                width: phase === "visible" ? "24px" : "6px",
                transitionDelay: `${i * 300 + 400}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export { interstitials };
export default EngagementInterstitial;
