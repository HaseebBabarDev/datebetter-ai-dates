import { useMemo, ReactNode } from "react";
import { differenceInDays } from "date-fns";
import { Droplet, Sparkles, Flame, AlertTriangle } from "lucide-react";
import React from "react";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface CycleAlert {
  phase: string;
  warning: string;
  icon: ReactNode;
  dayInCycle: number;
}

export function useCycleAlerts(profile: Profile | null): CycleAlert | null {
  return useMemo(() => {
    // Hide for male users
    const isMaleUser = profile?.gender_identity === "man_cis" || profile?.gender_identity === "man_trans";
    if (isMaleUser || !profile?.track_cycle || !profile?.last_period_date) return null;

    const lastPeriod = new Date(profile.last_period_date);
    const cycleLength = profile.cycle_length || 28;
    const today = new Date();
    const daysSinceLastPeriod = differenceInDays(today, lastPeriod);
    const dayInCycle = daysSinceLastPeriod % cycleLength || cycleLength;
    const ovulationDay = Math.round(cycleLength / 2) - 2;

    let phase = "";
    let warning = "";
    let icon: ReactNode = null;

    if (dayInCycle <= 5) {
      phase = "Menstrual Phase";
      warning = "Energy may be lower — be gentle with yourself. Estrogen rising.";
      icon = React.createElement(Droplet, { className: "w-4 h-4" });
    } else if (dayInCycle > 5 && dayInCycle < ovulationDay - 2) {
      phase = "Follicular Phase";
      warning = "Estrogen rising — confidence & energy increasing. Good time for new connections!";
      icon = React.createElement(Sparkles, { className: "w-4 h-4" });
    } else if (dayInCycle >= ovulationDay - 2 && dayInCycle <= ovulationDay + 2) {
      phase = "Ovulation Window";
      warning = "Peak fertility & attraction hormones. You may feel more drawn to masculine traits. Make decisions with your head, not just heart!";
      icon = React.createElement(Flame, { className: "w-4 h-4" });
    } else if (dayInCycle > ovulationDay + 2 && dayInCycle < cycleLength - 5) {
      phase = "Luteal Phase";
      warning = "Progesterone rising — you may crave comfort and security. Emotions can feel more intense.";
      icon = React.createElement(AlertTriangle, { className: "w-4 h-4" });
    } else {
      phase = "Pre-Menstrual";
      warning = "PMS territory — emotions may be heightened. Be extra mindful of big decisions.";
      icon = React.createElement(AlertTriangle, { className: "w-4 h-4" });
    }

    return { phase, warning, icon, dayInCycle };
  }, [profile]);
}
