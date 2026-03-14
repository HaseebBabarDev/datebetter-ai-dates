import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RankedOptionProps {
  label: string;
  rank: number | null;
  onClick: () => void;
  disabled?: boolean;
  index?: number;
}

export const RankedOption: React.FC<RankedOptionProps> = ({
  label,
  rank,
  onClick,
  disabled = false,
  index = 0,
}) => {
  const isSelected = rank !== null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      className={cn(
        "w-full rounded-xl border-2 text-left transition-colors duration-200 px-3 py-2.5",
        isSelected
          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]"
          : "border-border/40 bg-card hover:border-primary/30",
        disabled && !isSelected && "opacity-40 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          "text-xs font-medium transition-colors duration-200",
          isSelected ? "text-primary" : "text-foreground"
        )}>
          {label}
        </span>
        <AnimatePresence mode="wait">
          {isSelected && (
            <motion.span
              key={rank}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0"
            >
              {rank}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};
