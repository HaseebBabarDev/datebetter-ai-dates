import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreCardProps {
  score: number;
  breakdown?: Record<string, number>;
  previousScore?: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  values: "Values",
  lifestyle: "Lifestyle",
  emotional: "Emotional",
  future_goals: "Future Goals",
  physical: "Physical",
  communication: "Communication",
};

function getScoreColor(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-destructive";
}

function getBarColor(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-destructive";
}

export function ScoreCard({ score, breakdown, previousScore }: ScoreCardProps) {
  const change = previousScore != null ? score - previousScore : null;

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Compatibility Score
        </span>
        {change !== null && change !== 0 && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", change > 0 ? "text-emerald-500" : "text-destructive")}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change > 0 ? "+" : ""}{change}%
          </div>
        )}
        {change === 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Minus className="w-3 h-3" /> No change
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className={cn("text-4xl font-bold", getScoreColor(score))}>{score}</span>
        <span className="text-lg text-muted-foreground">%</span>
      </div>

      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="space-y-2 pt-1">
          {Object.entries(breakdown).map(([key, value]) => {
            const numVal = typeof value === "number" ? value : 0;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {CATEGORY_LABELS[key] || key.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] font-medium">{numVal}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", getBarColor(numVal))}
                    style={{ width: `${numVal}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
