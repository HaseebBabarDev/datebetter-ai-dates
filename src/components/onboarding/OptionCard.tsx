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
        compact ? "px-3 py-2 min-h-[52px] flex items-center" : "px-3 py-2",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn(
        "flex gap-2",
        description && !compact ? "items-start" : "items-center"
      )}>
        {icon && (
          <div className={cn(
            "rounded flex items-center justify-center shrink-0",
            compact ? "w-5 h-5" : "w-8 h-8",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: cn(
                    (icon as React.ReactElement<{ className?: string }>).props.className,
                    compact ? "w-3 h-3" : "w-4 h-4"
                  )
                })
              : icon
            }
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <span className={cn(
                "text-xs font-medium leading-tight block",
                selected ? "text-primary" : "text-foreground"
              )}>
                {title}
              </span>
              {description && !compact && (
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight text-left">
                  {description}
                </p>
              )}
            </div>
            {selected && (
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
