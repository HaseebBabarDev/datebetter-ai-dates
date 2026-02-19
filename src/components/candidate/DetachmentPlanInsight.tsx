import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Unlink, Trophy, XCircle, ChevronRight } from "lucide-react";

interface DetachmentPlanInsightProps {
  candidateId: string;
  onNavigate: () => void;
}

interface PlanSummary {
  is_unlocked: boolean;
  status: string;
  current_phase: number;
  plan_data: { phases?: { name: string }[] } | null;
}

export const DetachmentPlanInsight: React.FC<DetachmentPlanInsightProps> = ({ candidateId, onNavigate }) => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !candidateId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("detachment_plans")
        .select("is_unlocked, status, current_phase, plan_data")
        .eq("user_id", user.id)
        .eq("candidate_id", candidateId)
        .maybeSingle();
      setPlan(data ? { ...data, plan_data: data.plan_data as { phases?: { name: string }[] } | null } : null);
      setLoading(false);
    };
    fetch();
  }, [user, candidateId]);

  if (loading) return null;

  // Not purchased — show CTA
  if (!plan || !plan.is_unlocked) {
    return (
      <div
        className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-all"
        onClick={onNavigate}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Unlink className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Detachment Plan</p>
          <p className="text-xs text-muted-foreground">AI-powered 4-phase plan to emotionally detach</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">$9.99</span>
        </div>
      </div>
    );
  }

  // Purchased — show progress
  const totalPhases = plan.plan_data?.phases?.length || 4;
  const currentPhase = plan.current_phase || 1;
  const progressPct = Math.round(((currentPhase - 1) / totalPhases) * 100);
  const isCompleted = plan.status === 'completed';
  const isQuit = plan.status === 'quit';

  const statusBadge = isCompleted
    ? <Badge className="bg-primary/20 text-primary text-[10px] gap-1"><Trophy className="w-3 h-3" />Completed</Badge>
    : isQuit
      ? <Badge variant="secondary" className="text-[10px] gap-1"><XCircle className="w-3 h-3" />Quit</Badge>
      : <Badge variant="outline" className="text-[10px]">Phase {currentPhase}/{totalPhases}</Badge>;

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 space-y-3 cursor-pointer hover:border-primary/30 transition-all"
      onClick={onNavigate}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {isCompleted ? <Trophy className="w-4 h-4 text-primary" /> : <Unlink className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">Detachment Plan</p>
            {statusBadge}
          </div>
          <p className="text-xs text-muted-foreground">
            {isCompleted ? "You completed this plan" : isQuit ? "You stepped away from this plan" : `Currently in Phase ${currentPhase}: ${plan.plan_data?.phases?.[currentPhase - 1]?.name || "Active"}`}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
      {!isCompleted && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Progress</span>
            <span>{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {Array.from({ length: totalPhases }, (_, i) => (
              <span key={i} className={i < currentPhase - 1 ? "text-primary font-medium" : ""}>
                P{i + 1}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
