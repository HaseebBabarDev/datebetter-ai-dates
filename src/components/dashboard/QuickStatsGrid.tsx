import React from "react";
import { CandidateRecap } from "@/hooks/useCandidateRecap";

interface QuickStatsGridProps {
  activeCandidateCount: number;
  recap: CandidateRecap;
  onActiveClick: () => void;
  onGoodClick: () => void;
  onBadClick: () => void;
}

export function QuickStatsGrid({
  activeCandidateCount,
  recap,
  onActiveClick,
  onGoodClick,
  onBadClick,
}: QuickStatsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button 
        className="rounded-xl p-3 bg-card border border-border text-center transition-all duration-200 active:scale-[0.98]" 
        onClick={onActiveClick}
      >
        <div className="text-xl font-bold text-primary">{activeCandidateCount}</div>
        <div className="text-[10px] text-muted-foreground">Active</div>
      </button>
      <button 
        className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center transition-all duration-200 active:scale-[0.98]" 
        onClick={onGoodClick}
      >
        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{recap.goodCandidates.length}</div>
        <div className="text-[10px] text-muted-foreground">Good Vibes</div>
      </button>
      <button 
        className="rounded-xl p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-center transition-all duration-200 active:scale-[0.98]" 
        onClick={onBadClick}
      >
        <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{recap.badCandidates.length}</div>
        <div className="text-[10px] text-muted-foreground">Watch Out</div>
      </button>
    </div>
  );
}
