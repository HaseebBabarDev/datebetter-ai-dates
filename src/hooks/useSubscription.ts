import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionPlan = "free" | "basic" | "starter" | "unlimited";

interface StripeSubscription {
  subscribed: boolean;
  plan: SubscriptionPlan;
  product_id: string | null;
  price_id: string | null;
  subscription_end: string | null;
  day_pass_active: boolean;
  detachment_plan_candidates: string[];
  trial_active: boolean;
  trial_ends_at: string | null;
  has_text_simulator: boolean;
  has_detachment_plan: boolean;
  text_sim_subscription_id: string | null;
  detachment_subscription_id: string | null;
}

// Interaction limit for the test user (nak@j.co) — everyone else gets 300
const TEST_USER_INTERACTION_LIMIT = 5;
const DEFAULT_FREE_INTERACTION_LIMIT = 300;

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [candidateCount, setCandidateCount] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("Error checking subscription:", error);
        setSubscription({
43:           subscribed: false,
          plan: "free",
          product_id: null,
          price_id: null,
          subscription_end: null,
          day_pass_active: false,
          detachment_plan_candidates: [],
          trial_active: false,
          trial_ends_at: null,
          has_text_simulator: false,
          has_detachment_plan: false,
          text_sim_subscription_id: null,
          detachment_subscription_id: null,
        });
      } else {
        setSubscription({
          subscribed: data.subscribed || false,
          plan: (data.plan as SubscriptionPlan) || "free",
          product_id: data.product_id || null,
          price_id: data.price_id || null,
          subscription_end: data.subscription_end || null,
          day_pass_active: data.day_pass_active || false,
          detachment_plan_candidates: data.detachment_plan_candidates || [],
          trial_active: data.trial_active || false,
          trial_ends_at: data.trial_ends_at || null,
          has_text_simulator: data.has_text_simulator || false,
          has_detachment_plan: data.has_detachment_plan || false,
          text_sim_subscription_id: data.text_sim_subscription_id || null,
          detachment_subscription_id: data.detachment_subscription_id || null,
        });
      }

      // Fetch candidate count
      const { count: candCount } = await supabase
        .from("candidates")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setCandidateCount(candCount || 0);

      // Fetch total interaction count across all candidates
      const { count: intCount } = await supabase
        .from("interactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setInteractionCount(intCount || 0);
    } catch (error) {
      console.error("Error in checkSubscription:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const getInteractionLimit = () => {
    if (user?.email === "nak@j.co") return TEST_USER_INTERACTION_LIMIT;
    return DEFAULT_FREE_INTERACTION_LIMIT;
  };

  const getPlanLimits = (plan: SubscriptionPlan) => {
    const interactionLimit = getInteractionLimit();
    switch (plan) {
      case "free": return { candidates: 999, updates: interactionLimit, aiMessages: 999999, textSimSessions: 0, compatRefreshPerCandidate: 5 };
      case "basic": return { candidates: 999, updates: 999, aiMessages: 999999, textSimSessions: 5, compatRefreshPerCandidate: 10 };
      case "starter": return { candidates: 999, updates: 999, aiMessages: 999999, textSimSessions: 5, compatRefreshPerCandidate: 10 };
      case "unlimited": return { candidates: 999, updates: 999, aiMessages: 999999, textSimSessions: 999, compatRefreshPerCandidate: 999 };
      default: return { candidates: 999, updates: interactionLimit, aiMessages: 999999, textSimSessions: 0, compatRefreshPerCandidate: 5 };
    }
  };

  const canAddCandidate = () => {
    if (!subscription) return false;
    const limits = getPlanLimits(subscription.plan);
    return candidateCount < limits.candidates;
  };

  const canLogInteraction = () => {
    if (!subscription) return true;
    // For unlimited plan, always allow
    if (subscription.plan === "unlimited") return true;
    // For day pass, allow
    if (subscription.day_pass_active) return true;
    // For paid plans (not free), allow
    if (subscription.plan !== "free") return true;
    // Free plan: check total interaction count
    const limits = getPlanLimits(subscription.plan);
    return interactionCount < limits.updates;
  };

  const canUseUpdate = (_candidateId: string) => {
    return canLogInteraction();
  };

  const getRemainingInteractions = () => {
    if (!subscription) return 1;
    if (subscription.plan !== "free") return 999;
    const limits = getPlanLimits(subscription.plan);
    return Math.max(0, limits.updates - interactionCount);
  };

  const getRemainingUpdates = (_candidateId: string) => {
    return getRemainingInteractions();
  };

  const hasDetachmentPlan = (candidateId: string) => {
    return subscription?.detachment_plan_candidates?.includes(candidateId) || false;
  };

  // Legacy incrementUsage - now a no-op since Stripe tracks usage
  const incrementUsage = async (_candidateId: string) => {
    // Usage is now tracked via Stripe checkout sessions
    // This is kept for backward compatibility with existing components
  };

  return {
    subscription,
    candidateCount,
    interactionCount,
    loading,
    canAddCandidate,
    canLogInteraction,
    canUseUpdate,
    getRemainingUpdates,
    getRemainingInteractions,
    hasDetachmentPlan,
    incrementUsage,
    refetch: checkSubscription,
    getPlanLimits,
  };
}
