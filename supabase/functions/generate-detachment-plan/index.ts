import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { candidateId } = await req.json();
    if (!candidateId) {
      return new Response(JSON.stringify({ error: "candidateId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch candidate data
    const { data: candidate, error: candError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .eq("user_id", user.id)
      .single();

    if (candError || !candidate) {
      return new Response(JSON.stringify({ error: "Candidate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("attachment_style, healing_score, dating_patterns, attachment_tendencies, attachment_security_level")
      .eq("user_id", user.id)
      .single();

    // Fetch recent interactions
    const { data: interactions } = await supabase
      .from("interactions")
      .select("interaction_type, overall_feeling, gut_feeling, notes, interaction_date")
      .eq("candidate_id", candidateId)
      .eq("user_id", user.id)
      .order("interaction_date", { ascending: false })
      .limit(10);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are D.E.V.I., an emotionally intelligent AI dating coach. Generate a deeply personalized, phase-based Detachment Plan to help someone emotionally detach from a person they have been dating. The plan must be compassionate, empowering, and rooted in attachment theory and emotional healing.

The plan should have exactly 4 phases:
1. "Awareness" - Recognizing patterns and triggers
2. "Distance" - Creating emotional and physical space  
3. "Reclaim" - Rebuilding identity and self-worth
4. "Freedom" - Moving forward with clarity

Each phase should have:
- A name and tagline
- Duration (e.g., "Days 1-7")
- 4-6 specific daily practices/tasks
- An affirmation
- A milestone to achieve before moving to next phase
- Emotional challenges to expect and how to cope

Make it deeply personal based on the candidate data provided. Reference specific things about the relationship to make it feel tailored.`;

    const candidateContext = `
Candidate nickname: ${candidate.nickname}
Candidate status: ${candidate.status || "unknown"}
Red flags: ${JSON.stringify(candidate.red_flags || [])}
Green flags: ${JSON.stringify(candidate.green_flags || [])}
Attachment style: ${candidate.their_attachment_style || "unknown"}
Relationship ended: ${candidate.relationship_ended_at ? "Yes" : "No"}
End reason: ${candidate.end_reason || "not specified"}
No contact active: ${candidate.no_contact_active ? "Yes" : "No"}
User's goal: ${candidate.user_goal_for_candidate || "not specified"}
Relationship notes: ${candidate.their_relationship_notes || "none"}

User profile:
Attachment style: ${profile?.attachment_style || "unknown"}
Healing score: ${profile?.healing_score || "unknown"}
Dating patterns: ${JSON.stringify(profile?.dating_patterns || [])}

Recent interactions (last 10):
${interactions?.map(i => `- ${i.interaction_type} on ${i.interaction_date}, feeling: ${i.overall_feeling}/5, gut: ${i.gut_feeling || "n/a"}`).join("\n") || "No interactions logged"}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate a complete, personalized detachment plan for someone trying to emotionally detach from "${candidate.nickname}". Here is all the context:\n\n${candidateContext}\n\nReturn a JSON object with this exact structure:
{
  "title": "string - personalized plan title",
  "subtitle": "string - one line motivational subtitle",
  "overview": "string - 2-3 sentence personalized overview of why this plan was made for them",
  "phases": [
    {
      "number": 1,
      "name": "Awareness",
      "tagline": "string",
      "duration": "Days 1-7",
      "color": "rose",
      "affirmation": "string - powerful daily affirmation",
      "milestone": "string - what to achieve before next phase",
      "emotional_challenge": "string - what they might feel and how to cope",
      "practices": [
        {
          "title": "string",
          "description": "string - 1-2 sentences of actionable guidance",
          "frequency": "Daily | Every 2 days | Weekly"
        }
      ]
    }
  ],
  "closing_message": "string - compassionate closing message specific to their situation"
}

Make each phase deeply tailored to this specific person and relationship. Return only valid JSON.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits low. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const planText = aiData.choices?.[0]?.message?.content;

    let planData;
    try {
      planData = JSON.parse(planText);
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }

    // Upsert the plan (regenerate if already exists)
    const { data: savedPlan, error: saveError } = await supabase
      .from("detachment_plans")
      .upsert({
        user_id: user.id,
        candidate_id: candidateId,
        plan_data: planData,
        generated_at: new Date().toISOString(),
        // Preserve is_unlocked if already exists - handled by ON CONFLICT
      }, { onConflict: "user_id,candidate_id", ignoreDuplicates: false })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving plan:", saveError);
      // Return plan even if save failed
      return new Response(JSON.stringify({ plan: planData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ plan: planData, planId: savedPlan.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-detachment-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
