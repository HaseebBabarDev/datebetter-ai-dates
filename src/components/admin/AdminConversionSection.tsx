import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Gift,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type SubRow = {
  user_id: string;
  plan: string;
  trial_ends_at: string | null;
  created_at: string;
};

type ProfileLite = {
  user_id: string;
  name: string | null;
  created_at: string;
  onboarding_completed: boolean | null;
};

interface UserConversionRow {
  user_id: string;
  name: string | null;
  plan: string;
  trial_ends_at: string | null;
  trial_status:
    | "in_trial_active"
    | "in_trial_ending_soon"
    | "trial_expired_unconverted"
    | "no_trial_set"
    | "paid";
  daysUntilExpiry: number | null;
  daysSinceExpiry: number | null;
  signup_date: string;
  onboarded: boolean;
  candidates: number;
  interactions: number;
  devi_messages: number;
  is_iap_active: boolean;
}

const PAID_PLANS = [
  "unlimited",
  "dating_often",
  "dating_more",
  "starter",
  "new_to_dating",
];

export function AdminConversionSection() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserConversionRow[]>([]);
  const [filter, setFilter] = useState<
    "all" | "expired" | "ending_soon" | "no_trial" | "paid"
  >("expired");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        subsRes,
        profilesRes,
        candidatesRes,
        interactionsRes,
        deviRes,
        iapRes,
      ] = await Promise.all([
        supabase.from("user_subscriptions").select("user_id, plan, trial_ends_at, created_at"),
        supabase
          .from("profiles")
          .select("user_id, name, created_at, onboarding_completed"),
        supabase.from("candidates").select("user_id"),
        supabase.from("interactions").select("user_id"),
        supabase.from("devi_messages").select("user_id"),
        supabase
          .from("apple_entitlements")
          .select(
            "user_id, unlimited_active, text_simulator_active, detachment_plan_active",
          ),
      ]);

      if (subsRes.error) throw subsRes.error;

      const subs = (subsRes.data || []) as SubRow[];
      const profiles = (profilesRes.data || []) as ProfileLite[];
      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      const candCounts = new Map<string, number>();
      (candidatesRes.data || []).forEach((c: { user_id: string }) => {
        candCounts.set(c.user_id, (candCounts.get(c.user_id) || 0) + 1);
      });
      const intCounts = new Map<string, number>();
      (interactionsRes.data || []).forEach((i: { user_id: string }) => {
        intCounts.set(i.user_id, (intCounts.get(i.user_id) || 0) + 1);
      });
      const msgCounts = new Map<string, number>();
      (deviRes.data || []).forEach((m: { user_id: string }) => {
        msgCounts.set(m.user_id, (msgCounts.get(m.user_id) || 0) + 1);
      });

      const iapActive = new Set<string>();
      (iapRes.data || []).forEach(
        (r: {
          user_id: string;
          unlimited_active: boolean;
          text_simulator_active: boolean;
          detachment_plan_active: boolean;
        }) => {
          if (
            r.unlimited_active ||
            r.text_simulator_active ||
            r.detachment_plan_active
          ) {
            iapActive.add(r.user_id);
          }
        },
      );

      const now = Date.now();
      const built: UserConversionRow[] = subs.map((s) => {
        const p = profileMap.get(s.user_id);
        const trialEndMs = s.trial_ends_at
          ? new Date(s.trial_ends_at).getTime()
          : null;
        const isPaidPlanWithoutTrial =
          PAID_PLANS.includes(s.plan) &&
          (trialEndMs === null || trialEndMs <= now);

        let status: UserConversionRow["trial_status"];
        let daysUntilExpiry: number | null = null;
        let daysSinceExpiry: number | null = null;

        if (isPaidPlanWithoutTrial) {
          status = "paid";
        } else if (trialEndMs && trialEndMs > now) {
          daysUntilExpiry = Math.ceil((trialEndMs - now) / 86400000);
          status =
            daysUntilExpiry <= 3 ? "in_trial_ending_soon" : "in_trial_active";
        } else if (
          trialEndMs &&
          trialEndMs <= now &&
          PAID_PLANS.includes(s.plan)
        ) {
          daysSinceExpiry = Math.ceil((now - trialEndMs) / 86400000);
          status = "trial_expired_unconverted";
        } else if (s.plan === "free" && !trialEndMs) {
          status = "no_trial_set";
        } else if (trialEndMs && trialEndMs <= now) {
          daysSinceExpiry = Math.ceil((now - trialEndMs) / 86400000);
          status = "trial_expired_unconverted";
        } else {
          status = "no_trial_set";
        }

        return {
          user_id: s.user_id,
          name: p?.name || null,
          plan: s.plan,
          trial_ends_at: s.trial_ends_at,
          trial_status: status,
          daysUntilExpiry,
          daysSinceExpiry,
          signup_date: p?.created_at || s.created_at,
          onboarded: !!p?.onboarding_completed,
          candidates: candCounts.get(s.user_id) || 0,
          interactions: intCounts.get(s.user_id) || 0,
          devi_messages: msgCounts.get(s.user_id) || 0,
          is_iap_active: iapActive.has(s.user_id),
        };
      });

      setRows(built);
    } catch (err) {
      console.error("Conversion fetch error", err);
      toast.error("Failed to load conversion data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const inTrial = rows.filter((r) => r.trial_status === "in_trial_active");
    const endingSoon = rows.filter(
      (r) => r.trial_status === "in_trial_ending_soon",
    );
    const expired = rows.filter(
      (r) => r.trial_status === "trial_expired_unconverted",
    );
    const paid = rows.filter(
      (r) => r.trial_status === "paid" || r.is_iap_active,
    );
    const noTrial = rows.filter((r) => r.trial_status === "no_trial_set");
    return { inTrial, endingSoon, expired, paid, noTrial, total: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "expired") list = stats.expired;
    else if (filter === "ending_soon") list = stats.endingSoon;
    else if (filter === "no_trial") list = stats.noTrial;
    else if (filter === "paid") list = stats.paid;

    return [...list].sort((a, b) => {
      if (a.daysUntilExpiry !== null && b.daysUntilExpiry !== null) {
        return a.daysUntilExpiry - b.daysUntilExpiry;
      }
      if (a.daysSinceExpiry !== null && b.daysSinceExpiry !== null) {
        return a.daysSinceExpiry - b.daysSinceExpiry;
      }
      return b.devi_messages - a.devi_messages;
    });
  }, [rows, filter, stats]);

  const grantTrialExtension = async (userId: string, days: number) => {
    try {
      const newEnd = new Date();
      newEnd.setDate(newEnd.getDate() + days);
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ trial_ends_at: newEnd.toISOString() })
        .eq("user_id", userId);
      if (error) throw error;
      toast.success(`Granted ${days}-day trial extension`);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to grant extension");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const conversionRate =
    stats.expired.length + stats.paid.length === 0
      ? 0
      : (stats.paid.length / (stats.expired.length + stats.paid.length)) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conversion Tracker</h2>
          <p className="text-sm text-muted-foreground">
            Trial expiries, paid users, and outreach opportunities
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Active trials"
          value={stats.inTrial.length}
          tone="default"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Ending in ≤3d"
          value={stats.endingSoon.length}
          tone="warning"
          onClick={() => setFilter("ending_soon")}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Expired, unconverted"
          value={stats.expired.length}
          tone="destructive"
          onClick={() => setFilter("expired")}
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Paid (real)"
          value={stats.paid.length}
          tone="success"
          onClick={() => setFilter("paid")}
        />
        <StatCard
          icon={<Gift className="w-4 h-4" />}
          label="Free, no trial"
          value={stats.noTrial.length}
          tone="default"
          onClick={() => setFilter("no_trial")}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Trial-to-paid conversion rate</span>
            <Badge
              variant="secondary"
              className={
                conversionRate >= 10
                  ? "bg-green-500/10 text-green-600"
                  : conversionRate >= 5
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-red-500/10 text-red-600"
              }
            >
              {conversionRate.toFixed(1)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {stats.paid.length} paid out of{" "}
          {stats.paid.length + stats.expired.length} resolved trials. (
          {stats.inTrial.length + stats.endingSoon.length} still in trial —
          outcome unknown.)
        </CardContent>
      </Card>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "expired", label: `Expired (${stats.expired.length})` },
            {
              key: "ending_soon",
              label: `Ending soon (${stats.endingSoon.length})`,
            },
            { key: "paid", label: `Paid (${stats.paid.length})` },
            {
              key: "no_trial",
              label: `Free / no trial (${stats.noTrial.length})`,
            },
            { key: "all", label: `All (${rows.length})` },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* User list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No users in this segment
            </p>
          ) : (
            <div className="divide-y max-h-[640px] overflow-y-auto">
              {filtered.map((u) => (
                <div key={u.user_id} className="p-4 hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {u.name || u.user_id.slice(0, 8)}
                        </p>
                        <Badge variant="outline" className="text-[10px]">
                          {u.plan}
                        </Badge>
                        {u.is_iap_active && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                            iOS IAP
                          </Badge>
                        )}
                        {u.daysUntilExpiry !== null && (
                          <Badge
                            className={`text-[10px] ${
                              u.daysUntilExpiry <= 3
                                ? "bg-amber-500/15 text-amber-600"
                                : "bg-blue-500/10 text-blue-600"
                            }`}
                          >
                            Trial: {u.daysUntilExpiry}d left
                          </Badge>
                        )}
                        {u.daysSinceExpiry !== null && (
                          <Badge className="bg-red-500/10 text-red-600 text-[10px]">
                            Expired {u.daysSinceExpiry}d ago
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
                        <span>
                          Joined{" "}
                          {formatDistanceToNow(new Date(u.signup_date), {
                            addSuffix: true,
                          })}
                        </span>
                        <span>•</span>
                        <span>
                          {u.onboarded ? "Onboarded" : "Not onboarded"}
                        </span>
                        <span>•</span>
                        <span>{u.candidates} candidates</span>
                        <span>•</span>
                        <span>{u.interactions} interactions</span>
                        <span>•</span>
                        <span>{u.devi_messages} messages</span>
                      </div>
                    </div>
                    {(u.trial_status === "trial_expired_unconverted" ||
                      u.trial_status === "no_trial_set") && (
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2"
                          onClick={() => grantTrialExtension(u.user_id, 7)}
                        >
                          +7d
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2"
                          onClick={() => grantTrialExtension(u.user_id, 30)}
                        >
                          +30d
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "default" | "success" | "warning" | "destructive";
  onClick?: () => void;
}) {
  const toneClass =
    tone === "success"
      ? "text-green-600 bg-green-500/10"
      : tone === "warning"
        ? "text-amber-600 bg-amber-500/10"
        : tone === "destructive"
          ? "text-red-600 bg-red-500/10"
          : "text-primary bg-primary/10";
  return (
    <Card
      className={`${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-1.5 pt-3 px-3">
        <CardTitle
          className={`text-[11px] font-medium flex items-center gap-1.5 px-1.5 py-0.5 rounded-full self-start ${toneClass}`}
        >
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
