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

    // Calculate base scores from profile data for consistency
    const baseScores = calculateBaseScores(profile, candidate);

    // Build the prompt for AI analysis
    const prompt = `You are a relationship compatibility analyst. Analyze the compatibility between a user and their dating candidate.

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
- Height: ${profile.height || "Not specified"}
- Body Type: ${profile.body_type || "Not specified"}
- Activity Level: ${profile.activity_level || "Not specified"}
- Education Level: ${profile.education_level || "Not specified"}
- Height Preference for partner: ${profile.height_preference || "No preference"}

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
- Education Level: ${candidate.their_education_level || "Not specified"}
- Exercise Habits: ${candidate.their_exercise || "Not specified"}

CHEMISTRY RATINGS (1-5):
- Physical Attraction: ${candidate.physical_attraction || 3}
- Intellectual Connection: ${candidate.intellectual_connection || 3}
- Humor Compatibility: ${candidate.humor_compatibility || 3}
- Energy Match: ${candidate.energy_match || 3}
- Overall Chemistry: ${candidate.overall_chemistry || 3}

INTERACTION HISTORY (most recent first):
${interactionSummary}

BASE COMPATIBILITY SCORES (calculated from profile matching):
- Values Alignment: ${baseScores.values_alignment}
- Lifestyle: ${baseScores.lifestyle_compatibility}
- Emotional: ${baseScores.emotional_compatibility}
- Chemistry: ${baseScores.chemistry_score}
- Future Goals: ${baseScores.future_goals}
- Base Overall: ${baseScores.overall_score}

IMPORTANT: Use the base scores as your foundation. You may adjust them by UP TO 15 points based on interaction history insights, but maintain consistency with the calculated base. Negative interactions should reduce scores, positive ones can slightly increase them. Consider activity level and lifestyle compatibility when adjusting lifestyle scores.`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a relationship compatibility analyst. Use the provided base scores as your foundation and adjust minimally based on interactions." },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_compatibility_analysis",
              description: "Provide the compatibility analysis results",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { 
                    type: "number", 
                    description: "Overall compatibility score 0-100, should be close to the base score with minor adjustments" 
                  },
                  breakdown: {
                    type: "object",
                    properties: {
                      values_alignment: { type: "number", description: "Score 0-100 for values alignment" },
                      lifestyle_compatibility: { type: "number", description: "Score 0-100 for lifestyle compatibility" },
                      emotional_compatibility: { type: "number", description: "Score 0-100 for emotional compatibility" },
                      chemistry_score: { type: "number", description: "Score 0-100 for chemistry" },
                      future_goals: { type: "number", description: "Score 0-100 for future goals alignment" }
                    },
                    required: ["values_alignment", "lifestyle_compatibility", "emotional_compatibility", "chemistry_score", "future_goals"]
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 2-4 relationship strengths"
                  },
                  concerns: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 2-4 concerns or red flags"
                  },
                  advice: {
                    type: "string",
                    description: "Brief personalized advice for the user"
                  }
                },
                required: ["overall_score", "breakdown", "strengths", "concerns", "advice"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_compatibility_analysis" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    
    let analysis;
    
    // Handle tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
        // Fall back to base scores
        analysis = {
          overall_score: baseScores.overall_score,
          breakdown: baseScores,
          strengths: ["Profile data available for analysis"],
          concerns: ["Unable to generate detailed analysis"],
          advice: "Continue logging interactions to get better insights."
        };
      }
    } else {
      // Fallback: try to parse content as JSON
      const analysisText = aiData.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          analysisText.match(/```\s*([\s\S]*?)\s*```/) ||
                          [null, analysisText];
        analysis = JSON.parse(jsonMatch[1] || analysisText);
      } catch (e) {
        console.error("Failed to parse AI response, using base scores");
        analysis = {
          overall_score: baseScores.overall_score,
          breakdown: baseScores,
          strengths: ["Profile data available for analysis"],
          concerns: ["Unable to generate detailed analysis"],
          advice: "Continue logging interactions to get better insights."
        };
      }
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

