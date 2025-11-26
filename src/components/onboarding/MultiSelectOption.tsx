import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface MultiSelectOptionProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export const MultiSelectOption: React.FC<MultiSelectOptionProps> = ({
  selected,
  onClick,
  label,
  icon,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
        "hover:border-primary/50",
        selected
          ? "border-primary bg-primary-very-light text-primary"
          : "border-border bg-card text-foreground",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
        {selected && <Check className="w-4 h-4 ml-auto" />}
      </div>
    </button>
  );
};
