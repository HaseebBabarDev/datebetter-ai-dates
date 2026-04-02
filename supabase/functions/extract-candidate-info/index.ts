import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { freeformText } = await req.json();
    if (!freeformText || typeof freeformText !== "string" || freeformText.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Please provide more details" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a data extraction assistant for a dating app. The user will describe someone they're dating or interested in. Extract as many structured fields as possible from their description.

Return the extracted data by calling the extract_candidate tool. Only include fields you can confidently extract. Use null for anything not mentioned or unclear.

For enum fields, map to the closest valid value. For example:
- "he's really tall" → height: "over_6ft"
- "she's conservative" → their_politics: "conservative"  
- "he wants kids" → their_kids_desire: "definitely_yes"
- "she's avoidant" → their_attachment_style: "avoidant"
- "met on Hinge" → met_via: "dating_app", met_app: "Hinge"
- "works in tech" → their_career_stage: "mid_career"
- "his parents are divorced" → their_parent_status: "divorced", their_parents_relationship: "divorced_amicable" or "divorced_contentious" if detail given

Extract notes, family details, relationship history, red flags, and any other relevant info mentioned.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: freeformText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_candidate",
              description: "Extract structured candidate information from freeform text",
              parameters: {
                type: "object",
                properties: {
                  nickname: { type: "string", description: "Name or nickname" },
                  age: { type: "number", description: "Their age" },
                  gender_identity: { type: "string", enum: ["man_cis", "woman_cis", "non_binary", "gender_fluid", "man_trans", "woman_trans", "self_describe"] },
                  pronouns: { type: "string", enum: ["he_him", "she_her", "they_them", "other"] },
                  met_via: { type: "string", enum: ["dating_app", "social_media", "friends", "work", "school", "event", "gym", "coffee_shop", "other"] },
                  met_app: { type: "string", description: "Which dating app if met via dating app" },
                  height: { type: "string", enum: ["under_5ft", "5ft_5ft3", "5ft4_5ft6", "5ft7_5ft9", "5ft10_6ft", "over_6ft"] },
                  country: { type: "string" },
                  city: { type: "string" },
                  distance_approximation: { type: "string", enum: ["same_city", "regional", "far", "long_distance"] },
                  their_religion: { type: "string", enum: ["none", "spiritual", "christian_catholic", "christian_protestant", "christian_other", "jewish", "muslim", "hindu", "buddhist", "other"] },
                  their_politics: { type: "string", enum: ["progressive", "liberal", "moderate", "conservative", "traditional"] },
                  their_relationship_status: { type: "string", enum: ["single", "married", "recently_divorced", "ethical_non_monogamy"] },
                  their_relationship_goal: { type: "string", enum: ["casual", "situationship", "dating", "serious", "marriage", "unsure"] },
                  their_kids_desire: { type: "string", enum: ["definitely_yes", "maybe", "definitely_no", "already_have"] },
                  their_kids_status: { type: "string", enum: ["no_kids", "has_young_kids", "has_adult_kids"] },
                  their_attachment_style: { type: "string", enum: ["secure", "anxious", "avoidant", "disorganized"] },
                  their_career_stage: { type: "string", enum: ["student", "entry_level", "mid_career", "senior", "executive", "entrepreneur", "creative", "athlete", "freelance", "between_jobs"] },
                  their_education_level: { type: "string", enum: ["high_school", "some_college", "bachelors", "masters", "doctorate", "trade_school"] },
                  their_social_style: { type: "string", enum: ["homebody", "social_butterfly", "balanced", "mood_dependent"] },
                  their_drinking: { type: "string", enum: ["never", "rarely", "socially", "regularly"] },
                  their_smoking: { type: "string", enum: ["never", "rarely", "socially", "regularly"] },
                  their_exercise: { type: "string", enum: ["never", "rarely", "sometimes", "regularly", "daily"] },
                  their_schedule_flexibility: { type: "string", enum: ["remote_flexible", "hybrid", "office_9_5", "shift_work", "on_call", "overnight", "frequent_traveler", "student", "self_employed"] },
                  zodiac_sign: { type: "string", enum: ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] },
                  their_parent_status: { type: "string", enum: ["married_together", "unmarried_together", "divorced", "separated", "single_parent", "adopted", "orphan_system", "other_guardians"] },
                  their_mother_status: { type: "string", enum: ["present", "absent", "deceased"] },
                  their_father_status: { type: "string", enum: ["present", "absent", "deceased"] },
                  their_siblings: { type: "number", description: "Number of siblings" },
                  their_parents_relationship: { type: "string", enum: ["together_healthy", "together_unhealthy", "divorced_amicable", "divorced_contentious", "single_parent"] },
                  their_felt_loved_as_child: { type: "string", enum: ["yes_consistently", "sometimes", "rarely", "no"] },
                  their_family_stability: { type: "string", enum: ["very_stable", "mostly_stable", "some_instability", "frequent_chaos"] },
                  their_healthy_relationship_models: { type: "boolean" },
                  their_family_notes: { type: "string", description: "Freeform family/upbringing notes" },
                  their_relationship_notes: { type: "string", description: "Notes about their past relationships" },
                  notes: { type: "string", description: "General notes about this person" },
                  their_ambition_level: { type: "number", minimum: 1, maximum: 5 },
                  overall_chemistry: { type: "number", minimum: 1, maximum: 5 },
                  physical_attraction: { type: "number", minimum: 1, maximum: 5 },
                  intellectual_connection: { type: "number", minimum: 1, maximum: 5 },
                  humor_compatibility: { type: "number", minimum: 1, maximum: 5 },
                  energy_match: { type: "number", minimum: 1, maximum: 5 },
                },
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_candidate" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI extraction failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured data extracted");
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-candidate-info error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
