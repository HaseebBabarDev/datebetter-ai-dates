import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

interface GeoLocation {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
}

async function getGeoLocation(ip: string): Promise<GeoLocation> {
  try {
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      return {};
    }
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,countryCode`);
    if (!response.ok) return {};
    const data = await response.json();
    if (data.status === "success") {
      return { city: data.city, region: data.regionName, country: data.country, countryCode: data.countryCode };
    }
    return {};
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { session_id, slides_viewed, viewer_email } = body;

    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    const clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : null) || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const geo = await getGeoLocation(clientIp);

    const { error } = await supabaseClient
      .from("pitch_deck_views")
      .insert({
        viewer_ip: clientIp,
        viewer_email: viewer_email || null,
        user_agent: userAgent,
        city: geo.city || null,
        region: geo.region || null,
        country: geo.country || null,
        country_code: geo.countryCode || null,
        session_id: session_id || null,
        slides_viewed: slides_viewed || 1,
      });

    if (error) {
      console.error("Error inserting pitch deck view:", error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in track-pitch-view:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
