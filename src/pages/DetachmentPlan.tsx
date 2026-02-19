import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentSheet } from "@/components/subscription/PaymentSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Lock,
  Sparkles,
  Flame,
  Eye,
  Shield,
  Star,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Heart,
  Zap,
  CheckCircle2,
  Calendar,
  BookOpen,
  Trophy,
  XCircle,
  ChevronRight,
  ArrowRight,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Practice {
  title: string;
  description: string;
  frequency: string;
}

interface Phase {
  number: number;
  name: string;
  tagline: string;
  duration: string;
  color: string;
  affirmation: string;
  milestone: string;
  emotional_challenge: string;
  practices: Practice[];
}

interface DetachmentPlanData {
  title: string;
  subtitle: string;
  overview: string;
  phases: Phase[];
  closing_message: string;
}

type PlanStatus = 'active' | 'completed' | 'quit';

// practice_checks: { "1": [true, false, ...], "2": [...] }
type PracticeChecks = Record<string, boolean[]>;

const PHASE_ICONS = [Eye, Flame, Shield, Star];
const PHASE_COLORS: Record<string, { bg: string; border: string; icon: string; badge: string; progress: string; ring: string }> = {
  rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/30",    icon: "text-rose-500",    badge: "bg-rose-500/20 text-rose-600",    progress: "bg-rose-500",    ring: "stroke-rose-500" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/30",   icon: "text-amber-500",   badge: "bg-amber-500/20 text-amber-600",   progress: "bg-amber-500",   ring: "stroke-amber-500" },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/30",  icon: "text-violet-500",  badge: "bg-violet-500/20 text-violet-600",  progress: "bg-violet-500",  ring: "stroke-violet-500" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "text-emerald-500", badge: "bg-emerald-500/20 text-emerald-600", progress: "bg-emerald-500", ring: "stroke-emerald-500" },
};

const DEFAULT_COLORS = ["rose", "amber", "violet", "emerald"];

// Small SVG progress ring
const ProgressRing = ({ pct, colorClass, size = 36 }: { pct: number; colorClass: string; size?: number }) => {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-muted" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        className={cn(colorClass, "transition-all duration-700")}
        strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
};

