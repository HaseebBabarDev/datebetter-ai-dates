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
      .order("interaction_date", { ascending: false })
      .limit(50);

    // Fetch D.E.V.I. conversations about this candidate
    const { data: conversations } = await supabase
      .from("devi_conversations")
      .select("id, title")
      .eq("candidate_id", candidateId)
      .eq("user_id", user.id);

    // Fetch messages from those conversations
    let deviMessages: any[] = [];
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      const { data: messages } = await supabase
        .from("devi_messages")
        .select("content, role, created_at")
        .in("conversation_id", conversationIds)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      
      deviMessages = messages || [];
    }

    // Require at least some data to analyze
    const hasInteractions = interactions && interactions.length > 0;
    const hasDeviChats = deviMessages.length > 0;
    
    if (!hasInteractions && !hasDeviChats) {
      return new Response(
        JSON.stringify({ error: "Please log interactions or chat with D.E.V.I. about this person before analyzing pros/cons" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context for AI analysis
    const interactionDetails = (interactions || []).map((i: any) => ({
      date: i.interaction_date,
      type: i.interaction_type,
      duration: i.duration,
      feeling: i.overall_feeling,
      gut_feeling: i.gut_feeling,
      notes: i.notes,
      who_initiated: i.who_initiated,
    }));

    // Extract relevant D.E.V.I. conversation snippets
    const deviContext = deviMessages.map((m: any) => ({
      role: m.role,
      content: m.content.substring(0, 500), // Limit content length
    }));

    const prompt = `Analyze this dating candidate and create a list of PROS (positive qualities, things you like about them) and CONS (concerns, doubts, things that bother you) based on the user's interactions and their conversations with D.E.V.I. (their AI dating coach).

CANDIDATE INFO:
- Nickname: ${candidate.nickname}
- Age: ${candidate.age || "Unknown"}
- Status: ${candidate.status || "Unknown"}
- Relationship Goal: ${candidate.their_relationship_goal || "Not specified"}
- Notes: ${candidate.notes || "None"}

INTERACTION HISTORY (${interactionDetails.length} interactions):
${JSON.stringify(interactionDetails, null, 2)}

D.E.V.I. CONVERSATION EXCERPTS (${deviContext.length} messages):
${JSON.stringify(deviContext, null, 2)}

Based on all this information, identify:

1. PROS: Positive qualities about this person - things the user seems to appreciate, enjoy, or value about them. Look for:
   - Personality traits they like
   - How they make the user feel
   - Shared interests or values
   - Good behaviors observed in interactions
   - Things the user has expressed positivity about

2. CONS: Concerns or negatives about this person - things that worry the user, bother them, or create doubt. Look for:
   - Behaviors that concern the user
   - Incompatibilities mentioned
   - Things that make the user uncomfortable
   - Doubts or hesitations expressed
   - Potential issues raised in D.E.V.I. conversations

Keep each pro/con as a SHORT phrase (3-7 words). Focus on specific, actionable observations rather than vague statements. Write from the user's perspective (e.g., "Makes me laugh" not "Has humor").

ANTI-RACISM & ANTI-HOMOPHOBIA GUARDRAIL: NEVER generate pros or cons based on someone's race, ethnicity, sexual orientation, or gender identity. These are never pros or cons. Focus strictly on behaviors, compatibility, and character. NEVER use slurs of any kind.`;

    console.log("Calling AI gateway for pros/cons detection...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are D.E.V.I. (Dating Evaluation & Vetting Intelligence), helping users objectively evaluate dating candidates by identifying pros and cons based on their experiences and conversations. NEVER use racial or homophobic slurs or generate biased pros/cons based on identity." },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "detect_pros_cons",
              description: "Identify pros and cons about a dating candidate",
              parameters: {
                type: "object",
                properties: {
                  pros: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of pros (positive qualities). Each should be a short phrase like 'Great sense of humor' or 'Respects my time'"
                  },
                  cons: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of cons (concerns/negatives). Each should be a short phrase like 'Lives far away' or 'Rarely initiates contact'"
                  }
                },
                required: ["pros", "cons"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "detect_pros_cons" } }
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
    console.log("AI response received:", JSON.stringify(aiData));
    
    let result = { pros: [], cons: [] };
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
        console.log("Parsed pros/cons:", result);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Merge with existing pros/cons (avoid duplicates)
    const existingPros = (candidate.pros as string[]) || [];
    const existingCons = (candidate.cons as string[]) || [];
    
    const mergedPros = [...new Set([...existingPros, ...(result.pros || [])])];
    const mergedCons = [...new Set([...existingCons, ...(result.cons || [])])];

    // Update candidate with detected pros/cons
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        pros: mergedPros,
        cons: mergedCons,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return new Response(JSON.stringify({ pros: mergedPros, cons: mergedCons }), {
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
