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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { triggerType = "assessment", dailyFeeling } = await req.json();

    // Fetch user profile for healing assessment data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("ex_contact_status, over_ex_level, attachment_to_past, past_relationship_traumas, relationship_trauma_notes, healing_score")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return new Response(JSON.stringify({ error: "Failed to fetch profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previousScore = profile.healing_score;

    // Calculate base healing score from assessment data
    let baseScore = 50; // Start at neutral

    // Ex contact status impact (0-15 points)
    const exContactScores: Record<string, number> = {
      "no_contact": 15,
      "occasional": 12,
      "regular": 8,
      "frequent": 4,
      "still_connected": 0,
      "not_applicable": 15,
    };
    baseScore += exContactScores[profile.ex_contact_status || "not_applicable"] || 0;

    // Over ex level (0-25 points, based on 0-100 slider)
    const overExScore = Math.round((profile.over_ex_level || 50) * 0.25);
    baseScore += overExScore;

    // Attachment to past (inverse - lower attachment is better) (0-20 points)
    const attachmentScore = Math.round((100 - (profile.attachment_to_past || 50)) * 0.2);
    baseScore += attachmentScore;

    // Past relationship trauma impact (-10 to +10 based on number and severity)
    const traumas = Array.isArray(profile.past_relationship_traumas) ? profile.past_relationship_traumas : [];
    const traumaCount = traumas.length;
    
    // Having processed traumas shows healing awareness, but too many unprocessed can indicate more work needed
    if (traumaCount === 0) {
      baseScore += 5; // Either no trauma or hasn't reflected yet
    } else if (traumaCount <= 2) {
      baseScore += 8; // Some reflection
    } else if (traumaCount <= 4) {
      baseScore += 5; // Good awareness
    } else {
      baseScore += 2; // Significant trauma history to work through
    }

    // Cap the score between 0 and 100
    let healingScore = Math.max(0, Math.min(100, baseScore));

    // Generate AI insights
    let aiInsights = "";
    
    if (lovableApiKey) {
      try {
        const systemPrompt = `You are D.E.V.I., a compassionate dating AI assistant. Based on the user's healing assessment data, provide a brief, supportive insight about their healing journey. Be warm, encouraging, and specific.

Assessment Data:
- Ex Contact Status: ${profile.ex_contact_status || "not specified"}
- How over their ex (0-100): ${profile.over_ex_level || "not specified"}
- Attachment to past patterns (0-100): ${profile.attachment_to_past || "not specified"}
- Number of past relationship traumas identified: ${traumaCount}
- Calculated Healing Score: ${healingScore}%
${dailyFeeling ? `- Today's feeling shared: "${dailyFeeling}"` : ""}

Provide a 2-3 sentence supportive insight. If the score is below 75%, include encouragement that healing isn't linear. Focus on their strengths and growth areas.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "Generate a healing insight for this user." },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsights = aiData.choices?.[0]?.message?.content || "";
        }
      } catch (aiError) {
        console.error("AI insight generation error:", aiError);
        // Continue without AI insights
      }
    }

    // Default insights if AI didn't provide any
    if (!aiInsights) {
      if (healingScore >= 75) {
        aiInsights = "You're showing great progress in your healing journey! Your awareness and self-reflection are powerful tools. Keep nurturing your growth.";
      } else if (healingScore >= 50) {
        aiInsights = "You're making steady progress. Remember, healing isn't linear — some days will feel harder than others, and that's completely normal. D.E.V.I. is here to support you.";
      } else {
        aiInsights = "Healing takes time, and it's okay to not be where you want to be yet. The fact that you're here, reflecting on your journey, shows incredible strength. Take it one day at a time.";
      }
    }

    // Calculate score change
    const scoreChange = previousScore !== null ? healingScore - previousScore : null;

    // Save the healing score to history
    const { error: insertError } = await supabase
      .from("healing_scores")
      .insert({
        user_id: user.id,
        score: healingScore,
        previous_score: previousScore,
        score_change: scoreChange,
        ai_insights: aiInsights,
        trigger_type: triggerType,
      });

    if (insertError) {
      console.error("Insert healing score error:", insertError);
    }

    // Update profile with current healing score
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        healing_score: healingScore,
        healing_assessment_date: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update profile error:", updateError);
    }

    return new Response(
      JSON.stringify({
        healingScore,
        previousScore,
        scoreChange,
        aiInsights,
        showDisclosure: healingScore < 75,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Calculate healing score error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
