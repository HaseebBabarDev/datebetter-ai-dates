import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContinueButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

const ContinueButton: React.FC<ContinueButtonProps> = ({
  onClick,
  disabled = false,
  label = "Continue",
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35 }}
      className={cn("pt-2", className)}
    >
      <Button
        onClick={onClick}
        disabled={disabled}
        size="lg"
        className={cn(
          "w-full relative overflow-hidden transition-all duration-300 rounded-xl h-12 text-base font-semibold",
          !disabled && "bg-[image:var(--gradient-primary)] hover:opacity-90 shadow-[var(--shadow-soft)]"
        )}
      >
        <span className="relative z-10 flex items-center gap-2">
          {label}
          <motion.span
            animate={!disabled ? { x: [0, 3, 0] } : { x: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.span>
        </span>
      </Button>
    </motion.div>
  );
};

export default ContinueButton;
