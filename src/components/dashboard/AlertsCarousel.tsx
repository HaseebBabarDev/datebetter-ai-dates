import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Droplet, Flame, AlertTriangle, Ban, XCircle, Bell } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { OxytocinAlert, LoveBombingAlert } from "@/hooks/useDatingAlerts";

type Candidate = Tables<"candidates">;
type Profile = Tables<"profiles">;

interface CycleAlert {
  phase: string;
  warning: string;
  icon: React.ReactNode;
  dayInCycle: number;
}

interface AlertsCarouselProps {
  profile: Profile | null;
  cycleAlerts: CycleAlert | null;
  oxytocinAlerts: OxytocinAlert[];
  loveBombingAlerts: LoveBombingAlert[];
  candidates: Candidate[];
}

export function AlertsCarousel({
  profile,
  cycleAlerts,
  oxytocinAlerts,
  loveBombingAlerts,
  candidates,
}: AlertsCarouselProps) {
  const navigate = useNavigate();
  
  const isMaleUser = profile?.gender_identity === "man_cis" || profile?.gender_identity === "man_trans";
  
  const alerts: { 
    key: string; 
    icon: React.ReactNode; 
    label: string; 
    sub?: string; 
    color: string; 
    onClick?: () => void;
  }[] = [];
  
  // Cycle Setup CTA - only show if not completed onboarding (they haven't consciously skipped it yet) and not male
  if (!isMaleUser && profile?.track_cycle && !profile?.last_period_date && !profile?.onboarding_completed) {
    alerts.push({
      key: "cycle-setup",
      icon: <Droplet className="w-3 h-3" />,
      label: "Set up cycle",
      color: "bg-secondary/20 text-secondary border-secondary/30",
      onClick: () => navigate("/settings?tab=preferences&section=cycle"),
    });
  }

  // Cycle Alert
  if (cycleAlerts) {
    alerts.push({
      key: "cycle-alert",
      icon: cycleAlerts.icon,
      label: cycleAlerts.phase,
      sub: `Day ${cycleAlerts.dayInCycle}`,
      color: "bg-accent/20 text-accent-foreground border-accent/30",
    });
  }

  // Oxytocin Alerts - bonding hormone high after intimacy
  oxytocinAlerts.forEach(({ candidate, daysSince }) => {
    alerts.push({
      key: `oxy-${candidate.id}`,
      icon: <Flame className="w-3 h-3" />,
      label: `${candidate.nickname}`,
      sub: daysSince <= 2 ? "🔥 Bonding high" : "Clearing",
      color: daysSince <= 2 ? "bg-pink-500/20 text-pink-600 border-pink-500/30" : "bg-amber-500/20 text-amber-600 border-amber-500/30",
      onClick: () => navigate(`/candidate/${candidate.id}`),
    });
  });

  // Love Bombing Alerts - rapid escalation warning
  loveBombingAlerts.forEach(({ candidate }) => {
    alerts.push({
      key: `lb-${candidate.id}`,
      icon: <AlertTriangle className="w-3 h-3" />,
      label: candidate.nickname,
      sub: "⚠️ Love bombing?",
      color: "bg-orange-500/20 text-orange-600 border-orange-500/30",
      onClick: () => navigate(`/candidate/${candidate.id}`),
    });
  });

  // No Contact Alerts
  candidates.filter(c => c.no_contact_active).forEach((candidate) => {
    alerts.push({
      key: `nc-${candidate.id}`,
      icon: <Ban className="w-3 h-3" />,
      label: candidate.nickname,
      sub: `Day ${candidate.no_contact_day || 0}`,
      color: "bg-muted text-muted-foreground border-border",
      onClick: () => navigate(`/candidate/${candidate.id}`),
    });
  });

  // Recently Ended Relationships (within 48 hours)
  candidates.filter(c => {
    const endedAt = c.relationship_ended_at;
    if (!endedAt || c.status !== "archived") return false;
    const hoursSince = differenceInDays(new Date(), new Date(endedAt)) * 24;
    return hoursSince <= 48;
  }).forEach((candidate) => {
    alerts.push({
      key: `ended-${candidate.id}`,
      icon: <XCircle className="w-3 h-3" />,
      label: candidate.nickname,
      sub: "Ended",
      color: "bg-muted text-muted-foreground border-border",
      onClick: () => navigate(`/candidate/${candidate.id}`),
    });
  });

  if (alerts.length === 0) return null;

  return (
    <div data-tour="cycle-status">
      <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
        <CarouselContent className="-ml-2">
          {alerts.map((alert) => (
            <CarouselItem key={alert.key} className="pl-2 basis-auto">
              <button
                onClick={alert.onClick}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${alert.color}`}
              >
                {alert.icon}
                <span>{alert.label}</span>
                {alert.sub && <span className="opacity-60">• {alert.sub}</span>}
              </button>
            </CarouselItem>
          ))}
          <CarouselItem className="pl-2 basis-auto">
            <button
              onClick={() => navigate("/notifications")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:bg-primary/10 transition-all"
            >
              <Bell className="w-3 h-3" />
              <span>All</span>
            </button>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>
  );
}
