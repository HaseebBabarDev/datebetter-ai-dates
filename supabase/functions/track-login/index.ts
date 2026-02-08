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
  timezone?: string;
  isp?: string;
}

async function getGeoLocation(ip: string): Promise<GeoLocation> {
  try {
    // Skip private/local IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      console.log("Skipping geolocation for private IP:", ip);
      return {};
    }

    // Use ip-api.com (free, no API key required, 45 requests/minute limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,countryCode,timezone,isp`);
    
    if (!response.ok) {
      console.error("Geolocation API error:", response.status);
      return {};
    }

    const data = await response.json();
    
    if (data.status === "success") {
      return {
        city: data.city,
        region: data.regionName,
        country: data.country,
        countryCode: data.countryCode,
        timezone: data.timezone,
        isp: data.isp,
      };
    }
    
    console.log("Geolocation lookup failed:", data);
    return {};
  } catch (error) {
    console.error("Error fetching geolocation:", error);
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
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP from headers (set by edge runtime or proxy)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    
    // Parse forwarded-for (can be comma-separated list)
    let clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : null) || "unknown";
    
    console.log("Tracking login for user:", user.id, "IP:", clientIp);

    // Get geolocation data
    const geo = await getGeoLocation(clientIp);
    
    console.log("Geolocation result:", geo);

    // Insert login record
    const { error: insertError } = await supabaseClient
      .from("user_login_history")
      .insert({
        user_id: user.id,
        ip_address: clientIp,
        city: geo.city || null,
        region: geo.region || null,
        country: geo.country || null,
        country_code: geo.countryCode || null,
        timezone: geo.timezone || null,
        isp: geo.isp || null,
      });

    if (insertError) {
      console.error("Error inserting login history:", insertError);
      throw insertError;
    }

    console.log("Login tracked successfully for user:", user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        location: geo.city && geo.country ? `${geo.city}, ${geo.country}` : null 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in track-login:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
