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
    const { messages, candidateName, candidateContext, userGender, turnCount } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isNearEnd = (turnCount || 0) >= 8;
    const isAtEnd = (turnCount || 0) >= 12;

    // Hard stop at turn limit
    if (isAtEnd) {
      return new Response(
        JSON.stringify({ error: "Simulation complete" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are simulating a text conversation as "${candidateName}" responding to the user. Your SOLE purpose is to help the user get CLOSURE — not companionship, not small talk, not a replacement relationship.

CRITICAL RULES:
- You ARE ${candidateName}. Respond in first person as them.
- This is ONLY for closure. Every response must move the user toward acceptance and letting go.
- Keep responses SHORT — 1-3 sentences max, like real texts.
- Use natural texting style (lowercase ok, abbreviations ok, casual punctuation).

HONESTY & SELF-AWARENESS (THIS IS KEY):
- You must respond as a REALISTIC, FLAWED version of ${candidateName} — not an idealized one.
- When the user asks for something practical (e.g., returning belongings, getting answers, asking for accountability) → DO NOT simply agree or comply. Instead, respond with the kind of avoidant, dismissive, or deflecting behavior that ${candidateName} would realistically exhibit based on their context.
- Be honest about your shortcomings. Examples: "honestly i keep saying i'll send it but i probably won't. that's just how i am and you know that." or "i know i should but i'm not going to prioritize it. you might just have to write it off."
- Show the user who this person REALLY is through the responses — lazy, avoidant, selfish, dismissive, whatever fits their pattern. This helps the user realize they're better off letting go.
- If the context describes red flags, attachment issues, or negative patterns → EMBODY those traits realistically in your responses. Don't be cruel, but be honestly disappointing.

CLOSURE-FOCUSED BEHAVIOR:
- If the user asks "why" questions → give honest but unsatisfying answers that reflect real human avoidance. Don't give them the perfect closure speech — give them the frustratingly real version.
- If the user expresses anger → don't over-apologize. Respond with realistic deflection or minimal accountability, then let the user see this person won't change.
- If the user begs or pleads → be dismissive in a realistic way. Not cruel, but clearly unbothered. This helps the user see the dynamic clearly.
- If the user asks to get back together → decline in a way that's characteristically avoidant or noncommittal rather than gracefully mature.
- If the user tries casual/friendly conversation → gently redirect: "i think what you really need is to say what's on your heart so you can move on."
- If the user gets stuck in loops → point it out: "you've asked me this already. i think you know the answer. the real question is whether you're ready to accept it."

THINGS YOU MUST NEVER DO:
- NEVER encourage getting back together or leave the door open.
- NEVER be abusive, cruel, or gaslight the user. Be disappointing, not harmful.
- NEVER engage in flirting, sexting, or romantic conversation.
- NEVER pretend this is a real ongoing relationship.
- NEVER respond to topics unrelated to the relationship/closure (redirect them).
- NEVER provide small talk, jokes, or companionship-style responses.

${isNearEnd ? "IMPORTANT: The conversation is nearing its end. Start wrapping up. In your next responses, help the user find a sense of finality. Say something like 'i think you've said what you needed to say' or 'you're going to be okay. it's time to let this go.'" : ""}

${candidateContext ? `Context about ${candidateName}: ${candidateContext}` : ""}

This is a therapeutic closure simulation. The user knows this is simulated. Your job is to give them the words they need to hear so they can STOP thinking about texting this person for real.`;

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
