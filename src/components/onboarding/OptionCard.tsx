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
        "w-full rounded-xl border-2 text-left transition-all duration-200",
        "hover:border-primary/50 hover:shadow-card",
        compact ? "p-2.5" : "p-4",
        selected
          ? "border-primary bg-primary-very-light shadow-card"
          : "border-border bg-card",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn("flex items-center", compact ? "gap-2" : "gap-3 items-start")}>
        {icon && (
          <div className={cn(
            "rounded-lg flex items-center justify-center shrink-0",
            compact ? "w-7 h-7" : "w-10 h-10",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
          <div className="flex items-center justify-between gap-1">
            <span className={cn(
              "text-xs font-medium",
              selected ? "text-primary" : "text-foreground",
              compact && "leading-tight"
            )}>
              {title}
            </span>
            {selected && (
              <Check className={cn("text-primary shrink-0", compact ? "w-3.5 h-3.5" : "w-5 h-5")} />
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};
