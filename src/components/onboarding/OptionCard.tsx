import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
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
        "w-full rounded-lg border text-left transition-all duration-150",
        "hover:border-primary/50",
        compact ? "px-3 py-1.5" : "px-3 py-2",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <div className={cn(
            "rounded flex items-center justify-center shrink-0",
            compact ? "w-5 h-5" : "w-6 h-6",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: cn(
                    (icon as React.ReactElement<{ className?: string }>).props.className,
                    "w-3 h-3"
                  )
                })
              : icon
            }
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={cn(
              "text-xs font-medium leading-tight",
              selected ? "text-primary" : "text-foreground"
            )}>
              {title}
            </span>
            {selected && (
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
          </div>
          {description && !compact && (
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};
