import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MultiSelectOptionProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  index?: number;
}

export const MultiSelectOption: React.FC<MultiSelectOptionProps> = ({
  selected,
  onClick,
  label,
  icon,
  className,
  index = 0,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors duration-200",
        selected
          ? "border-primary bg-primary/5 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]"
          : "border-border/40 bg-card text-foreground hover:border-primary/30",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="ml-auto"
            >
              <div className="w-4.5 h-4.5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};
