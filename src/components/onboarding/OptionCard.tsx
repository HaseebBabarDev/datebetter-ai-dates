import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  index?: number;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  description,
  disabled = false,
  className,
  compact = false,
  index = 0,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      className={cn(
        "w-full rounded-xl border-2 transition-colors duration-200 relative overflow-hidden",
        compact ? "px-2.5 py-2 min-h-[42px] flex items-center text-left" : "px-3 py-2.5 text-left",
        selected
          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
          : "border-border/40 bg-card hover:border-primary/30 hover:bg-primary/[0.02]",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {/* Selection glow effect */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-gradient-to-r from-primary/[0.06] to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "flex gap-2.5 items-center w-full relative z-10",
        description && !compact && "items-start"
      )}>
        {icon && (
          <motion.div
            animate={selected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200",
              compact ? "w-7 h-7" : "w-8 h-8",
              selected ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"
            )}
          >
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: cn(
                    (icon as React.ReactElement<{ className?: string }>).props.className,
                    compact ? "w-3.5 h-3.5" : "w-4 h-4"
                  )
                })
              : icon
            }
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-xs font-medium leading-tight block transition-colors duration-200",
            selected ? "text-primary" : "text-foreground"
          )}>
            {title}
          </span>
          {subtitle && compact && (
            <span className="text-[10px] text-muted-foreground leading-tight block">
              {subtitle}
            </span>
          )}
          {description && !compact && (
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {description}
            </p>
          )}
        </div>
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};
