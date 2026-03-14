import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_U5BaepUGcVqsIg": "basic",
  "prod_U5Ba3aovhb68xI": "starter",
  "prod_U5Ba2gOJLLzLpj": "unlimited",
};

function safeTimestamp(val: any): string | null {
  if (!val) return null;
  try {
    // If it's a number (unix seconds), convert
    if (typeof val === "number") {
      const d = new Date(val * 1000);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    // If it's already a string, try parsing
    if (typeof val === "string") {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    // Check for active trial in user_subscriptions
    let trialActive = false;
    let trialEndsAt: string | null = null;
    try {
      const { data: subData } = await supabaseClient
        .from("user_subscriptions")
        .select("trial_ends_at, plan, candidates_limit, updates_per_candidate")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subData?.trial_ends_at) {
        const trialEnd = new Date(subData.trial_ends_at);
        if (trialEnd > new Date()) {
          trialActive = true;
          trialEndsAt = trialEnd.toISOString();
          logStep("Active trial found", { trialEndsAt });
        }
      }
    } catch (e) {
      logStep("Error checking trial (non-fatal)", { message: String(e) });
    }

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      if (trialActive) {
        return new Response(JSON.stringify({
          subscribed: true,
          plan: "starter",
          product_id: null,
          price_id: null,
          subscription_end: trialEndsAt,
          trial_active: true,
          trial_ends_at: trialEndsAt,
          day_pass_active: false,
          detachment_plan_candidates: [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      return new Response(JSON.stringify({ subscribed: false, plan: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let plan = "free";
    let productId = null;
    let subscriptionEnd = null;
    let priceId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      // Try multiple ways to get the period end — basil API may differ
      const periodEnd = subscription.current_period_end 
        ?? (subscription as any).currentPeriodEnd
        ?? subscription.items?.data?.[0]?.current_period_end;
      subscriptionEnd = safeTimestamp(periodEnd);
      productId = subscription.items.data[0]?.price?.product as string;
      priceId = subscription.items.data[0]?.price?.id;
      plan = PRODUCT_TO_PLAN[productId] || "unknown";
      logStep("Active subscription found", { plan, productId, priceId, endDate: subscriptionEnd, rawPeriodEnd: periodEnd });
    } else {
      logStep("No active subscription");
    }

    // Check for one-time purchases (Day Pass, Detachment Plan)
    let detachmentPlanCandidates: string[] = [];
    let hasDayPass = false;

    try {
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 50,
      });

      const now = Date.now();

      for (const session of sessions.data) {
        if (session.payment_status === "paid" && session.mode === "payment") {
          if (session.metadata?.candidate_id) {
            detachmentPlanCandidates.push(session.metadata.candidate_id);
          }
          // Day pass: check if purchased within last 24 hours
          const createdMs = typeof session.created === "number" ? session.created * 1000 : 0;
          if (createdMs > 0) {
            const hoursDiff = (now - createdMs) / (1000 * 60 * 60);
            if (hoursDiff <= 24) {
              hasDayPass = true;
            }
          }
        }
      }
    } catch (e) {
      logStep("Error fetching checkout sessions (non-fatal)", { message: String(e) });
    }

    // If no active Stripe sub but trial is active, grant starter access
    const effectiveSubscribed = hasActiveSub || trialActive;
    const effectivePlan = hasActiveSub ? plan : (trialActive ? "starter" : "free");
    const effectiveEnd = hasActiveSub ? subscriptionEnd : (trialActive ? trialEndsAt : null);

    return new Response(JSON.stringify({
      subscribed: effectiveSubscribed,
      plan: effectivePlan,
      product_id: productId,
      price_id: priceId,
      subscription_end: effectiveEnd,
      trial_active: trialActive,
      trial_ends_at: trialEndsAt,
      day_pass_active: hasDayPass,
      detachment_plan_candidates: detachmentPlanCandidates,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
