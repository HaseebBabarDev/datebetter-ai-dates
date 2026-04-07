import React from "react";
import { Lightbulb } from "lucide-react";

interface InsightCardProps {
  insights: string[];
  title?: string;
}

export function InsightCard({ insights, title = "Key Insights" }: InsightCardProps) {
  if (!insights.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-500" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span className="text-foreground/90">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
