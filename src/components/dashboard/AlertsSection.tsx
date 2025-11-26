import React, { useEffect, useState } from "react";
import { AlertTriangle, Heart, Clock, TrendingUp, Lightbulb, XCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { differenceInDays, differenceInHours } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type Candidate = Tables<"candidates">;
type AdviceTracking = Tables<"advice_tracking">;

interface AlertsSectionProps {
  candidates: Candidate[];
  archivedCandidates?: Candidate[];
}

interface Alert {
  id: string;
  type: "warning" | "info" | "success" | "urgent" | "advice";
  icon: React.ReactNode;
  title: string;
  message: string;
  candidateId?: string;
}

interface AdviceStats {
  pending: number;
  accepted: number;
  declined: number;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ candidates, archivedCandidates = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingAdvice, setPendingAdvice] = useState<{ candidate: Candidate; advice: string }[]>([]);
  const [adviceStats, setAdviceStats] = useState<AdviceStats>({ pending: 0, accepted: 0, declined: 0 });

  useEffect(() => {
    const fetchAdviceStatus = async () => {
      if (!user) return;

      // Get all advice tracking records
      const { data: trackedAdvice } = await supabase
        .from("advice_tracking")
        .select("candidate_id, advice_text, response")
        .eq("user_id", user.id);

      const trackedSet = new Set(
        trackedAdvice?.map((a) => `${a.candidate_id}-${a.advice_text}`) || []
      );

      // Find candidates with untracked advice
      const pending: { candidate: Candidate; advice: string }[] = [];
      candidates.forEach((c) => {
        const scoreData = c.score_breakdown as any;
        if (scoreData?.advice) {
          const key = `${c.id}-${scoreData.advice}`;
          if (!trackedSet.has(key)) {
            pending.push({ candidate: c, advice: scoreData.advice });
          }
        }
      });

      setPendingAdvice(pending);

      // Calculate stats
      const accepted = trackedAdvice?.filter((a) => a.response === "accepted").length || 0;
      const declined = trackedAdvice?.filter((a) => a.response === "declined").length || 0;
      setAdviceStats({ pending: pending.length, accepted, declined });
    };

    fetchAdviceStatus();
  }, [user, candidates]);

  const alerts = generateAlerts(candidates, pendingAdvice, adviceStats, archivedCandidates);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Insights & Alerts
      </h2>
      <div className="space-y-2">
        {alerts.slice(0, 4).map((alert) => (
          <AlertCard 
            key={alert.id} 
            alert={alert} 
            onClick={alert.candidateId ? () => navigate(`/candidate/${alert.candidateId}`) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

const AlertCard: React.FC<{ alert: Alert; onClick?: () => void }> = ({ alert, onClick }) => {
  const styles = {
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    info: "bg-primary/10 border-primary/20 text-primary",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    urgent: "bg-destructive/10 border-destructive/20 text-destructive",
    advice: "bg-purple-500/10 border-purple-500/20 text-purple-600",
  };

  return (
    <button 
      onClick={onClick}
      disabled={!onClick}
      className={`w-full rounded-xl p-3 border ${styles[alert.type]} text-left transition-all ${onClick ? "hover:scale-[1.02] cursor-pointer" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{alert.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{alert.title}</p>
          <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
        </div>
      </div>
    </button>
  );
};

function generateAlerts(
  candidates: Candidate[], 
  pendingAdvice: { candidate: Candidate; advice: string }[],
  adviceStats: AdviceStats,
  archivedCandidates: Candidate[]
): Alert[] {
  const alerts: Alert[] = [];
  const today = new Date();

  // Check for recently ended relationships (within last 48 hours)
  const recentlyEnded = archivedCandidates.filter((c) => {
    const endedAt = (c as any).relationship_ended_at;
    if (!endedAt) return false;
    return differenceInHours(today, new Date(endedAt)) <= 48;
  });
  
  recentlyEnded.forEach((c) => {
    const endReason = (c as any).end_reason;
    alerts.push({
      id: `ended-${c.id}`,
      type: "info",
      icon: <XCircle className="w-4 h-4" />,
      title: `Ended: ${c.nickname}`,
      message: endReason ? `Reason: ${endReason}` : "Relationship archived. Take care of yourself.",
      candidateId: c.id,
    });
  });

  // Show pending advice first (most actionable)
  if (pendingAdvice.length > 0) {
    const first = pendingAdvice[0];
    alerts.push({
      id: `advice-${first.candidate.id}`,
      type: "advice",
      icon: <Lightbulb className="w-4 h-4" />,
      title: `Advice for ${first.candidate.nickname}`,
      message: pendingAdvice.length > 1 
        ? `${pendingAdvice.length} pieces of advice waiting for your response`
        : "Tap to review and respond to this advice",
      candidateId: first.candidate.id,
    });
  }

  // Show advice acceptance rate if there's history
  if (adviceStats.accepted + adviceStats.declined >= 3) {
    const total = adviceStats.accepted + adviceStats.declined;
    const rate = Math.round((adviceStats.accepted / total) * 100);
    alerts.push({
      id: "advice-stats",
      type: "info",
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Advice Acceptance Rate",
      message: `You've accepted ${rate}% of AI advice (${adviceStats.accepted}/${total})`,
    });
  }

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
      candidateId: redFlagCandidates[0].id,
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
        candidateId: c.id,
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
      candidateId: highCompatibility[0].id,
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
      candidateId: staleCandidates[0].id,
    });
  }

  return alerts;
}