const DetachmentPlan = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [candidate, setCandidate] = useState<{ nickname: string; photo_url?: string | null } | null>(null);
  const [planRecord, setPlanRecord] = useState<{
    id: string;
    is_unlocked: boolean;
    plan_data: DetachmentPlanData | null;
    status: PlanStatus;
    current_phase: number;
    completed_at?: string | null;
    practice_checks: PracticeChecks;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const [currentPhase, setCurrentPhase] = useState(1);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingChecks, setSavingChecks] = useState(false);
  const [phaseCompleteCelebration, setPhaseCompleteCelebration] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !candidateId) return;
    setLoading(true);
    try {
      const [candResult, planResult] = await Promise.all([
        supabase.from("candidates").select("nickname, photo_url").eq("id", candidateId).eq("user_id", user.id).single(),
        supabase.from("detachment_plans").select("id, is_unlocked, plan_data, status, current_phase, completed_at, practice_checks").eq("user_id", user.id).eq("candidate_id", candidateId).maybeSingle(),
      ]);
      if (candResult.data) setCandidate(candResult.data);
      if (planResult.data) {
        setPlanRecord({
          id: planResult.data.id,
          is_unlocked: planResult.data.is_unlocked,
          plan_data: planResult.data.plan_data as unknown as DetachmentPlanData | null,
          status: (planResult.data.status as PlanStatus) || 'active',
          current_phase: planResult.data.current_phase || 1,
          completed_at: planResult.data.completed_at,
          practice_checks: (planResult.data.practice_checks as PracticeChecks) || {},
        });
        setCurrentPhase(planResult.data.current_phase || 1);
      }
    } catch (e) {
      console.error("Error fetching detachment plan:", e);
    } finally {
      setLoading(false);
    }
  }, [user, candidateId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const persistChecks = useCallback(async (checks: PracticeChecks) => {
    if (!planRecord?.id) return;
    setSavingChecks(true);
    try {
      await supabase.from("detachment_plans").update({ practice_checks: checks }).eq("id", planRecord.id);
    } catch (e) {
      console.error("Error saving practice checks:", e);
    } finally {
      setSavingChecks(false);
    }
  }, [planRecord?.id]);

  const handleCheckToggle = (phaseNum: number, practiceIdx: number) => {
    if (!planRecord) return;
    const key = String(phaseNum);
    const phaseLen = planRecord.plan_data?.phases[phaseNum - 1]?.practices.length ?? 0;
    const current = planRecord.practice_checks[key] ?? Array(phaseLen).fill(false);
    const updated = [...current];
    updated[practiceIdx] = !updated[practiceIdx];
    const newChecks = { ...planRecord.practice_checks, [key]: updated };

    // Optimistic update
    setPlanRecord(prev => prev ? { ...prev, practice_checks: newChecks } : prev);

    // Celebrate if phase just became 100% complete
    if (updated.every(Boolean) && !current.every(Boolean)) {
      setPhaseCompleteCelebration(phaseNum);
      setTimeout(() => setPhaseCompleteCelebration(null), 3000);
      toast.success(`Phase ${phaseNum} practices completed! 🎉`, { description: "You're making real progress." });
    }

    // Debounced save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistChecks(newChecks), 800);
  };

  const generatePlan = useCallback(async () => {
    if (!user || !candidateId) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("generate-detachment-plan", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { candidateId },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) { toast.error(response.data.error); return; }
      await fetchData();
      toast.success("Your personalized detachment plan is ready!");
    } catch (e) {
      console.error("Error generating plan:", e);
      toast.error("Failed to generate plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [user, candidateId, fetchData]);

  const handleUnlockSuccess = async () => {
    if (!planRecord?.id) return;
    try {
      await supabase.from("detachment_plans").update({ is_unlocked: true, unlocked_at: new Date().toISOString() }).eq("id", planRecord.id);
      await fetchData();
      toast.success("Your Detachment Plan is unlocked! 🎉");
    } catch (e) { console.error("Error unlocking plan:", e); }
  };

  const handleUpdateStatus = async (newStatus: PlanStatus) => {
    if (!planRecord?.id) return;
    setUpdatingStatus(true);
    try {
      await supabase.from("detachment_plans").update({
        status: newStatus,
        completed_at: newStatus !== 'active' ? new Date().toISOString() : null,
      }).eq("id", planRecord.id);
      await fetchData();
      if (newStatus === 'completed') toast.success("🎉 Congratulations on completing your detachment plan!");
      if (newStatus === 'quit') toast.info("Plan marked as quit. You can regenerate anytime.");
      if (newStatus === 'active') toast.success("Plan reactivated!");
    } catch (e) {
      console.error("Error updating plan status:", e);
      toast.error("Failed to update plan status.");
    } finally {
      setUpdatingStatus(false);
      setShowCompleteDialog(false);
      setShowQuitDialog(false);
    }
  };

  const handlePhaseAdvance = async (phase: number) => {
    if (!planRecord?.id || !planRecord.is_unlocked) return;
    const totalPhases = planRecord.plan_data?.phases.length || 4;
    const newPhase = Math.min(phase + 1, totalPhases);
    try {
      await supabase.from("detachment_plans").update({ current_phase: newPhase }).eq("id", planRecord.id);
      setCurrentPhase(newPhase);
      setPlanRecord(prev => prev ? { ...prev, current_phase: newPhase } : prev);
      // Auto-expand next phase
      setExpandedPhases(prev => { const n = new Set(prev); n.add(newPhase); return n; });
      toast.success(`Moving to Phase ${newPhase}: ${planRecord.plan_data?.phases[newPhase - 1]?.name}!`);
    } catch (e) { console.error("Error advancing phase:", e); }
  };

  const togglePhase = (phaseNum: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseNum)) next.delete(phaseNum); else next.add(phaseNum);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const plan = planRecord?.plan_data;
  const isUnlocked = planRecord?.is_unlocked ?? false;
  const planStatus = planRecord?.status ?? 'active';
  const isCompleted = planStatus === 'completed';
  const isQuit = planStatus === 'quit';
  const isFinished = isCompleted || isQuit;
  const practiceChecks = planRecord?.practice_checks ?? {};

  // Overall progress across all phases
  const totalPractices = plan?.phases.reduce((a, p) => a + p.practices.length, 0) ?? 0;
  const totalChecked = Object.values(practiceChecks).reduce((a, arr) => a + arr.filter(Boolean).length, 0);
  const overallPct = totalPractices > 0 ? Math.round((totalChecked / totalPractices) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">Detachment Plan</h1>
          {candidate && <p className="text-xs text-muted-foreground truncate">For {candidate.nickname}</p>}
        </div>
        {savingChecks && <span className="text-[10px] text-muted-foreground animate-pulse">Saving…</span>}
        {plan && isUnlocked && !isFinished && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={generatePlan} disabled={generating}>
            <RefreshCw className={cn("w-3 h-3", generating && "animate-spin")} />
            Regenerate
          </Button>
        )}
      </div>

      {/* Finished banner */}
      {isFinished && plan && (
        <div className={cn("px-4 py-3 flex items-center gap-3 border-b border-border", isCompleted ? "bg-primary/10" : "bg-muted/50")}>
          {isCompleted ? <Trophy className="w-5 h-5 text-primary shrink-0" /> : <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{isCompleted ? "Plan Completed 🎉" : "Plan Quit"}</p>
            <p className="text-xs text-muted-foreground">{isCompleted ? "You did the work. So proud of you." : "You stepped away from this plan."}</p>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => handleUpdateStatus('active')} disabled={updatingStatus}>Restart</Button>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Empty state */}
        {!plan && !generating && (
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Your Personalized Detachment Plan</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                D.E.V.I. will analyze your relationship with <strong>{candidate?.nickname}</strong> and create a
                custom 4-phase plan to help you emotionally detach and heal.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
              {[
                { icon: Eye, label: "Pattern recognition", desc: "Understand your triggers" },
                { icon: Shield, label: "Daily practices", desc: "Tailored to your situation" },
                { icon: Flame, label: "Emotional milestones", desc: "Track your healing" },
                { icon: Star, label: "Affirmations", desc: "Built around you" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
                  <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" className="gap-2 h-12 px-8" onClick={generatePlan} disabled={generating}>
              <Sparkles className="w-4 h-4" />
              Generate My Plan
            </Button>
            <p className="text-[10px] text-muted-foreground">Powered by D.E.V.I. AI • Preview is free • Unlock for $9.99</p>
          </div>
        )}

        {/* Generating */}
        {generating && (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">D.E.V.I. is crafting your plan…</p>
              <p className="text-xs text-muted-foreground">Analyzing your relationship patterns</p>
            </div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Plan */}
        {plan && (
          <>
            {/* Hero + overall progress */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold leading-tight">{plan.title}</h2>
                    <p className="text-[11px] text-primary font-medium mt-0.5">{plan.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{plan.overview}</p>
                  </div>
                </div>

                {/* Phase strip with rings */}
                <div className="flex gap-2">
                  {plan.phases.map((phase, i) => {
                    const colorKey = DEFAULT_COLORS[i] || "rose";
                    const colors = PHASE_COLORS[colorKey];
                    const PhaseIcon = PHASE_ICONS[i] || Star;
                    const checks = practiceChecks[String(phase.number)] ?? [];
                    const done = checks.filter(Boolean).length;
                    const total = phase.practices.length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    const isActive = phase.number === currentPhase;
                    return (
                      <button
                        key={phase.number}
                        className={cn("flex-1 flex flex-col items-center gap-1 rounded-xl p-2 transition-all", isActive ? colors.bg + " " + colors.border + " border" : "bg-muted/30 border border-transparent")}
                        onClick={() => { setExpandedPhases(prev => { const n = new Set(prev); n.add(phase.number); return n; }); }}
                      >
                        <div className="relative">
                          <ProgressRing pct={pct} colorClass={colors.ring} size={36} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {pct === 100 ? (
                              <CheckCircle2 className={cn("w-4 h-4", colors.icon)} />
                            ) : (
                              <PhaseIcon className={cn("w-3.5 h-3.5", colors.icon)} />
                            )}
                          </div>
                        </div>
                        <p className="text-[9px] font-medium text-center leading-tight">{phase.name}</p>
                        <p className="text-[9px] text-muted-foreground">{done}/{total}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Overall progress bar */}
                {isUnlocked && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Overall journey progress</span>
                      <span className="font-medium">{overallPct}%</span>
                    </div>
                    <Progress value={overallPct} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lock banner */}
            {!isUnlocked && (
              <Card className="border-amber-500/30 bg-amber-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Preview Mode</p>
                      <p className="text-xs text-muted-foreground">You can see Phase 1. Unlock all 4 phases for $9.99</p>
                    </div>
                    <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={() => setShowPayment(true)}>
                      <Zap className="w-3 h-3" />
                      Unlock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Phase cards */}
            <div className="space-y-3">
              {plan.phases.map((phase, i) => {
                const colorKey = DEFAULT_COLORS[i] || "rose";
                const colors = PHASE_COLORS[colorKey] || PHASE_COLORS.rose;
                const PhaseIcon = PHASE_ICONS[i] || Star;
                const isLocked = !isUnlocked && phase.number > 1;
                const isExpanded = expandedPhases.has(phase.number);
                const isActivePhase = phase.number === currentPhase;
                const checks = practiceChecks[String(phase.number)] ?? [];
                const donePractices = checks.filter(Boolean).length;
                const totalPractices = phase.practices.length;
                const phaseComplete = donePractices === totalPractices && totalPractices > 0;
                const isCelebrating = phaseCompleteCelebration === phase.number;

                return (
                  <motion.div
                    key={phase.number}
                    initial={false}
                    animate={isCelebrating ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className={cn(
                      "overflow-hidden transition-all border",
                      isLocked ? "opacity-60" : "",
                      colors.border,
                      isActivePhase && !isLocked ? colors.bg : "bg-card",
                      isCelebrating && "ring-2 ring-primary"
                    )}>
                      {/* Phase header */}
                      <button className="w-full text-left" onClick={() => !isLocked && togglePhase(phase.number)} disabled={isLocked}>
                        <CardHeader className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <ProgressRing pct={isLocked ? 0 : (totalPractices > 0 ? Math.round((donePractices / totalPractices) * 100) : 0)} colorClass={colors.ring} size={40} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                {isLocked ? (
                                  <Lock className={cn("w-4 h-4", colors.icon)} />
                                ) : phaseComplete ? (
                                  <CheckCircle2 className={cn("w-4 h-4", colors.icon)} />
                                ) : (
                                  <PhaseIcon className={cn("w-4 h-4", colors.icon)} />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold">Phase {phase.number}: {phase.name}</span>
                                <Badge className={cn("text-[9px] px-1.5 py-0 h-4", colors.badge)}>{phase.duration}</Badge>
                                {isActivePhase && !isLocked && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary text-primary">Active</Badge>}
                                {isLocked && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Locked</Badge>}
                                {phaseComplete && !isLocked && <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary/20 text-primary gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />Done</Badge>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[11px] text-muted-foreground truncate flex-1">{phase.tagline}</p>
                                {!isLocked && <span className="text-[10px] text-muted-foreground shrink-0">{donePractices}/{totalPractices}</span>}
                              </div>
                            </div>
                            {!isLocked && (isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />)}
                          </div>
                        </CardHeader>
                      </button>

                      {/* Phase content */}
                      <AnimatePresence initial={false}>
                        {isExpanded && !isLocked && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <CardContent className="px-4 pb-4 pt-0 space-y-4">
                              {/* Affirmation */}
                              <div className={cn("rounded-xl p-3 border", colors.bg, colors.border)}>
                                <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Daily Affirmation</p>
                                <p className={cn("text-xs font-medium italic leading-relaxed", colors.icon)}>"{phase.affirmation}"</p>
                              </div>

                              {/* Practices — checkable */}
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" /> Daily Practices
                                  <span className="ml-auto normal-case font-normal">{donePractices}/{totalPractices} done</span>
                                </p>
                                {phase.practices.map((practice, pi) => {
                                  const isChecked = checks[pi] ?? false;
                                  return (
                                    <motion.div
                                      key={pi}
                                      animate={isChecked ? { opacity: 1 } : { opacity: 1 }}
                                      className={cn(
                                        "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                        isChecked
                                          ? cn(colors.bg, colors.border)
                                          : "bg-background/50 border-border/50 hover:border-border"
                                      )}
                                      onClick={() => !isFinished && handleCheckToggle(phase.number, pi)}
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => !isFinished && handleCheckToggle(phase.number, pi)}
                                        className={cn("mt-0.5 shrink-0", isChecked && "border-primary")}
                                        onClick={e => e.stopPropagation()}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                          <p className={cn("text-xs font-medium leading-tight transition-all", isChecked && "line-through opacity-70")}>{practice.title}</p>
                                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0 whitespace-nowrap">{practice.frequency}</Badge>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{practice.description}</p>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>

                              {/* Phase completion celebration */}
                              {isCelebrating && (
                                <motion.div
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  className={cn("rounded-xl p-3 border text-center", colors.bg, colors.border)}
                                >
                                  <PartyPopper className={cn("w-5 h-5 mx-auto mb-1", colors.icon)} />
                                  <p className="text-xs font-semibold">All practices checked! Amazing work 🙌</p>
                                </motion.div>
                              )}

                              {/* Milestone */}
                              <div className="rounded-xl bg-background/50 border border-border/50 p-3 flex items-start gap-2">
                                <Calendar className={cn("w-4 h-4 shrink-0 mt-0.5", colors.icon)} />
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Phase Milestone</p>
                                  <p className="text-xs mt-0.5 leading-snug">{phase.milestone}</p>
                                </div>
                              </div>

                              {/* What to expect */}
                              <div className="rounded-xl bg-background/50 border border-border/50 p-3 flex items-start gap-2">
                                <Heart className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">What to Expect</p>
                                  <p className="text-xs mt-0.5 leading-snug text-muted-foreground">{phase.emotional_challenge}</p>
                                </div>
                              </div>

                              {/* Advance to next phase CTA — only show on active phase and when phase practices are complete (or even if not — always visible on active) */}
                              {isActivePhase && !isFinished && phase.number < (plan.phases.length) && (
                                <Button
                                  variant={phaseComplete ? "default" : "outline"}
                                  className={cn("w-full gap-2 text-xs h-9", phaseComplete && "")}
                                  onClick={() => handlePhaseAdvance(phase.number)}
                                >
                                  {phaseComplete ? (
                                    <>
                                      <PartyPopper className="w-4 h-4" />
                                      Advance to Phase {phase.number + 1}: {plan.phases[phase.number]?.name}
                                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRight className="w-4 h-4" />
                                      Move to Phase {phase.number + 1}
                                      <span className="ml-auto text-muted-foreground">({donePractices}/{totalPractices} done)</span>
                                    </>
                                  )}
                                </Button>
                              )}
                              {isActivePhase && !isFinished && phase.number === plan.phases.length && (
                                <Button
                                  variant={phaseComplete ? "default" : "outline"}
                                  className="w-full gap-2 text-xs h-9"
                                  onClick={() => setShowCompleteDialog(true)}
                                >
                                  <Trophy className="w-4 h-4" />
                                  {phaseComplete ? "Mark Plan Complete 🎉" : "Complete Plan Early"}
                                </Button>
                              )}
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Closing message */}
            {isUnlocked && plan.closing_message && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-4 text-center space-y-2">
                  <Sparkles className="w-5 h-5 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground italic leading-relaxed">"{plan.closing_message}"</p>
                  <p className="text-[10px] text-muted-foreground font-medium">— D.E.V.I.</p>
                </CardContent>
              </Card>
            )}

            {/* Unlock CTA */}
            {!isUnlocked && (
              <div className="text-center space-y-3 py-4">
                <p className="text-xs text-muted-foreground">Unlock all 4 phases, daily practices & milestones</p>
                <Button size="lg" className="gap-2 h-12 px-8" onClick={() => setShowPayment(true)}>
                  <Lock className="w-4 h-4" />
                  Unlock Full Plan — $9.99
                </Button>
                <p className="text-[10px] text-muted-foreground">One-time purchase for this candidate</p>
              </div>
            )}

            {/* Complete / Quit actions */}
            {isUnlocked && !isFinished && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowQuitDialog(true)}
                  disabled={updatingStatus}
                >
                  <XCircle className="w-4 h-4" />
                  Quit Plan
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={updatingStatus}
                >
                  <Trophy className="w-4 h-4" />
                  Mark Complete
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment */}
      <PaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        planName={`Detachment Plan for ${candidate?.nickname}`}
        price="$9.99"
        onPaymentSuccess={handleUnlockSuccess}
      />

      {/* Complete dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Trophy className="w-7 h-7 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">Mark Plan as Complete?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This means you've done the work. You should be incredibly proud of yourself. 💪
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleUpdateStatus('completed')} disabled={updatingStatus}>
              Yes, I completed it!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quit dialog */}
      <AlertDialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-2">
              <XCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <AlertDialogTitle className="text-center">Quit this plan?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You can always come back and restart it. Your progress and plan data will be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleUpdateStatus('quit')} disabled={updatingStatus} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Quit plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DetachmentPlan;