// Calculate deterministic base scores from profile matching
function calculateBaseScores(profile: any, candidate: any) {
  let valuesScore = 50;
  let lifestyleScore = 50;
  let emotionalScore = 50;
  let futureGoalsScore = 50;
  
  // Values alignment (religion, politics)
  if (profile.religion && candidate.their_religion) {
    if (profile.religion === candidate.their_religion) {
      valuesScore += 25;
    } else if (profile.faith_importance >= 4) {
      valuesScore -= 20;
    }
  }
  
  if (profile.politics && candidate.their_politics) {
    const politicsOrder = ["progressive", "liberal", "moderate", "conservative", "traditional"];
    const userIdx = politicsOrder.indexOf(profile.politics);
    const candIdx = politicsOrder.indexOf(candidate.their_politics);
    const diff = Math.abs(userIdx - candIdx);
    if (diff === 0) valuesScore += 20;
    else if (diff === 1) valuesScore += 10;
    else if (diff >= 3 && profile.politics_importance >= 4) valuesScore -= 20;
  }
  
  // Relationship goals alignment
  if (profile.relationship_goal && candidate.their_relationship_goal) {
    if (profile.relationship_goal === candidate.their_relationship_goal) {
      futureGoalsScore += 30;
    } else {
      const serious = ["serious", "marriage"];
      const casual = ["casual", "dating"];
      const userSerious = serious.includes(profile.relationship_goal);
      const candSerious = serious.includes(candidate.their_relationship_goal);
      if (userSerious !== candSerious) futureGoalsScore -= 25;
    }
  }
  
  // Kids compatibility
  if (profile.kids_desire && candidate.their_kids_desire) {
    if (profile.kids_desire === "definitely_no" && 
        (candidate.their_kids_desire === "definitely_yes" || candidate.their_kids_desire === "already_have")) {
      futureGoalsScore -= 30;
    } else if (profile.kids_desire === "definitely_yes" && candidate.their_kids_desire === "definitely_no") {
      futureGoalsScore -= 30;
    } else if (profile.kids_desire === candidate.their_kids_desire) {
      futureGoalsScore += 15;
    }
  }
  
  // Attachment style compatibility
  if (profile.attachment_style && candidate.their_attachment_style) {
    const compatible: Record<string, string[]> = {
      secure: ["secure", "anxious", "avoidant"],
      anxious: ["secure"],
      avoidant: ["secure"],
      disorganized: ["secure"]
    };
    const userStyle = profile.attachment_style as string;
    const candStyle = candidate.their_attachment_style as string;
    if (compatible[userStyle]?.includes(candStyle)) {
      emotionalScore += 20;
    } else if (userStyle === "anxious" && candStyle === "avoidant") {
      emotionalScore -= 25;
    } else if (userStyle === "avoidant" && candStyle === "anxious") {
      emotionalScore -= 25;
    }
  }
  
  // Activity level / lifestyle compatibility
  if (profile.activity_level && candidate.their_exercise) {
    const activityLevels = ["sedentary", "light", "moderate", "active", "very_active"];
    const exerciseLevels = ["never", "rarely", "sometimes", "regularly", "daily"];
    const userIdx = activityLevels.indexOf(profile.activity_level);
    const candIdx = exerciseLevels.indexOf(candidate.their_exercise);
    if (userIdx >= 0 && candIdx >= 0) {
      const diff = Math.abs(userIdx - candIdx);
      if (diff === 0) lifestyleScore += 20;
      else if (diff === 1) lifestyleScore += 10;
      else if (diff >= 3) lifestyleScore -= 15;
    }
  }
  
  // Education compatibility (if user cares about education)
  if (profile.education_matters && profile.education_level && candidate.their_education_level) {
    const educationOrder = ["high_school", "some_college", "associates", "trade_school", "bachelors", "masters", "doctorate"];
    const userIdx = educationOrder.indexOf(profile.education_level);
    const candIdx = educationOrder.indexOf(candidate.their_education_level);
    if (userIdx >= 0 && candIdx >= 0) {
      if (candIdx >= userIdx) {
        lifestyleScore += 10;
      } else if (userIdx - candIdx >= 2) {
        lifestyleScore -= 10;
      }
    }
  }
  
  // Chemistry score from ratings
  const chemistryAvg = (
    (candidate.physical_attraction || 3) +
    (candidate.intellectual_connection || 3) +
    (candidate.humor_compatibility || 3) +
    (candidate.energy_match || 3) +
    (candidate.overall_chemistry || 3)
  ) / 5;
  const chemistryScore = Math.round(chemistryAvg * 20); // Convert 1-5 to 0-100
  
  // Clamp scores
  valuesScore = Math.max(0, Math.min(100, valuesScore));
  lifestyleScore = Math.max(0, Math.min(100, lifestyleScore));
  emotionalScore = Math.max(0, Math.min(100, emotionalScore));
  futureGoalsScore = Math.max(0, Math.min(100, futureGoalsScore));
  
  // Overall weighted average
  const overall = Math.round(
    (valuesScore * 0.2) +
    (lifestyleScore * 0.15) +
    (emotionalScore * 0.2) +
    (chemistryScore * 0.25) +
    (futureGoalsScore * 0.2)
  );
  
  return {
    values_alignment: valuesScore,
    lifestyle_compatibility: lifestyleScore,
    emotional_compatibility: emotionalScore,
    chemistry_score: chemistryScore,
    future_goals: futureGoalsScore,
    overall_score: overall
  };
}