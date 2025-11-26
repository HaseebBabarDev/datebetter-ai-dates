import React from "react";
import { differenceInDays, addDays, format } from "date-fns";
import { Moon, Sun, Sparkles, Heart } from "lucide-react";

interface CycleStatusBarProps {
  lastPeriodDate: string | null;
  cycleLength: number;
}

type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

interface PhaseInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  advice: string;
}

const phaseConfig: Record<CyclePhase, PhaseInfo> = {
  menstrual: {
    name: "Menstrual Phase",
    icon: <Moon className="w-4 h-4" />,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    advice: "Rest & reflect. Low energy is normal.",
  },
  follicular: {
    name: "Follicular Phase",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    advice: "Energy rising! Great time for new connections.",
  },
  ovulation: {
    name: "Ovulation Window",
    icon: <Sun className="w-4 h-4" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    advice: "Peak confidence & attraction. Trust your gut!",
  },
  luteal: {
    name: "Luteal Phase",
    icon: <Heart className="w-4 h-4" />,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    advice: "Nurturing energy. Watch for heightened emotions.",
  },
};

export const CycleStatusBar: React.FC<CycleStatusBarProps> = ({
  lastPeriodDate,
  cycleLength,
}) => {
  if (!lastPeriodDate) return null;

  const today = new Date();
  const lastPeriod = new Date(lastPeriodDate);
  const dayInCycle = differenceInDays(today, lastPeriod) % cycleLength;
  const nextPeriod = addDays(lastPeriod, cycleLength);
  const daysUntilPeriod = differenceInDays(nextPeriod, today);

  const phase = getCyclePhase(dayInCycle, cycleLength);
  const phaseInfo = phaseConfig[phase];
  const progress = (dayInCycle / cycleLength) * 100;

  return (
    <div className={`rounded-xl p-4 ${phaseInfo.bgColor} border border-border`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`${phaseInfo.color}`}>{phaseInfo.icon}</div>
          <span className={`font-medium ${phaseInfo.color}`}>{phaseInfo.name}</span>
        </div>
        <span className="text-sm text-muted-foreground">Day {dayInCycle + 1}</span>
      </div>
      
      <div className="relative h-2 bg-border rounded-full overflow-hidden mb-3">
        <div 
          className="absolute h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">{phaseInfo.advice}</p>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
          {daysUntilPeriod > 0 ? `${daysUntilPeriod}d until next` : "Due today"}
        </span>
      </div>
    </div>
  );
};

function getCyclePhase(dayInCycle: number, cycleLength: number): CyclePhase {
  const ovulationDay = cycleLength - 14;
  
  if (dayInCycle < 5) return "menstrual";
  if (dayInCycle < ovulationDay - 2) return "follicular";
  if (dayInCycle < ovulationDay + 2) return "ovulation";
  return "luteal";
}
