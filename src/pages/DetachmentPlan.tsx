import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentSheet } from "@/components/subscription/PaymentSheet";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const PHASE_ICONS = [Eye, Flame, Shield, Star];
const PHASE_COLORS: Record<string, { bg: string; border: string; icon: string; badge: string; progress: string }> = {
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: "text-rose-500",
    badge: "bg-rose-500/20 text-rose-600",
    progress: "bg-rose-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-500",
    badge: "bg-amber-500/20 text-amber-600",
    progress: "bg-amber-500",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    icon: "text-violet-500",
    badge: "bg-violet-500/20 text-violet-600",
    progress: "bg-violet-500",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "text-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-600",
    progress: "bg-emerald-500",
  },
};

const DEFAULT_COLORS = ["rose", "amber", "violet", "emerald"];

const DetachmentPlan = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [candidate, setCandidate] = useState<{ nickname: string; photo_url?: string | null } | null>(null);
  const [planRecord, setPlanRecord] = useState<{ id: string; is_unlocked: boolean; plan_data: DetachmentPlanData | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const [currentPhase, setCurrentPhase] = useState(1);

  const fetchData = useCallback(async () => {
    if (!user || !candidateId) return;

    setLoading(true);
    try {
      const [candResult, planResult] = await Promise.all([
        supabase.from("candidates").select("nickname, photo_url").eq("id", candidateId).eq("user_id", user.id).single(),
        supabase.from("detachment_plans").select("id, is_unlocked, plan_data").eq("user_id", user.id).eq("candidate_id", candidateId).maybeSingle(),
      ]);

      if (candResult.data) setCandidate(candResult.data);
        if (planResult.data) {
          setPlanRecord({
            id: planResult.data.id,
            is_unlocked: planResult.data.is_unlocked,
            plan_data: planResult.data.plan_data as unknown as DetachmentPlanData | null,
          });
        }
    } catch (e) {
      console.error("Error fetching detachment plan:", e);
    } finally {
      setLoading(false);
    }
  }, [user, candidateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

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
      await supabase
        .from("detachment_plans")
        .update({ is_unlocked: true, unlocked_at: new Date().toISOString() })
        .eq("id", planRecord.id);
      await fetchData();
      toast.success("Your Detachment Plan is unlocked! 🎉");
    } catch (e) {
      console.error("Error unlocking plan:", e);
    }
  };

  const togglePhase = (phaseNum: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseNum)) next.delete(phaseNum);
      else next.add(phaseNum);
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">Detachment Plan</h1>
          {candidate && (
            <p className="text-xs text-muted-foreground truncate">For {candidate.nickname}</p>
          )}
        </div>
        {plan && isUnlocked && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={generatePlan}
            disabled={generating}
          >
            <RefreshCw className={cn("w-3 h-3", generating && "animate-spin")} />
            Regenerate
          </Button>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* No plan yet */}
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

            {/* Feature teaser */}
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

            <Button
              size="lg"
              className="gap-2 h-12 px-8"
              onClick={generatePlan}
              disabled={generating}
            >
              <Sparkles className="w-4 h-4" />
              Generate My Plan
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Powered by D.E.V.I. AI • Preview is free • Unlock for $9.99
            </p>
          </div>
        )}

        {/* Generating state */}
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

        {/* Plan exists */}
        {plan && (
          <>
            {/* Hero card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
              <CardContent className="p-4">
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

                {/* Phase progress indicator */}
                <div className="mt-4 flex gap-1.5">
                  {plan.phases.map((phase, i) => {
                    const colorKey = DEFAULT_COLORS[i] || "rose";
                    return (
                      <div
                        key={phase.number}
                        className="flex-1 space-y-1 cursor-pointer"
                        onClick={() => {
                          setCurrentPhase(phase.number);
                          setExpandedPhases(prev => {
                            const next = new Set(prev);
                            next.add(phase.number);
                            return next;
                          });
                        }}
                      >
                        <div className={cn("h-1.5 rounded-full", i < currentPhase ? PHASE_COLORS[colorKey]?.progress : "bg-muted")} />
                        <p className="text-[9px] text-muted-foreground text-center truncate">{phase.name}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Lock banner if not unlocked */}
            {!isUnlocked && (
              <Card className="border-warning/30 bg-warning/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-warning-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Preview Mode</p>
                      <p className="text-xs text-muted-foreground">
                        You can see Phase 1. Unlock all 4 phases for $9.99
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1 shrink-0"
                      onClick={() => setShowPayment(true)}
                    >
                      <Zap className="w-3 h-3" />
                      Unlock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Phases */}
            <div className="space-y-3">
              {plan.phases.map((phase, i) => {
                const colorKey = DEFAULT_COLORS[i] || "rose";
                const colors = PHASE_COLORS[colorKey] || PHASE_COLORS.rose;
                const PhaseIcon = PHASE_ICONS[i] || Star;
                const isLocked = !isUnlocked && phase.number > 1;
                const isExpanded = expandedPhases.has(phase.number);

                return (
                  <Card
                    key={phase.number}
                    className={cn(
                      "overflow-hidden transition-all border",
                      isLocked ? "opacity-60" : "",
                      colors.border,
                      colors.bg
                    )}
                  >
                    {/* Phase header */}
                    <button
                      className="w-full text-left"
                      onClick={() => !isLocked && togglePhase(phase.number)}
                      disabled={isLocked}
                    >
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.bg, "border", colors.border)}>
                            {isLocked ? (
                              <Lock className={cn("w-4 h-4", colors.icon)} />
                            ) : (
                              <PhaseIcon className={cn("w-4 h-4", colors.icon)} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold">Phase {phase.number}: {phase.name}</span>
                              <Badge className={cn("text-[9px] px-1.5 py-0 h-4", colors.badge)}>
                                {phase.duration}
                              </Badge>
                              {isLocked && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                  Locked
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{phase.tagline}</p>
                          </div>
                          {!isLocked && (
                            isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                    </button>

                    {/* Phase content */}
                    {isExpanded && !isLocked && (
                      <CardContent className="px-4 pb-4 pt-0 space-y-4">
                        {/* Affirmation */}
                        <div className={cn("rounded-xl p-3 border", colors.bg, colors.border)}>
                          <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Daily Affirmation</p>
                          <p className={cn("text-xs font-medium italic leading-relaxed", colors.icon)}>
                            "{phase.affirmation}"
                          </p>
                        </div>

                        {/* Practices */}
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Daily Practices
                          </p>
                          {phase.practices.map((practice, pi) => (
                            <div key={pi} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/50">
                              <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", colors.icon)} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                  <p className="text-xs font-medium leading-tight">{practice.title}</p>
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0 whitespace-nowrap">
                                    {practice.frequency}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{practice.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Milestone */}
                        <div className="rounded-lg bg-background/50 border border-border/50 p-3 flex items-start gap-2">
                          <Calendar className={cn("w-4 h-4 shrink-0 mt-0.5", colors.icon)} />
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Phase Milestone</p>
                            <p className="text-xs mt-0.5 leading-snug">{phase.milestone}</p>
                          </div>
                        </div>

                        {/* Emotional challenge */}
                        <div className="rounded-lg bg-background/50 border border-border/50 p-3 flex items-start gap-2">
                          <Heart className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">What to Expect</p>
                            <p className="text-xs mt-0.5 leading-snug text-muted-foreground">{phase.emotional_challenge}</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
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

            {/* Bottom unlock CTA */}
            {!isUnlocked && (
              <div className="text-center space-y-3 py-4">
                <p className="text-xs text-muted-foreground">
                  Unlock all 4 phases, daily practices & milestones
                </p>
                <Button
                  size="lg"
                  className="gap-2 h-12 px-8"
                  onClick={() => setShowPayment(true)}
                >
                  <Lock className="w-4 h-4" />
                  Unlock Full Plan — $9.99
                </Button>
                <p className="text-[10px] text-muted-foreground">One-time purchase for this candidate</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment sheet */}
      <PaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        planName={`Detachment Plan for ${candidate?.nickname}`}
        price="$9.99"
        onPaymentSuccess={handleUnlockSuccess}
      />
    </div>
  );
};

export default DetachmentPlan;
