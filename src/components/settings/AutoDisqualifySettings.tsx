import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Ban, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import {
  AutoDisqualifyRule,
  mergeRulesWithDefaults,
  groupRulesByCategory,
} from "@/lib/autoDisqualify";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, string> = {
  "Religion & Faith": "🕌",
  "Politics & Values": "⚖️",
  "Substance Use": "🚫",
  "Behavior & Mental Health": "🧠",
  "Kids & Family": "👶",
  "Relationship Goals": "💍",
  "Attachment Style": "🔗",
};

export const AutoDisqualifySettings: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutoDisqualifyRule[]>([]);
  const [profile, setProfile] = useState<{ faith_importance?: number | null; politics_importance?: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("faith_importance, politics_importance, auto_disqualify_rules")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile({ faith_importance: data.faith_importance, politics_importance: data.politics_importance });
        const saved = ((data as any).auto_disqualify_rules as AutoDisqualifyRule[]) || [];
        setRules(mergeRulesWithDefaults(saved));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const saveRules = useCallback(async (updatedRules: AutoDisqualifyRule[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ auto_disqualify_rules: updatedRules } as any)
        .eq("user_id", user.id);
    } catch {
      toast.error("Failed to save rules");
    } finally {
      setSaving(false);
    }
  }, [user]);

  const handleToggle = (ruleId: string) => {
    const updated = rules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    setRules(updated);
    saveRules(updated);
    const rule = updated.find((r) => r.id === ruleId);
    if (rule?.enabled) {
      toast.success(`Auto-disqualify enabled: ${rule.label}`, { duration: 2000 });
    }
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  if (loading) return <Skeleton className="h-32 w-full rounded-2xl" />;

  const grouped = groupRulesByCategory(rules);
  const enabledCount = rules.filter((r) => r.enabled).length;

  const isRuleAvailable = (rule: AutoDisqualifyRule): boolean => {
    if (!rule.requiresImportanceField || !rule.requiresImportanceMin) return true;
    const val = rule.requiresImportanceField === "faith_importance"
      ? profile?.faith_importance
      : profile?.politics_importance;
    return (val ?? 0) >= rule.requiresImportanceMin;
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Ban className="w-4 h-4 text-destructive" />
          Auto-Disqualify Rules
          {enabledCount > 0 && (
            <Badge variant="destructive" className="text-[10px] ml-auto">
              {enabledCount} active
            </Badge>
          )}
          {saving && <Sparkles className="w-3.5 h-3.5 text-muted-foreground animate-pulse ml-1" />}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Candidates matching these criteria will be automatically flagged and you'll receive an alert. You can always override on a per-candidate basis.
        </p>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {Object.entries(grouped).map(([category, categoryRules]) => {
          const isCollapsed = collapsedCategories.has(category);
          const activeInCat = categoryRules.filter((r) => r.enabled).length;

          return (
            <div key={category} className="rounded-xl border border-border overflow-hidden">
              {/* Category header */}
              <button
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                onClick={() => toggleCategory(category)}
              >
                <span className="text-sm">{CATEGORY_ICONS[category] || "📌"}</span>
                <span className="text-xs font-semibold flex-1">{category}</span>
                {activeInCat > 0 && (
                  <Badge className="text-[9px] px-1.5 h-4 bg-destructive/15 text-destructive border-destructive/20">
                    {activeInCat} on
                  </Badge>
                )}
                {isCollapsed
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                }
              </button>

              {/* Rules */}
              {!isCollapsed && (
                <div className="divide-y divide-border">
                  {categoryRules.map((rule) => {
                    const available = isRuleAvailable(rule);
                    return (
                      <div
                        key={rule.id}
                        className={cn(
                          "flex items-start gap-3 px-3 py-3",
                          !available && "opacity-50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium">{rule.label}</p>
                            {rule.enabled && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">Active</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                            {rule.description}
                          </p>
                          {!available && (
                            <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                              ⚠️ Requires importance rating ≥ {rule.requiresImportanceMin} in your preferences
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={rule.enabled}
                          disabled={!available}
                          onCheckedChange={() => available && handleToggle(rule.id)}
                          className="shrink-0 mt-0.5 data-[state=checked]:bg-destructive"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {enabledCount === 0 && (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            No rules active — enable rules above to start auto-flagging candidates.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
