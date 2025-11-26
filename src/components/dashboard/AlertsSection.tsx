import React from "react";
import { AlertTriangle, Heart, Clock, TrendingUp } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { differenceInDays } from "date-fns";

type Candidate = Tables<"candidates">;

interface AlertsSectionProps {
  candidates: Candidate[];
}

interface Alert {
  id: string;
  type: "warning" | "info" | "success" | "urgent";
  icon: React.ReactNode;
  title: string;
  message: string;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ candidates }) => {
  const alerts = generateAlerts(candidates);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Insights & Alerts
      </h2>
      <div className="space-y-2">
        {alerts.slice(0, 3).map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
};

const AlertCard: React.FC<{ alert: Alert }> = ({ alert }) => {
  const styles = {
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    info: "bg-primary/10 border-primary/20 text-primary",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    urgent: "bg-destructive/10 border-destructive/20 text-destructive",
  };

  return (
    <div className={`rounded-xl p-3 border ${styles[alert.type]}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{alert.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{alert.title}</p>
          <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
        </div>
      </div>
    </div>
  );
};

function generateAlerts(candidates: Candidate[]): Alert[] {
  const alerts: Alert[] = [];
  const today = new Date();

  // Check for candidates with red flags
  const redFlagCandidates = candidates.filter((c) => {
    const flags = c.red_flags as unknown[];
    return Array.isArray(flags) && flags.length >= 3;
  });
  if (redFlagCandidates.length > 0) {
    const flagCount = (redFlagCandidates[0].red_flags as unknown[])?.length || 0;
    alerts.push({
      id: "red-flags",
      type: "warning",
      icon: <AlertTriangle className="w-4 h-4" />,
      title: "Red Flag Alert",
      message: `${redFlagCandidates[0].nickname} has ${flagCount} red flags logged`,
    });
  }

  // Check for no contact candidates
  const noContactCandidates = candidates.filter((c) => c.no_contact_active);
  noContactCandidates.forEach((c) => {
    if (c.no_contact_day && c.no_contact_day > 0) {
      alerts.push({
        id: `nc-${c.id}`,
        type: "info",
        icon: <Clock className="w-4 h-4" />,
        title: `Day ${c.no_contact_day} of No Contact`,
        message: `Stay strong! You're doing great with ${c.nickname}`,
      });
    }
  });

  // Check for high compatibility matches
  const highCompatibility = candidates.filter(
    (c) => c.compatibility_score && c.compatibility_score >= 80
  );
  if (highCompatibility.length > 0) {
    alerts.push({
      id: "high-match",
      type: "success",
      icon: <Heart className="w-4 h-4" />,
      title: "High Compatibility Match",
      message: `${highCompatibility[0].nickname} scores ${highCompatibility[0].compatibility_score}% compatible`,
    });
  }

  // Check for stale candidates (no updates in 7+ days)
  const staleCandidates = candidates.filter((c) => {
    if (!c.updated_at) return false;
    return differenceInDays(today, new Date(c.updated_at)) > 7;
  });
  if (staleCandidates.length > 0) {
    alerts.push({
      id: "stale",
      type: "info",
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Time for an Update?",
      message: `You haven't logged anything for ${staleCandidates[0].nickname} in a week`,
    });
  }

  return alerts;
}
