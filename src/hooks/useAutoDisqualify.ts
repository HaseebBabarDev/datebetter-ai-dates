/**
 * Hook that evaluates auto-disqualify rules for a given candidate
 * and persists results to the database.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  evaluateAutoDisqualify,
  mergeRulesWithDefaults,
  AutoDisqualifyRule,
} from "@/lib/autoDisqualify";

interface UseAutoDisqualifyOptions {
  candidateId: string;
  candidate: Record<string, unknown> | null;
}

export function useAutoDisqualify({ candidateId, candidate }: UseAutoDisqualifyOptions) {
  const { user } = useAuth();
  const [isAutoDisqualified, setIsAutoDisqualified] = useState(false);
  const [disqualifyReasons, setDisqualifyReasons] = useState<string[]>([]);
  const [isOverridden, setIsOverridden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newlyDisqualified, setNewlyDisqualified] = useState(false);

  const evaluate = useCallback(async () => {
    if (!user || !candidate) { setLoading(false); return; }

    const [profileRes, candidateRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("faith_importance, politics_importance, religion, politics, kids_desire, auto_disqualify_rules")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("candidates")
        .select("is_auto_disqualified, auto_disqualify_reasons, auto_disqualify_override")
        .eq("id", candidateId)
        .single(),
    ]);

    const profile = profileRes.data;
    const dbCandidate = candidateRes.data as any;

    // Read persisted override
    const override = dbCandidate?.auto_disqualify_override ?? false;
    setIsOverridden(override);

    if (!profile) { setLoading(false); return; }

    const savedRules: AutoDisqualifyRule[] = (profile as any).auto_disqualify_rules || [];
    const rules = mergeRulesWithDefaults(savedRules);
    const enabledIds = new Set(rules.filter((r) => r.enabled).map((r) => r.id));

    const { disqualified, reasons } = evaluateAutoDisqualify(
      candidate as any,
      profile as any,
      enabledIds
    );

    setIsAutoDisqualified(disqualified);
    setDisqualifyReasons(reasons);

    // Persist result if it changed
    const prevDQ = dbCandidate?.is_auto_disqualified ?? false;
    const prevReasons: string[] = dbCandidate?.auto_disqualify_reasons ?? [];
    if (
      prevDQ !== disqualified ||
      JSON.stringify(prevReasons) !== JSON.stringify(reasons)
    ) {
      await supabase
        .from("candidates")
        .update({
          is_auto_disqualified: disqualified,
          auto_disqualify_reasons: reasons,
        } as any)
        .eq("id", candidateId);
    }

    // Signal a new disqualification event (was clean, now DQ'd, not already overridden)
    if (!prevDQ && disqualified && !override) {
      setNewlyDisqualified(true);
    }

    setLoading(false);
  }, [user, candidateId, candidate]);

  useEffect(() => { evaluate(); }, [evaluate]);

  const override = useCallback(async () => {
    await supabase
      .from("candidates")
      .update({ auto_disqualify_override: true } as any)
      .eq("id", candidateId);
    setIsOverridden(true);
  }, [candidateId]);

  const removeOverride = useCallback(async () => {
    await supabase
      .from("candidates")
      .update({ auto_disqualify_override: false } as any)
      .eq("id", candidateId);
    setIsOverridden(false);
  }, [candidateId]);

  const dismissNewlyDisqualified = useCallback(() => setNewlyDisqualified(false), []);

  return { isAutoDisqualified, disqualifyReasons, isOverridden, loading, override, removeOverride, newlyDisqualified, dismissNewlyDisqualified };
}
