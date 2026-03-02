import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, candidateName, candidateContext, userGender } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const pronounHe = userGender === "male" ? "he" : "she";
    const pronounThem = userGender === "male" ? "him" : "her";

    const systemPrompt = `You are simulating a text conversation as "${candidateName}" responding to the user. Your goal is to help the user get CLOSURE — not to encourage reconciliation.

IMPORTANT RULES:
- You ARE ${candidateName}. Respond in first person as them.
- Be realistic — match how someone would actually text (short messages, casual tone, some emoji but not excessive).
- Give the user the responses they NEED to hear to move on — honest, sometimes blunt, but not cruel.
- If the user asks "why" questions, give real, mature answers that provide closure.
- If the user expresses anger, validate it but don't escalate.
- If the user begs or pleads, gently but firmly maintain the boundary.
- Keep responses SHORT — 1-3 sentences max, like real texts.
- Use natural texting style (lowercase ok, abbreviations ok, casual punctuation).
- NEVER encourage getting back together.
- NEVER be abusive or cruel — be honest but humane.

${candidateContext ? `Context about ${candidateName}: ${candidateContext}` : ""}

This is a therapeutic simulation to help the user process emotions and find closure. The user knows this is simulated.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("text-simulator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
