import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Stripe product IDs to internal plan names
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_U5BaepUGcVqsIg": "basic",
  "prod_U5Ba3aovhb68xI": "starter",
  "prod_U5Ba2gOJLLzLpj": "unlimited",
};

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

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
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
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      priceId = subscription.items.data[0].price.id;
      plan = PRODUCT_TO_PLAN[productId] || "unknown";
      logStep("Active subscription found", { plan, productId, priceId, endDate: subscriptionEnd });
    } else {
      logStep("No active subscription");
    }

    // Also check for one-time purchases (Day Pass, Detachment Plan)
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
    });

    const oneTimePurchases: string[] = [];
    for (const charge of charges.data) {
      if (charge.paid && !charge.refunded && charge.metadata?.user_id === user.id) {
        // Track purchased product types
      }
    }

    // Check for completed checkout sessions for one-time purchases
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 50,
    });

    const detachmentPlanCandidates: string[] = [];
    let hasDayPass = false;
    const now = new Date();

    for (const session of sessions.data) {
      if (session.payment_status === "paid" && session.mode === "payment") {
        if (session.metadata?.candidate_id) {
          detachmentPlanCandidates.push(session.metadata.candidate_id);
        }
        // Day pass: check if purchased within last 24 hours
        const sessionDate = new Date(session.created * 1000);
        const hoursDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
        if (hoursDiff <= 24) {
          hasDayPass = true;
        }
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      product_id: productId,
      price_id: priceId,
      subscription_end: subscriptionEnd,
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
