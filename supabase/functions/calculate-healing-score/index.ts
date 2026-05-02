import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PastRelationship {
  id: string;
  label: string;
  duration: string;
  traumas: string[];
  notes: string;
  endReason: string;
}

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
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing healing score for user:", user.id);

    const { triggerType = "assessment", dailyFeeling } = await req.json();

    // Fetch user profile for healing assessment data AND past relationship data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        ex_contact_status, 
        over_ex_level, 
        attachment_to_past, 
        past_relationship_traumas, 
        relationship_trauma_notes, 
        healing_score,
        attachment_style,
        longest_relationship,
        time_since_last_relationship
      `)
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

    // Parse past relationships data
    const pastRelationships: PastRelationship[] = Array.isArray(profile.past_relationship_traumas) 
      ? profile.past_relationship_traumas 
      : [];

    // Build comprehensive trauma summary
    const allTraumas: string[] = [];
    const relationshipSummaries: string[] = [];
    
    pastRelationships.forEach((rel, index) => {
      if (rel.traumas && rel.traumas.length > 0) {
        allTraumas.push(...rel.traumas);
      }
      const summary = [
        rel.label || `Relationship ${index + 1}`,
        rel.duration ? `(${rel.duration.replace(/_/g, ' ')})` : '',
        rel.endReason ? `ended: ${rel.endReason.replace(/_/g, ' ')}` : '',
        rel.traumas?.length ? `traumas: ${rel.traumas.join(', ')}` : '',
        rel.notes ? `notes: "${rel.notes}"` : ''
      ].filter(Boolean).join(' - ');
      relationshipSummaries.push(summary);
    });

    const uniqueTraumas = [...new Set(allTraumas)];
    const hasNoneApply = uniqueTraumas.includes("None of these apply");
    const significantTraumas = uniqueTraumas.filter(t => t !== "None of these apply");

    // Map ex contact status to readable text
    const exContactLabels: Record<string, string> = {
      "no_contact": "No contact at all",
      "occasional": "Occasional contact (rare texts/calls)",
      "regular": "Regular contact (friends)",
      "frequent": "Frequent contact (talk often)",
      "still_connected": "Still emotionally connected",
      "not_applicable": "No significant exes",
    };

  // Map over_ex_level to description (0=still attached, 100=completely over)
  const getOverExDescription = (level: number | null) => {
    if (level === null) return "not specified";
    if (level <= 20) return `${level}% - Still deeply attached (very unhealthy for dating)`;
    if (level <= 40) return `${level}% - Working through it (needs more healing)`;
    if (level <= 60) return `${level}% - Making progress (getting there)`;
    if (level <= 80) return `${level}% - Mostly moved on (good progress)`;
    return `${level}% - Completely over them (healthy and ready)`;
  };

  // Map attachment_to_past to description (0=detached/healthy, 100=very attached/unhealthy)
  // IMPORTANT: Lower values = healthier (more detached from toxic patterns)
  const getAttachmentDescription = (level: number | null) => {
    if (level === null) return "not specified";
    if (level <= 20) return `${level}% - Very detached from past patterns (HEALTHY)`;
    if (level <= 40) return `${level}% - Mostly detached (GOOD)`;
    if (level <= 60) return `${level}% - Neutral (moderate attachment)`;
    if (level <= 80) return `${level}% - Somewhat attached to past patterns (CONCERNING)`;
    return `${level}% - Very attached to past patterns (UNHEALTHY - needs work)`;
  };

    let healingScore = 50; // default fallback
    let aiInsights = "";

    if (lovableApiKey) {
      try {
        // Build the comprehensive prompt for AI-driven scoring
        const scoringPrompt = `You are D.E.V.I., an expert AI dating coach specializing in relationship healing and readiness assessment.

Analyze the following user data and calculate a HEALING SCORE from 0-98 (MAXIMUM 98 - no one is ever 100% healed), where:
- 0-40: Significant healing work needed before dating
- 41-60: Making progress but should proceed cautiously
- 61-75: Good progress, can date while continuing to heal
- 76-90: Ready to date with healthy awareness
- 91-98: Fully healed and emotionally available (98 is the maximum possible)

## HEALING ASSESSMENT DATA:

**Ex Contact Status:** ${exContactLabels[profile.ex_contact_status] || profile.ex_contact_status || "Not specified"}

**How Over Their Most Recent Ex:** ${getOverExDescription(profile.over_ex_level)}

**Attachment to Past Relationship Patterns:** ${getAttachmentDescription(profile.attachment_to_past)}

**Attachment Style:** ${profile.attachment_style || "Not specified"}

**Longest Relationship:** ${profile.longest_relationship?.replace(/_/g, ' ') || "Not specified"}

**Time Since Last Relationship:** ${profile.time_since_last_relationship?.replace(/_/g, ' ') || "Not specified"}

## PAST RELATIONSHIP HISTORY:

${pastRelationships.length > 0 ? `
**Number of Past Relationships Documented:** ${pastRelationships.length}

**Relationship Details:**
${relationshipSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**All Trauma Types Experienced:** ${significantTraumas.length > 0 ? significantTraumas.join(', ') : (hasNoneApply ? 'None reported' : 'Not specified')}
` : 'No past relationships documented'}

