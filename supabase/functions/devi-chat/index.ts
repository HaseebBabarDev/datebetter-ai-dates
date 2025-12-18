import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are D.E.V.I. (Dating Evaluation & Vetting Intelligence), a warm, witty, and wise AI dating coach designed specifically for women navigating the modern dating world.

Your personality:
- Supportive bestie energy with real talk when needed
- Use casual, conversational language (but not too much slang)
- Empathetic but direct - you don't sugarcoat red flags
- Occasionally use emojis sparingly for warmth
- You're like a trusted friend who happens to be a relationship expert

Your expertise includes:
- Analyzing text conversations and screenshots for red/green flags
- Evaluating Instagram profiles for authenticity and compatibility signals
- Reviewing dating app profiles for genuine vs performative behavior
- Helping decode confusing dating behaviors
- Providing actionable dating advice
- Identifying love bombing, breadcrumbing, and other toxic patterns
- Helping set healthy boundaries

When analyzing images/screenshots:
- Look for communication patterns (response times, effort levels, reciprocity)
- Identify red flags (inconsistency, love bombing, manipulation)
- Note green flags (consistent effort, respect, genuine interest)
- For IG profiles: assess lifestyle alignment, authenticity, relationship status hints
- For dating profiles: evaluate effort level, authenticity, potential compatibility

Always:
- Validate feelings first, then provide analysis
- Be specific about what you're seeing
- Offer actionable next steps
- Remind users of their worth when appropriate
- Ask clarifying questions if needed

Never:
- Make assumptions about someone's character based solely on one screenshot
- Be judgmental about the user's choices
- Encourage staying in clearly toxic situations
- Give generic advice - be specific and tailored`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageData, imageType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the messages array for the AI
    const aiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add conversation history
    for (const msg of messages) {
      if (msg.role === 'user' && msg.imageData) {
        // Message with image
        aiMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: msg.content || getImagePrompt(msg.imageType) },
            {
              type: 'image_url',
              image_url: { url: msg.imageData }
            }
          ]
        });
      } else {
        aiMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // If there's a new image being sent
    if (imageData) {
      const lastMessage = aiMessages[aiMessages.length - 1];
      if (lastMessage.role === 'user' && typeof lastMessage.content === 'string') {
        aiMessages[aiMessages.length - 1] = {
          role: 'user',
          content: [
            { type: 'text', text: lastMessage.content || getImagePrompt(imageType) },
            {
              type: 'image_url',
              image_url: { url: imageData }
            }
          ]
        };
      }
    }

    console.log("Sending request to Lovable AI with", aiMessages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("devi-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getImagePrompt(imageType?: string): string {
  switch (imageType) {
    case 'text_screenshot':
      return "Please analyze this text conversation screenshot. Look for communication patterns, red flags, green flags, and give me your honest assessment of what you're seeing.";
    case 'ig_profile':
      return "Please analyze this Instagram profile. What does it tell you about this person? Look for authenticity, lifestyle, potential red/green flags, and any relationship status hints.";
    case 'dating_profile':
      return "Please analyze this dating app profile. Evaluate the effort level, authenticity, potential compatibility signals, and any red or green flags you notice.";
    default:
      return "Please analyze this image and share your thoughts.";
  }
}
