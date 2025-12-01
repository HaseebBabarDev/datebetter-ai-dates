import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

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
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border transition-all duration-150 relative",
        "hover:border-primary/40",
        compact ? "px-2.5 py-2 min-h-[38px] flex items-center text-left" : "px-3 py-2 text-left",
        selected
          ? "border-primary/60 bg-primary/5"
          : "border-border/60 bg-card",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn(
        "flex gap-2 items-center w-full",
        description && !compact && "items-start"
      )}>
        {icon && (
          <div className={cn(
            "rounded-md flex items-center justify-center shrink-0",
            compact ? "w-7 h-7" : "w-8 h-8",
            selected ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"
          )}>
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: cn(
                    (icon as React.ReactElement<{ className?: string }>).props.className,
                    compact ? "w-3.5 h-3.5" : "w-4 h-4"
                  )
                })
              : icon
            }
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-xs font-medium leading-tight block",
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
        {selected && (
          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
        )}
      </div>
    </button>
  );
};
