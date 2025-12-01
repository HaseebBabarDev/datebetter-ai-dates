import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionPlan = "free" | "new_to_dating" | "dating_often" | "dating_more";

interface Subscription {
  plan: SubscriptionPlan;
  candidates_limit: number;
  updates_per_candidate: number;
}

interface UsageTracking {
  candidate_id: string;
  updates_used: number;
}

const PLAN_LIMITS: Record<SubscriptionPlan, { candidates: number; updates: number }> = {
  free: { candidates: 1, updates: 1 },
  new_to_dating: { candidates: 3, updates: 5 },
  dating_often: { candidates: 7, updates: 12 },
  dating_more: { candidates: 12, updates: 20 },
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageTracking[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionAndUsage();
    }
  }, [user]);

  const fetchSubscriptionAndUsage = async () => {
    if (!user) return;

    try {
      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subError) {
        console.error("Error fetching subscription:", subError);
      }

      // If no subscription exists, create one
      if (!subData) {
        const { data: newSub, error: insertError } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            plan: "free",
            candidates_limit: 1,
            updates_per_candidate: 1,
          })
          .select()
          .single();

        if (!insertError && newSub) {
          setSubscription({
            plan: newSub.plan as SubscriptionPlan,
            candidates_limit: newSub.candidates_limit,
            updates_per_candidate: newSub.updates_per_candidate,
          });
        }
      } else {
        setSubscription({
          plan: subData.plan as SubscriptionPlan,
          candidates_limit: subData.candidates_limit,
          updates_per_candidate: subData.updates_per_candidate,
        });
      }

      // Fetch interactions grouped by candidate to count actual usage
      const { data: interactions } = await supabase
        .from("interactions")
        .select("candidate_id")
        .eq("user_id", user.id);

      if (interactions) {
        // Count interactions per candidate
        const interactionCounts: Record<string, number> = {};
        interactions.forEach((i) => {
          interactionCounts[i.candidate_id] = (interactionCounts[i.candidate_id] || 0) + 1;
        });

        // Convert to usage array
        const usageFromInteractions = Object.entries(interactionCounts).map(([candidate_id, count]) => ({
          candidate_id,
          updates_used: count,
        }));

        setUsage(usageFromInteractions);
      }

      // Fetch candidate count
      const { count } = await supabase
        .from("candidates")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setCandidateCount(count || 0);
    } catch (error) {
      console.error("Error in fetchSubscriptionAndUsage:", error);
    } finally {
      setLoading(false);
    }
  };

  const canAddCandidate = () => {
    if (!subscription) return false;
    return candidateCount < subscription.candidates_limit;
  };

  const canUseUpdate = (candidateId: string) => {
    if (!subscription) return true; // Allow while loading
    const candidateUsage = usage.find((u) => u.candidate_id === candidateId);
    const usedUpdates = candidateUsage?.updates_used || 0;
    return usedUpdates < subscription.updates_per_candidate;
  };

  const getRemainingUpdates = (candidateId: string) => {
    if (!subscription) return 1; // Show 1 while loading
    const candidateUsage = usage.find((u) => u.candidate_id === candidateId);
    const usedUpdates = candidateUsage?.updates_used || 0;
    return Math.max(0, subscription.updates_per_candidate - usedUpdates);
  };

  return {
    subscription,
    usage,
    candidateCount,
    loading,
    canAddCandidate,
    canUseUpdate,
    getRemainingUpdates,
    refetch: fetchSubscriptionAndUsage,
    planLimits: PLAN_LIMITS,
  };
}
