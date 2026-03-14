import React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  leftLabel?: string;
  rightLabel?: string;
  showValue?: boolean;
  className?: string;
  emoji?: string[];
}

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
  leftLabel,
  rightLabel,
  showValue = true,
  className,
  emoji,
}) => {
  const normalizedIndex = Math.round(((value - min) / (max - min)) * ((emoji?.length || 1) - 1));
  const currentEmoji = emoji?.[normalizedIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("space-y-3 p-4 rounded-xl bg-card border border-border/40", className)}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-1.5">
          {currentEmoji && (
            <motion.span
              key={currentEmoji}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="text-lg"
            >
              {currentEmoji}
            </motion.span>
          )}
          {showValue && (
            <motion.span
              key={value}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-sm font-bold text-primary tabular-nums min-w-[1.5ch] text-center"
            >
              {value}
            </motion.span>
          )}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </motion.div>
  );
};