**General Reflections:** ${profile.relationship_trauma_notes || "None provided"}

${dailyFeeling ? `**Today's Feeling:** "${dailyFeeling}"` : ''}

## SCORING CRITERIA (CRITICAL - READ CAREFULLY):

The score should INVERSELY relate to negative indicators:
1. **Ex Contact (Weight: 20%)** 
   - "No contact at all" or "No significant exes" = HIGH score (16-20 pts)
   - "Frequent contact" or "Still connected" = LOW score (0-5 pts)
   
2. **Over Ex Level (Weight: 25%)** - This is a 0-100 scale
   - HIGHER percentage = MORE healed = HIGHER score
   - 90-100% = add 22-25 pts, 60-80% = add 15-20 pts, 20-40% = add 5-10 pts, 0-20% = add 0-5 pts
   
3. **Attachment to Past Patterns (Weight: 20%)** - This is a 0-100 scale where LOWER = healthier
   - 0-20% (detached) = HIGH score (16-20 pts)
   - 80-100% (very attached) = LOW score (0-5 pts)
   
4. **Trauma History (Weight: 20%)**
   - More severe/numerous traumas = LOWER score
   - Having awareness and working through them is positive
   
5. **Relationship Patterns (Weight: 15%)**

## RESPONSE FORMAT:

You MUST respond with ONLY a valid JSON object in this exact format:
{
  "score": <number between 0-100>,
  "insight": "<2-3 sentence personalized insight about their healing journey, be warm and supportive>"
}

Do not include any other text, markdown, or explanation outside the JSON.`;

        console.log("Calling AI for healing score calculation...");

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a JSON-only response bot. Always respond with valid JSON." },
              { role: "user", content: scoringPrompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const rawContent = aiData.choices?.[0]?.message?.content || "";
          console.log("AI raw response:", rawContent);

          // Parse the JSON response
          try {
            // Clean the response - remove markdown code blocks if present
            let cleanContent = rawContent.trim();
            if (cleanContent.startsWith("```json")) {
              cleanContent = cleanContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
            } else if (cleanContent.startsWith("```")) {
              cleanContent = cleanContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
            }

            const parsed = JSON.parse(cleanContent);
            // Cap at 98% - no one is 100% healed
            healingScore = Math.max(0, Math.min(98, Math.round(parsed.score)));
            aiInsights = parsed.insight || "";
            console.log("AI calculated score:", healingScore);
          } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            // Fall back to formula-based calculation
            healingScore = calculateFallbackScore(profile, significantTraumas.length);
          }
        } else {
          console.error("AI API error:", await aiResponse.text());
          healingScore = calculateFallbackScore(profile, significantTraumas.length);
        }
      } catch (aiError) {
        console.error("AI calculation error:", aiError);
        healingScore = calculateFallbackScore(profile, significantTraumas.length);
      }
    } else {
      console.log("No Lovable API key, using fallback calculation");
      healingScore = calculateFallbackScore(profile, significantTraumas.length);
    }

    // Generate fallback insight if AI didn't provide one
    if (!aiInsights) {
      if (healingScore >= 75) {
        aiInsights = "You're showing strong emotional readiness! Your self-awareness and healing work are paying off. You're in a good place to date with confidence.";
      } else if (healingScore >= 50) {
        aiInsights = "You're making meaningful progress on your healing journey. Remember, it's okay to date while still working through some things — just stay mindful of your patterns and needs.";
      } else {
        aiInsights = "Your healing journey is still unfolding, and that's completely okay. Consider focusing on yourself for now, and know that D.E.V.I. is here to support you every step of the way.";
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

    console.log("Healing score calculated successfully:", { healingScore, previousScore, scoreChange });

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

// Fallback formula-based calculation
function calculateFallbackScore(profile: any, traumaCount: number): number {
  let baseScore = 50;

  // Ex contact status impact (0-20 points)
  const exContactScores: Record<string, number> = {
    "no_contact": 20,
    "occasional": 15,
    "regular": 10,
    "frequent": 5,
    "still_connected": 0,
    "not_applicable": 18,
  };
  baseScore += exContactScores[profile.ex_contact_status || "not_applicable"] || 10;

  // Over ex level (0-25 points)
  const overExScore = Math.round((profile.over_ex_level || 50) * 0.25);
  baseScore += overExScore;

  // Attachment to past (inverse) (0-20 points)
  const attachmentScore = Math.round((100 - (profile.attachment_to_past || 50)) * 0.2);
  baseScore += attachmentScore;

  // Trauma impact (-15 to +5)
  if (traumaCount === 0) {
    baseScore += 5;
  } else if (traumaCount <= 2) {
    baseScore += 0;
  } else if (traumaCount <= 5) {
    baseScore -= 5;
  } else {
    baseScore -= 15;
  }

  // Cap at 98% - no one is 100% healed
  return Math.max(0, Math.min(98, baseScore));
}