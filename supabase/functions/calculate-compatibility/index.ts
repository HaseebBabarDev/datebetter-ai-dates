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
    
    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
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

    // Fetch recent interactions for context
    const { data: interactions } = await supabase
      .from("interactions")
      .select("*")
      .eq("candidate_id", candidateId)
      .eq("user_id", user.id)
      .order("interaction_date", { ascending: false })
      .limit(10);

    // Build interaction summary for the prompt
    let interactionSummary = "No interactions logged yet.";
    if (interactions && interactions.length > 0) {
      const interactionDetails = interactions.map((i: any) => 
        `- ${i.interaction_date}: ${i.interaction_type}${i.duration ? ` (${i.duration})` : ''} - Feeling: ${i.overall_feeling}/5${i.gut_feeling ? `, Gut: "${i.gut_feeling}"` : ''}${i.notes ? ` - Notes: "${i.notes}"` : ''}`
      ).join("\n");
      interactionSummary = `${interactions.length} interactions logged:\n${interactionDetails}`;
    }

    // Build the prompt for AI analysis
    const prompt = `You are a relationship compatibility analyst. Analyze the compatibility between a user and their dating candidate based on the following profiles and interaction history.

USER PROFILE:
- Relationship Goal: ${profile.relationship_goal || "Not specified"}
- Religion: ${profile.religion || "Not specified"}, Importance: ${profile.faith_importance || 3}/5
- Politics: ${profile.politics || "Not specified"}, Importance: ${profile.politics_importance || 3}/5
- Kids Status: ${profile.kids_status || "Not specified"}
- Kids Desire: ${profile.kids_desire || "Not specified"}
- Attachment Style: ${profile.attachment_style || "Not specified"}
- Ambition Level: ${profile.ambition_level || 3}/5
- Dealbreakers: ${JSON.stringify(profile.dealbreakers || [])}
- Communication Style: ${profile.communication_style || "Not specified"}

CANDIDATE PROFILE:
- Name: ${candidate.nickname}
- Relationship Goal: ${candidate.their_relationship_goal || "Not specified"}
- Religion: ${candidate.their_religion || "Not specified"}
- Politics: ${candidate.their_politics || "Not specified"}
- Kids Status: ${candidate.their_kids_status || "Not specified"}
- Kids Desire: ${candidate.their_kids_desire || "Not specified"}
- Attachment Style: ${candidate.their_attachment_style || "Not specified"}
- Ambition Level: ${candidate.their_ambition_level || "Not specified"}/5
- Career Stage: ${candidate.their_career_stage || "Not specified"}

CHEMISTRY RATINGS (1-5):
- Physical Attraction: ${candidate.physical_attraction || 3}
- Intellectual Connection: ${candidate.intellectual_connection || 3}
- Humor Compatibility: ${candidate.humor_compatibility || 3}
- Energy Match: ${candidate.energy_match || 3}
- Overall Chemistry: ${candidate.overall_chemistry || 3}

INTERACTION HISTORY (most recent first):
${interactionSummary}

Consider the interaction history carefully - low feelings, uncertainty, and notes about concerning behavior should significantly impact the compatibility score and concerns.

Provide a compatibility analysis with the following JSON structure:
{
  "overall_score": <number 0-100>,
  "breakdown": {
    "values_alignment": <number 0-100>,
    "lifestyle_compatibility": <number 0-100>,
    "emotional_compatibility": <number 0-100>,
    "chemistry_score": <number 0-100>,
    "future_goals": <number 0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>"],
  "advice": "<brief personalized advice based on both profiles and recent interactions>"
}

Only respond with valid JSON, no additional text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a relationship compatibility analyst. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const analysisText = aiData.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        analysisText.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, analysisText];
      analysis = JSON.parse(jsonMatch[1] || analysisText);
    } catch (e) {
      console.error("Failed to parse AI response:", analysisText);
      throw new Error("Failed to parse compatibility analysis");
    }

    // Update candidate with compatibility score
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        compatibility_score: analysis.overall_score,
        score_breakdown: analysis,
        last_score_update: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return new Response(JSON.stringify(analysis), {
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
