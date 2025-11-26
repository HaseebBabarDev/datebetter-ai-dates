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
}

export const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  onClick,
  icon,
  title,
  description,
  disabled = false,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
        "hover:border-primary/50 hover:shadow-card",
        selected
          ? "border-primary bg-primary-very-light shadow-card"
          : "border-border bg-card",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "font-medium",
              selected ? "text-primary" : "text-foreground"
            )}>
              {title}
            </span>
            {selected && (
              <Check className="w-5 h-5 text-primary shrink-0" />
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};
