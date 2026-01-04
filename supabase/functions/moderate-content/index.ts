import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, type } = await req.json();

    const textToModerate = title ? `${title}\n\n${content}` : content;

    if (!textToModerate || textToModerate.trim().length === 0) {
      return new Response(
        JSON.stringify({ approved: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI for moderation
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      console.log("No LOVABLE_API_KEY found, approving content by default");
      return new Response(
        JSON.stringify({ approved: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const moderationPrompt = `You are a content moderator for a supportive women's dating community app. 
    
Your task is to determine if the following ${type} is appropriate for the community.

APPROVE content that:
- Shares dating experiences, advice, or questions
- Discusses relationship red flags or warnings
- Celebrates relationship successes
- Discusses self-care, healing, or emotional wellbeing
- Is supportive and constructive
- Uses mature but respectful language
- Shares personal struggles with mental health, abuse, or difficult situations while SEEKING SUPPORT (this is a safe space for people to share their experiences and ask for help)
- Discusses experiences with domestic violence, emotional abuse, or toxic relationships while seeking advice or healing

REJECT content that:
- Contains hate speech, harassment, or personal attacks
- Includes explicit sexual content or solicitation
- Contains personal identifying information (names, addresses, phone numbers)
- ENCOURAGES or PROMOTES violence or self-harm to OTHERS (not sharing personal struggles)
- Is spam or promotional
- Contains discriminatory language against any group
- Provides instructions or methods for harming oneself or others

IMPORTANT: Content where someone is seeking help, support, or sharing their own struggles with abuse, mental health issues, or difficult situations should be APPROVED. This is a supportive community where people come to heal and seek advice.

Content to moderate:
"""
${textToModerate}
"""

Respond in JSON format only:
{
  "approved": true/false,
  "reason": "Brief explanation if rejected, null if approved"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: moderationPrompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("Moderation API error:", await response.text());
      // Fail open - approve if moderation fails
      return new Response(
        JSON.stringify({ approved: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const moderationResult = JSON.parse(data.choices[0].message.content);

    console.log("Moderation result:", moderationResult);

    return new Response(
      JSON.stringify(moderationResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in moderate-content:", error);
    // Fail open - approve if there's an error
    return new Response(
      JSON.stringify({ approved: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});