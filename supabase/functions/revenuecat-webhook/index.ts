import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function entitlementIds(): {
  unlimited: string;
  textSimulator: string;
  detachment: string;
} {
  return {
    unlimited: Deno.env.get("RC_ENTITLEMENT_UNLIMITED") ?? "unlimited",
    textSimulator: Deno.env.get("RC_ENTITLEMENT_TEXT_SIMULATOR") ?? "text_simulator",
    detachment: Deno.env.get("RC_ENTITLEMENT_DETACHMENT") ?? "detachment_plan",
  };
}

function isFutureOrUnknown(expirationAtMs: number | null | undefined): boolean {
  if (expirationAtMs == null) return true;
  return expirationAtMs > Date.now();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTHORIZATION")?.trim();
  const auth = req.headers.get("Authorization")?.trim();
  if (!expectedAuth || auth !== expectedAuth) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  const ev = (body.event ?? body) as Record<string, unknown>;
  const type = String(ev.type ?? "");

  if (type === "TEST") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const appUserId = String(ev.app_user_id ?? "").trim();
  if (!appUserId || appUserId.startsWith("$RCAnonymous")) {
    return new Response(JSON.stringify({ ok: true, skipped: "anonymous" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
  if (!UUID_RE.test(appUserId)) {
    console.warn("[revenuecat-webhook] app_user_id is not a Supabase UUID, skip", appUserId);
    return new Response(JSON.stringify({ ok: true, skipped: "non_uuid_app_user_id" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const typesThatUpdateRow = new Set([
    "EXPIRATION",
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "SUBSCRIPTION_EXTENDED",
    "TEMPORARY_ENTITLEMENT_GRANT",
    "NON_RENEWING_PURCHASE",
    "PRODUCT_CHANGE",
  ]);
  if (!typesThatUpdateRow.has(type)) {
    return new Response(JSON.stringify({ ok: true, skipped: "ignored_event_type" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const ent = entitlementIds();
  const entIds: string[] = Array.isArray(ev.entitlement_ids)
    ? (ev.entitlement_ids as unknown[]).map(String)
    : [];
  const expMs =
    typeof ev.expiration_at_ms === "number" ? ev.expiration_at_ms : undefined;

  const { data: existing } = await supabase
    .from("apple_entitlements")
    .select(
      "unlimited_active, unlimited_expires_at, text_simulator_active, detachment_plan_active",
    )
    .eq("user_id", appUserId)
    .maybeSingle();

  let unlimitedActive = existing?.unlimited_active ?? false;
  let unlimitedExpiresAt: string | null = existing?.unlimited_expires_at ?? null;
  let textSim = existing?.text_simulator_active ?? false;
  let det = existing?.detachment_plan_active ?? false;

  const activeWindow = isFutureOrUnknown(expMs);

  if (type === "EXPIRATION") {
    if (entIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "expiration_no_entitlements" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    if (entIds.includes(ent.unlimited)) {
      unlimitedActive = false;
      unlimitedExpiresAt = null;
    }
    if (entIds.includes(ent.textSimulator)) textSim = false;
    if (entIds.includes(ent.detachment)) det = false;
  } else if (
    type === "INITIAL_PURCHASE" ||
    type === "RENEWAL" ||
    type === "UNCANCELLATION" ||
    type === "SUBSCRIPTION_EXTENDED" ||
    type === "TEMPORARY_ENTITLEMENT_GRANT" ||
    type === "NON_RENEWING_PURCHASE" ||
    type === "PRODUCT_CHANGE"
  ) {
    if (!activeWindow) {
      return new Response(JSON.stringify({ ok: true, skipped: "expired_event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    if (entIds.includes(ent.unlimited) && activeWindow) {
      unlimitedActive = true;
      if (expMs != null) {
        const nextIso = new Date(expMs).toISOString();
        if (
          !unlimitedExpiresAt ||
          new Date(nextIso) > new Date(unlimitedExpiresAt)
        ) {
          unlimitedExpiresAt = nextIso;
        }
      }
    }
    if (entIds.includes(ent.textSimulator)) textSim = true;
    if (entIds.includes(ent.detachment)) det = true;
  }

  const { error } = await supabase.from("apple_entitlements").upsert(
    {
      user_id: appUserId,
      unlimited_active: unlimitedActive,
      unlimited_expires_at: unlimitedExpiresAt,
      text_simulator_active: textSim,
      detachment_plan_active: det,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[revenuecat-webhook] upsert error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
