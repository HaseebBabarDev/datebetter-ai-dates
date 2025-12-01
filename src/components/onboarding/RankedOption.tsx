import React from "react";
import { cn } from "@/lib/utils";

interface RankedOptionProps {
  label: string;
  rank: number | null;
  onClick: () => void;
  disabled?: boolean;
}

export const RankedOption: React.FC<RankedOptionProps> = ({
  label,
  rank,
  onClick,
  disabled = false,
}) => {
  const isSelected = rank !== null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-lg border text-left transition-all duration-150 px-3 py-2",
        "hover:border-primary/50",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card",
        disabled && !isSelected && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          "text-xs font-medium",
          isSelected ? "text-primary" : "text-foreground"
        )}>
          {label}
        </span>
        {isSelected && (
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
            {rank}
          </span>
        )}
      </div>
    </button>
  );
};
