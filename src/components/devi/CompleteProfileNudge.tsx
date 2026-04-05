import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Brain, Shield, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompleteProfileNudgeProps {
  onDismiss: () => void;
  className?: string;
}

const UNLOCK_FEATURES = [
  { icon: TrendingUp, label: "Accurate compatibility scoring" },
  { icon: Brain, label: "Personalized pattern detection" },
  { icon: Shield, label: "Red flag sensitivity calibration" },
];

export const CompleteProfileNudge: React.FC<CompleteProfileNudgeProps> = ({ onDismiss, className }) => {
  const navigate = useNavigate();

  return (
    <div className={`rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3 ${className || ""}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">Want better insights?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete your profile so D.E.V.I. can give you personalized advice based on your attachment style, values, and patterns.
          </p>
        </div>
      </div>

      <div className="space-y-1.5 ml-[52px]">
        {UNLOCK_FEATURES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 ml-[52px]">
        <Button
          size="sm"
          className="gap-1.5 bg-[image:var(--gradient-hero)] hover:opacity-90"
          onClick={() => navigate("/setup?setup=full")}
        >
          Complete Profile
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={onDismiss}
        >
          Later
        </Button>
      </div>
    </div>
  );
};
