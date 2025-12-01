import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Fetch candidate
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .eq("user_id", user.id)
      .single();

    if (candidateError || !candidate) {
      throw new Error("Candidate not found");
    }

    // Fetch all interactions for this candidate
    const { data: interactions } = await supabase
      .from("interactions")
      .select("*")
      .eq("candidate_id", candidateId)
      .eq("user_id", user.id)
      .order("interaction_date", { ascending: false });

    // Build context for AI analysis
    const interactionDetails = interactions?.map((i: any) => ({
      date: i.interaction_date,
      type: i.interaction_type,
      duration: i.duration,
      feeling: i.overall_feeling,
      gut_feeling: i.gut_feeling,
      notes: i.notes,
      who_initiated: i.who_initiated,
      who_paid: i.who_paid,
    })) || [];

    // Format status for AI readability
    const statusMap: Record<string, string> = {
      "just_matched": "just matched",
      "texting": "texting stage",
      "planning_date": "planning a date",
      "dating": "situationship",
      "dating_casually": "dating casually",
      "getting_serious": "getting serious",
      "serious_relationship": "in a serious relationship",
      "no_contact": "no contact",
      "archived": "archived/ended",
    };
    const formattedStatus = statusMap[candidate.status] || candidate.status || "Unknown";

    const prompt = `Analyze this dating candidate's behavior patterns based on their profile and interaction history. Detect any red flags (warning signs) and green flags (positive signs).

CANDIDATE INFO:
- Nickname: ${candidate.nickname}
- Status: ${formattedStatus}
- Attachment Style: ${candidate.their_attachment_style || "Unknown"}
- Notes: ${candidate.notes || "None"}

INTERACTION HISTORY (${interactionDetails.length} interactions):
${JSON.stringify(interactionDetails, null, 2)}

Based on the interaction patterns and any behavioral indicators, identify:
1. RED FLAGS: Warning signs like inconsistent communication, love bombing, hot/cold behavior, avoiding commitment talk, controlling behavior, dismissiveness, breadcrumbing, future faking, etc.
2. GREEN FLAGS: Positive signs like consistent communication, planning dates ahead, remembering details, respecting boundaries, emotional availability, follow-through, honesty, genuine interest, etc.

Only flag behaviors you can reasonably infer from the data. Be specific but concise.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are D.E.V.I. (Dating Evaluation & Vetting Intelligence), a relationship pattern analyst. Detect behavioral red and green flags from dating interactions. Be specific and evidence-based." },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "detect_flags",
              description: "Detect red and green flags from candidate behavior",
              parameters: {
                type: "object",
                properties: {
                  red_flags: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of detected red flags (warning signs). Each should be a short phrase like 'Inconsistent communication' or 'Hot and cold behavior'"
                  },
                  green_flags: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of detected green flags (positive signs). Each should be a short phrase like 'Consistent communication' or 'Plans dates in advance'"
                  }
                },
                required: ["red_flags", "green_flags"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "detect_flags" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    
    let flags = { red_flags: [], green_flags: [] };
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      try {
        flags = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Update candidate with detected flags
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        red_flags: flags.red_flags || [],
        green_flags: flags.green_flags || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return new Response(JSON.stringify(flags), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
