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
        "px-2.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150",
        "hover:border-primary/40",
        selected
          ? "border-primary/60 bg-primary/5 text-primary"
          : "border-border/60 bg-card text-foreground",
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
