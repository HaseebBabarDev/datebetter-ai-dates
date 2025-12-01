import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Format enum values to be human-readable (no underscores, proper casing)
function formatEnumValue(value: string | null | undefined): string {
  if (!value) return "Not specified";
  
  const friendlyNames: Record<string, string> = {
    "definitely_yes": "definitely wants",
    "definitely_no": "definitely doesn't want", 
    "maybe": "is open to",
    "already_have": "already has",
    "no_kids": "no kids",
    "has_young_kids": "has young kids",
    "has_adult_kids": "has adult kids",
    "woman_cis": "cisgender woman",
    "woman_trans": "transgender woman",
    "man_cis": "cisgender man",
    "man_trans": "transgender man",
    "non_binary": "non-binary",
    "gender_fluid": "gender fluid",
    "she_her": "she/her",
    "he_him": "he/him",
    "they_them": "they/them",
    "same_city": "same city",
    "long_distance": "long distance",
    "office_9_5": "9-5 office schedule",
    "remote_flexible": "remote/flexible",
    "shift_work": "shift work",
    "overnight": "overnight shifts",
    "christian_catholic": "Catholic",
    "christian_protestant": "Protestant",
    "christian_other": "Christian (other)",
  };
  
  const lower = value.toLowerCase();
  if (friendlyNames[lower]) return friendlyNames[lower];
  
  // Default: replace underscores with spaces and title case
  return value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

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

    // Build interaction summary and calculate sentiment
    let interactionSummary = "No interactions logged yet.";
    let interactionSentiment = 0;
    let negativeCount = 0;
    let positiveCount = 0;
    let hasCriticalRedFlag = false; // Deal-breakers like infidelity
    
    if (interactions && interactions.length > 0) {
      const interactionDetails = interactions.map((i: any) => 
        `- ${i.interaction_date}: ${i.interaction_type}${i.duration ? ` (${i.duration})` : ''} - Feeling: ${i.overall_feeling}/5${i.gut_feeling ? `, Gut: "${i.gut_feeling}"` : ''}${i.notes ? ` - Notes: "${i.notes}"` : ''}`
      ).join("\n");
      interactionSummary = `${interactions.length} interactions logged:\n${interactionDetails}`;
      
      // Calculate sentiment from interactions
      const negativeGutFeelings = ["sad", "anxious", "confused", "angry", "hurt", "frustrated", "disappointed"];
      const positiveGutFeelings = ["happy", "excited", "hopeful", "content", "loved", "secure"];
      
      // Critical red flags that should tank the score (deal-breakers)
      const criticalRedFlags = ["seeing someone else", "cheating", "cheated", "other woman", "other guy", "married", "has a girlfriend", "has a boyfriend", "lied about", "abusive", "hit me", "threatened"];
      // Serious red flags
      const seriousRedFlags = ["ghosted", "ignored", "blocked", "disappeared", "breadcrumbing", "love bombing"];
      // Moderate red flags
      const moderateRedFlags = ["distant", "cold", "switched up", "hot and cold", "inconsistent", "didn't answer", "didn't respond"];
      
      interactions.forEach((i: any) => {
        const feeling = i.overall_feeling || 3;
        const gut = (i.gut_feeling || "").toLowerCase();
        const notes = (i.notes || "").toLowerCase();
        
        // Check for critical red flags (deal-breakers)
        const hasCritical = criticalRedFlags.some(phrase => notes.includes(phrase));
        const hasSerious = seriousRedFlags.some(phrase => notes.includes(phrase));
        const hasModerate = moderateRedFlags.some(phrase => notes.includes(phrase));
        
        if (hasCritical) {
          hasCriticalRedFlag = true;
          negativeCount++;
          interactionSentiment -= 40; // Massive penalty
        } else if (hasSerious) {
          negativeCount++;
          interactionSentiment -= 25;
        } else if (hasModerate || feeling <= 2 || negativeGutFeelings.includes(gut)) {
          negativeCount++;
          interactionSentiment -= hasModerate ? 15 : (feeling === 1 ? 12 : 8);
        } else if (feeling >= 4 && positiveGutFeelings.includes(gut)) {
          positiveCount++;
          interactionSentiment += 3;
        }
      });
      
      // Cap the sentiment adjustment (no floor for critical flags)
      interactionSentiment = Math.max(hasCriticalRedFlag ? -60 : -45, Math.min(10, interactionSentiment));
    }

    // Calculate base scores from profile data for consistency
    const baseScores = calculateBaseScores(profile, candidate);
    
    // Apply interaction sentiment - full impact for negative, reduced for positive
    const adjustedEmotionalScore = Math.max(5, Math.min(100, baseScores.emotional_compatibility + interactionSentiment));
    
    // For critical red flags, hard cap the overall score at 30 max
    let sentimentAdjustedOverall;
    if (hasCriticalRedFlag) {
      sentimentAdjustedOverall = Math.min(30, Math.max(15, baseScores.overall_score + interactionSentiment));
    } else {
      sentimentAdjustedOverall = Math.max(20, Math.min(100, baseScores.overall_score + interactionSentiment));
    }

    // Build the prompt for AI analysis
    const prompt = `You are D.E.V.I. (Dating Evaluation & Vetting Intelligence), a warm, direct relationship coach helping someone evaluate their dating situation. Analyze compatibility between them and their dating candidate. Always address them as "you" - be conversational, empathetic, but honest.

YOUR PROFILE:
- Location: ${profile.city || "Not specified"}, ${profile.state || ""}, ${profile.country || "Not specified"}
- Relationship Status: ${formatEnumValue(profile.relationship_status)}
- Relationship Goal: ${formatEnumValue(profile.relationship_goal)}
- Religion: ${formatEnumValue(profile.religion)}, Importance: ${profile.faith_importance || 3}/5
- Politics: ${formatEnumValue(profile.politics)}, Importance: ${profile.politics_importance || 3}/5
- Kids Status: ${formatEnumValue(profile.kids_status)}
- Kids Desire: You ${formatEnumValue(profile.kids_desire)} children
- Attachment Style: ${formatEnumValue(profile.attachment_style)}
- Ambition Level: ${profile.ambition_level || 3}/5
- Career Stage: ${formatEnumValue(profile.career_stage)}
- Dealbreakers: ${JSON.stringify(profile.dealbreakers || [])}
- Communication Style: ${formatEnumValue(profile.communication_style)}
- Height: ${profile.height || "Not specified"}
- Body Type: ${formatEnumValue(profile.body_type)}
- Activity Level: ${formatEnumValue(profile.activity_level)}
- Education Level: ${formatEnumValue(profile.education_level)}
- Height Preference for partner: ${profile.height_preference || "No preference"}
- Schedule Flexibility: ${formatEnumValue(profile.schedule_flexibility)}
- Distance Preference: ${formatEnumValue(profile.distance_preference)}

CANDIDATE PROFILE (${candidate.nickname}):
- Name: ${candidate.nickname}
- Location: ${candidate.city || "Not specified"}, ${candidate.country || "Not specified"}
- Distance from you: ${formatEnumValue(candidate.distance_approximation)}
- Relationship Status: ${formatEnumValue(candidate.their_relationship_status)}
- Relationship Goal: ${formatEnumValue(candidate.their_relationship_goal)}
- Religion: ${formatEnumValue(candidate.their_religion)}
- Politics: ${formatEnumValue(candidate.their_politics)}
- Kids Status: ${formatEnumValue(candidate.their_kids_status)}
- Kids Desire: ${candidate.nickname} ${formatEnumValue(candidate.their_kids_desire)} children
- Attachment Style: ${formatEnumValue(candidate.their_attachment_style)}
- Ambition Level: ${candidate.their_ambition_level || "Not specified"}/5
- Career Stage: ${formatEnumValue(candidate.their_career_stage)}
- Education Level: ${formatEnumValue(candidate.their_education_level)}
- Exercise Habits: ${formatEnumValue(candidate.their_exercise)}
- Schedule Flexibility: ${formatEnumValue(candidate.their_schedule_flexibility)}

CHEMISTRY RATINGS (1-5):
- Physical Attraction: ${candidate.physical_attraction || 3}
- Intellectual Connection: ${candidate.intellectual_connection || 3}
- Humor Compatibility: ${candidate.humor_compatibility || 3}
- Energy Match: ${candidate.energy_match || 3}
- Overall Chemistry: ${candidate.overall_chemistry || 3}

INTERACTION HISTORY (most recent first):
${interactionSummary}

INTERACTION ANALYSIS:
- Total negative interactions: ${negativeCount}
- Total positive interactions: ${positiveCount}
- Calculated sentiment adjustment: ${interactionSentiment} points
- CRITICAL RED FLAG DETECTED: ${hasCriticalRedFlag ? "YES - DEAL-BREAKER PRESENT" : "No"}

BASE COMPATIBILITY SCORES (calculated from profile matching):
- Values Alignment: ${baseScores.values_alignment}
- Lifestyle: ${baseScores.lifestyle_compatibility}
- Emotional: ${baseScores.emotional_compatibility} (ADJUSTED TO ${adjustedEmotionalScore} after interactions)
- Chemistry: ${baseScores.chemistry_score}
- Future Goals: ${baseScores.future_goals}
- Base Overall: ${baseScores.overall_score} (HARD CAPPED TO ${sentimentAdjustedOverall} after interactions)

CRITICAL SCORING RULES - YOU MUST FOLLOW THESE:
1. ${hasCriticalRedFlag ? "CRITICAL RED FLAG DETECTED! Score MUST be 30 or below. This is a deal-breaker situation." : ""}
2. The overall_score MUST NOT exceed ${sentimentAdjustedOverall} - this is a hard limit
3. If someone admits to "seeing someone else", is cheating, or shows major disrespect - emotional_compatibility should be 20 or lower
4. Your advice should match the severity of the score - a score under 35 means "walk away" advice
5. Do not sugarcoat concerns when serious red flags are present
6. The emotional_compatibility score should be ${adjustedEmotionalScore} or lower given the interactions

WRITING STYLE FOR ADVICE - IMPORTANT:
- Write like a supportive friend who tells it like it is, not a robot
- Use natural, conversational language - "Look," "Here's the thing," "Real talk," etc.
- Be direct about incompatibilities without being harsh - "This is a fundamental mismatch" not "directly conflicts"
- Use phrases like "you two want different things" instead of technical descriptions
- If kids desires conflict, say something like "${candidate.nickname} wants kids and you don't - that's a big deal that won't change"
- Make advice actionable - "Have the conversation about X before investing more" 
- Show empathy - "I know it's not what you want to hear, but..."
- NEVER use underscores or technical enum values in your output

Consider these factors when adjusting lifestyle scores:
- Distance/location compatibility (same city is best, long distance reduces score if they prefer nearby)
- Schedule flexibility compatibility (remote/flexible pairs well with most, 9-5 office and overnight may conflict)
- Frequent travelers need partners who are understanding of their lifestyle - flexible schedules work best
- Professional athletes have demanding, seasonal schedules - consider this for lifestyle compatibility
- Activity level and lifestyle compatibility

CRITICAL: In all output text (strengths, concerns, advice), use natural human language. Never output values like "definitely_yes" - always write "definitely wants" or similar human phrases.`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are D.E.V.I. (Dating Evaluation & Vetting Intelligence), a warm, direct relationship coach - like a supportive best friend who tells it like it is. Write in natural, conversational language. Never use technical terms, underscores, or robotic phrasing. Use the provided sentiment-adjusted scores as your foundation. NEVER increase the score above the sentiment-adjusted score when there are negative interactions." },
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
                    description: `Overall compatibility score 0-100. MUST NOT exceed ${negativeCount > 0 ? 'the sentiment-adjusted score' : 'base score'} when interactions are negative. Target: ${sentimentAdjustedOverall}` 
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
                    description: "Brief personalized advice addressing the person directly as 'you'"
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

    // ENFORCE SCORE LIMITS: If there are negative interactions, cap the score
    if (negativeCount > 0 && analysis.overall_score > sentimentAdjustedOverall) {
      console.log(`Capping AI score from ${analysis.overall_score} to ${sentimentAdjustedOverall} due to ${negativeCount} negative interactions`);
      analysis.overall_score = sentimentAdjustedOverall;
    }
    
    // Also cap emotional compatibility if there are negative interactions
    if (negativeCount > 0 && analysis.breakdown?.emotional_compatibility > adjustedEmotionalScore) {
      analysis.breakdown.emotional_compatibility = adjustedEmotionalScore;
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
  
  // Relationship status compatibility
  if (profile.relationship_status && candidate.their_relationship_status) {
    const userStatus = profile.relationship_status;
    const candStatus = candidate.their_relationship_status;
    
    // Both single is ideal
    if (userStatus === "single" && candStatus === "single") {
      futureGoalsScore += 15;
    }
    // ENM compatibility
    else if (userStatus === "ethical_non_monogamy" && candStatus === "ethical_non_monogamy") {
      futureGoalsScore += 20;
    }
    // Mismatch: one is married (not ENM) - red flag
    else if ((userStatus === "married" && candStatus !== "ethical_non_monogamy") ||
             (candStatus === "married" && userStatus !== "ethical_non_monogamy")) {
      futureGoalsScore -= 30;
    }
    // Recently divorced - consider with care
    else if (userStatus === "recently_divorced" || candStatus === "recently_divorced") {
      emotionalScore -= 10; // May need time to heal
    }
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
  
  // Distance compatibility
  if (candidate.distance_approximation && profile.distance_preference) {
    const distanceScore: Record<string, number> = {
      same_city: 20,
      regional: 10,
      far: -5,
      long_distance: -15
    };
    const distPref = profile.distance_preference;
    const candDist = candidate.distance_approximation;
    
    // If user is okay with long distance, don't penalize
    if (distPref === "ldr" || distPref === "relocate") {
      lifestyleScore += 10;
    } else {
      lifestyleScore += (distanceScore[candDist] || 0);
    }
  }
  
  // Schedule flexibility compatibility
  if (profile.schedule_flexibility && candidate.their_schedule_flexibility) {
    const flexibleSchedules = ["remote_flexible", "hybrid", "self_employed", "student"];
    const rigidSchedules = ["office_9_5", "shift_work", "on_call", "overnight"];
    const travelSchedules = ["frequent_traveler", "on_call"];
    
    const userFlex = flexibleSchedules.includes(profile.schedule_flexibility);
    const candFlex = flexibleSchedules.includes(candidate.their_schedule_flexibility);
    const userTravels = travelSchedules.includes(profile.schedule_flexibility);
    const candTravels = travelSchedules.includes(candidate.their_schedule_flexibility);
    
    // Both frequent travelers - can understand each other's lifestyle
    if (userTravels && candTravels) {
      lifestyleScore += 15;
    }
    // One travels, one is flexible - good match
    else if ((userTravels && candFlex) || (candTravels && userFlex)) {
      lifestyleScore += 10;
    }
    // One travels, one is rigid - challenging
    else if ((userTravels && !candFlex) || (candTravels && !userFlex)) {
      lifestyleScore -= 10;
    }
    else if (userFlex && candFlex) {
      lifestyleScore += 15; // Both flexible
    } else if (userFlex !== candFlex) {
      lifestyleScore += 5; // One flexible helps
    } else {
      // Both rigid - check if compatible
      if (profile.schedule_flexibility === candidate.their_schedule_flexibility) {
        lifestyleScore += 10; // Same schedule type
      } else if (
        (profile.schedule_flexibility === "overnight" && rigidSchedules.includes(candidate.their_schedule_flexibility)) ||
        (candidate.their_schedule_flexibility === "overnight" && rigidSchedules.includes(profile.schedule_flexibility))
      ) {
        lifestyleScore -= 15; // Conflicting schedules
      }
    }
  }
  
  // Career stage considerations (athletes, entrepreneurs have unique schedules)
  const athleteFlexSchedules = ["remote_flexible", "hybrid", "self_employed", "student"];
  if (profile.career_stage === "athlete" || candidate.their_career_stage === "athlete") {
    // Athletes have demanding schedules but can be compatible with flexible partners
    if ((profile.career_stage === "athlete" && athleteFlexSchedules.includes(candidate.their_schedule_flexibility || "")) ||
        (candidate.their_career_stage === "athlete" && athleteFlexSchedules.includes(profile.schedule_flexibility || ""))) {
      lifestyleScore += 5;
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
  
  // Height preference matching
  if (profile.height_preference && profile.height_preference !== "no_preference" && candidate.height && profile.height) {
    const heightOrder = ["under_5ft", "5ft_5ft3", "5ft4_5ft6", "5ft7_5ft9", "5ft10_6ft", "over_6ft"];
    const userHeightIdx = heightOrder.indexOf(profile.height);
    const candHeightIdx = heightOrder.indexOf(candidate.height);
    
    if (userHeightIdx >= 0 && candHeightIdx >= 0) {
      const heightMatch = 
        (profile.height_preference === "taller" && candHeightIdx > userHeightIdx) ||
        (profile.height_preference === "shorter" && candHeightIdx < userHeightIdx) ||
        (profile.height_preference === "similar" && Math.abs(candHeightIdx - userHeightIdx) <= 1);
      
      if (heightMatch) {
        lifestyleScore += 15;
      } else if (profile.height_preference === "taller" && candHeightIdx < userHeightIdx) {
        lifestyleScore -= 10;
      } else if (profile.height_preference === "shorter" && candHeightIdx > userHeightIdx) {
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