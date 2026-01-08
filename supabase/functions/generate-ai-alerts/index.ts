import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Candidate {
  id: string;
  nickname: string;
  status: string | null;
  compatibility_score: number | null;
  red_flags: unknown[] | null;
  green_flags: unknown[] | null;
  notes: string | null;
  their_attachment_style: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Interaction {
  id: string;
  candidate_id: string;
  interaction_type: string;
  interaction_date: string | null;
  notes: string | null;
  overall_feeling: number | null;
  who_initiated: string | null;
}

interface Profile {
  attachment_style: string | null;
  relationship_goal: string | null;
  dealbreakers: unknown[] | null;
  dating_patterns: unknown | null;
  pattern_recognition: unknown | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Fetch user data
    const [profileRes, candidatesRes, interactionsRes, adviceRes] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("user_id", user.id).single(),
      supabaseClient.from("candidates").select("*").eq("user_id", user.id),
      supabaseClient.from("interactions").select("*").eq("user_id", user.id).order("interaction_date", { ascending: false }).limit(100),
      supabaseClient.from("advice_tracking").select("*").eq("user_id", user.id),
    ]);

    const profile: Profile | null = profileRes.data;
    const candidates: Candidate[] = candidatesRes.data || [];
    const interactions: Interaction[] = interactionsRes.data || [];
    const adviceTracking = adviceRes.data || [];

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ 
        blindSpotAlerts: [], 
        predictiveAlerts: [],
        lastGenerated: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context for AI analysis
    const activeCandidates = candidates.filter(c => c.status !== "archived");
    const archivedCandidates = candidates.filter(c => c.status === "archived");
    
    // Calculate patterns
    const candidateData = activeCandidates.map(c => {
      const candidateInteractions = interactions.filter(i => i.candidate_id === c.id);
      const avgFeeling = candidateInteractions.length > 0 
        ? candidateInteractions.reduce((sum, i) => sum + (i.overall_feeling || 3), 0) / candidateInteractions.length
        : null;
      const userInitiated = candidateInteractions.filter(i => i.who_initiated === "me").length;
      const theyInitiated = candidateInteractions.filter(i => i.who_initiated === "them").length;
      
      return {
        nickname: c.nickname,
        status: c.status,
        compatibility: c.compatibility_score,
        redFlagCount: Array.isArray(c.red_flags) ? c.red_flags.length : 0,
        redFlags: Array.isArray(c.red_flags) ? c.red_flags.slice(0, 5) : [],
        greenFlagCount: Array.isArray(c.green_flags) ? c.green_flags.length : 0,
        theirAttachmentStyle: c.their_attachment_style,
        interactionCount: candidateInteractions.length,
        avgFeeling: avgFeeling ? avgFeeling.toFixed(1) : null,
        initiationBalance: { user: userInitiated, them: theyInitiated },
        hasIntimacy: candidateInteractions.some(i => i.interaction_type === "intimate"),
        notes: c.notes?.slice(0, 200),
        daysActive: c.created_at ? Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null,
      };
    });

    const archivedSummary = archivedCandidates.map(c => ({
      redFlags: Array.isArray(c.red_flags) ? c.red_flags.slice(0, 3) : [],
      theirAttachmentStyle: c.their_attachment_style,
      compatibility: c.compatibility_score,
    }));

    const adviceStats = {
      total: adviceTracking.length,
      accepted: adviceTracking.filter(a => a.response === "accepted").length,
      declined: adviceTracking.filter(a => a.response === "declined").length,
    };

    const systemPrompt = `You are D.E.V.I., an AI dating coach specialized in helping users recognize blind spots and predict relationship patterns.

Your job is to analyze the user's dating data and generate TWO types of alerts:

1. BLIND SPOT ALERTS: Things the user might not be seeing clearly about their dating patterns, including:
   - Repeating past relationship mistakes (dating similar personality types that didn't work before)
   - Ignoring red flags they've already noted but continue engaging
   - Attachment pattern triggers (anxious user with avoidant partner, etc.)
   - Over-investing in low-compatibility matches
   - Under-appreciating high-compatibility matches
   - Initiation imbalances (always chasing or always being chased)

2. PREDICTIVE PATTERN ALERTS: Based on past patterns, predict likely future issues:
   - If a current situation mirrors a past failed relationship
   - If behavior patterns suggest an upcoming issue (love bombing → ghosting cycle)
   - If the user tends to ignore advice in specific situations
   - Warning signs based on timeline patterns (too fast, too slow, stalling)

Be specific, compassionate but direct. Reference specific candidates by nickname when relevant.
Each alert should have:
- type: "blind_spot" or "predictive"
- severity: "info" | "warning" | "urgent"
- title: Short, punchy headline (max 8 words)
- message: Specific insight with actionable advice (2-3 sentences max)
- candidateNickname: (optional) If alert relates to specific candidate

Return 2-4 most important alerts total. Quality over quantity.
If there's genuinely nothing concerning, return empty arrays.`;

    const userPrompt = `Analyze this user's dating data for blind spots and predictive patterns:

USER PROFILE:
- Attachment Style: ${profile?.attachment_style || "Unknown"}
- Relationship Goal: ${profile?.relationship_goal || "Unknown"}
- Known Dealbreakers: ${JSON.stringify(profile?.dealbreakers || [])}
- Self-identified Patterns: ${JSON.stringify(profile?.dating_patterns || {})}

ACTIVE CANDIDATES (${candidateData.length}):
${JSON.stringify(candidateData, null, 2)}

ARCHIVED RELATIONSHIPS SUMMARY (${archivedSummary.length} past):
${JSON.stringify(archivedSummary, null, 2)}

ADVICE RESPONSE STATS:
${JSON.stringify(adviceStats)}

Generate blind spot and predictive alerts based on this data.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_alerts",
              description: "Generate blind spot and predictive pattern alerts",
              parameters: {
                type: "object",
                properties: {
                  blindSpotAlerts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        severity: { type: "string", enum: ["info", "warning", "urgent"] },
                        title: { type: "string" },
                        message: { type: "string" },
                        candidateNickname: { type: "string" },
                      },
                      required: ["severity", "title", "message"],
                    },
                  },
                  predictiveAlerts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        severity: { type: "string", enum: ["info", "warning", "urgent"] },
                        title: { type: "string" },
                        message: { type: "string" },
                        candidateNickname: { type: "string" },
                      },
                      required: ["severity", "title", "message"],
                    },
                  },
                },
                required: ["blindSpotAlerts", "predictiveAlerts"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_alerts" } },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    let alerts = { blindSpotAlerts: [], predictiveAlerts: [] };

    // Parse tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        alerts = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Map candidate nicknames to IDs for navigation
    const nicknameToId: Record<string, string> = {};
    candidates.forEach(c => {
      nicknameToId[c.nickname.toLowerCase()] = c.id;
    });

    const enrichAlert = (alert: any) => ({
      ...alert,
      candidateId: alert.candidateNickname 
        ? nicknameToId[alert.candidateNickname.toLowerCase()] 
        : undefined,
    });

    return new Response(JSON.stringify({
      blindSpotAlerts: (alerts.blindSpotAlerts || []).map(enrichAlert),
      predictiveAlerts: (alerts.predictiveAlerts || []).map(enrichAlert),
      lastGenerated: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-ai-alerts error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
