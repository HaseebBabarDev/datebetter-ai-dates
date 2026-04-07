import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SkipForward } from "lucide-react";

interface OnboardingQuestionProps {
  question: string;
  options: { value: string; label: string }[];
  onAnswer: (value: string) => void;
  onSkip: () => void;
  context?: string;
}

export function OnboardingQuestion({
  question,
  options,
  onAnswer,
  onSkip,
  context,
}: OnboardingQuestionProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3 max-w-[85%]">
      {context && (
        <p className="text-[11px] text-muted-foreground italic">{context}</p>
      )}
      <p className="text-sm font-medium text-foreground">{question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onAnswer(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              "border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground",
              "active:scale-95"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <SkipForward className="w-3 h-3" />
        Skip for now
      </button>
    </div>
  );
}
