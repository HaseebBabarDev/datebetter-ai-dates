import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RedFlagCardProps {
  flags: string[];
  severity?: "low" | "medium" | "high";
}

export function RedFlagCard({ flags, severity = "medium" }: RedFlagCardProps) {
  if (!flags.length) return null;

  const severityStyles = {
    low: "border-amber-500/30 bg-amber-500/5",
    medium: "border-orange-500/30 bg-orange-500/5",
    high: "border-destructive/30 bg-destructive/5",
  };

  const iconColor = {
    low: "text-amber-500",
    medium: "text-orange-500",
    high: "text-destructive",
  };

  return (
    <div className={cn("rounded-2xl border p-4 space-y-3", severityStyles[severity])}>
      <div className="flex items-center gap-2">
        <AlertTriangle className={cn("w-4 h-4", iconColor[severity])} />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
          {severity === "high" ? "⚠️ Critical Flags" : "Red Flags Detected"}
        </span>
      </div>
      <ul className="space-y-1.5">
        {flags.map((flag, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="text-destructive shrink-0">•</span>
            <span className="text-foreground/80">{flag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
