import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const buildSystemPrompt = (userProfile: any, candidateProfile: any, interactions: any[]) => {
  const userContext = userProfile ? `
USER PROFILE (the person you're coaching):
- Name: ${userProfile.name || 'Not provided'}
- Age: ${userProfile.birth_date ? calculateAge(userProfile.birth_date) : 'Not provided'}
- Location: ${[userProfile.city, userProfile.state, userProfile.country].filter(Boolean).join(', ') || 'Not provided'}
- Relationship Goal: ${formatEnum(userProfile.relationship_goal)}
- Attachment Style: ${formatEnum(userProfile.attachment_style)}
- Communication Style: ${formatEnum(userProfile.communication_style)}
- Kids Status: ${formatEnum(userProfile.kids_status)} | Desire: ${formatEnum(userProfile.kids_desire)}
- Religion: ${formatEnum(userProfile.religion)} (Importance: ${userProfile.faith_importance || 'N/A'}/10)
- Politics: ${formatEnum(userProfile.politics)} (Importance: ${userProfile.politics_importance || 'N/A'}/10)
- Red Flag Sensitivity: ${userProfile.red_flag_sensitivity || 'N/A'}/10
- Love Bombing Sensitivity: ${userProfile.love_bombing_sensitivity || 'N/A'}/10
- Boundary Strength: ${userProfile.boundary_strength || 'N/A'}/10
- Dealbreakers: ${formatArray(userProfile.dealbreakers)}
- Dating Patterns to Watch: ${formatArray(userProfile.dating_patterns)}
- Past Trauma Experiences: ${formatArray(userProfile.trauma_experiences)}
` : '';

  const candidateContext = candidateProfile ? `
CANDIDATE PROFILE (the person they're dating):
- Nickname: ${candidateProfile.nickname}
- Age: ${candidateProfile.age || 'Unknown'}
- Gender: ${formatEnum(candidateProfile.gender_identity)}
- Location: ${[candidateProfile.city, candidateProfile.country].filter(Boolean).join(', ') || 'Unknown'}
- Met Via: ${candidateProfile.met_via || 'Unknown'}${candidateProfile.met_app ? ` (${candidateProfile.met_app})` : ''}
- Status: ${formatEnum(candidateProfile.status)}
- Their Relationship Goal: ${formatEnum(candidateProfile.their_relationship_goal)}
- Their Relationship Status: ${formatEnum(candidateProfile.their_relationship_status)}
- Their Attachment Style: ${formatEnum(candidateProfile.their_attachment_style)}
- Their Religion: ${formatEnum(candidateProfile.their_religion)}
- Their Politics: ${formatEnum(candidateProfile.their_politics)}
- Their Kids Status: ${formatEnum(candidateProfile.their_kids_status)} | Desire: ${formatEnum(candidateProfile.their_kids_desire)}
- Their Career Stage: ${candidateProfile.their_career_stage || 'Unknown'}
- Their Education: ${candidateProfile.their_education_level || 'Unknown'}
- Their Social Style: ${candidateProfile.their_social_style || 'Unknown'}
- Compatibility Score: ${candidateProfile.compatibility_score || 'Not calculated'}%
- Red Flags Noted: ${formatArray(candidateProfile.red_flags)}
- Green Flags Noted: ${formatArray(candidateProfile.green_flags)}
- Notes: ${candidateProfile.notes || 'None'}
- Chemistry Ratings: Physical ${candidateProfile.physical_attraction}/5, Intellectual ${candidateProfile.intellectual_connection}/5, Humor ${candidateProfile.humor_compatibility}/5, Energy ${candidateProfile.energy_match}/5
` : '';

  const interactionContext = interactions && interactions.length > 0 ? `
INTERACTION HISTORY (most recent first):
${interactions.slice(0, 10).map(i => 
  `- ${i.interaction_date}: ${formatEnum(i.interaction_type)}${i.who_initiated ? ` (${i.who_initiated} initiated)` : ''}${i.overall_feeling ? ` - Felt: ${i.overall_feeling}/5` : ''}${i.gut_feeling ? ` - Gut: "${i.gut_feeling}"` : ''}${i.notes ? ` - Notes: "${i.notes}"` : ''}`
).join('\n')}
` : '';

  return `You are D.E.V.I. (Dating Evaluation & Vetting Intelligence), a warm, witty, and wise AI dating coach designed specifically for women navigating the modern dating world.

${userContext}
${candidateContext}
${interactionContext}

CRITICAL INSTRUCTIONS:
- You have full context about this user and the person they're dating
- Give PERSONALIZED advice based on their specific situation, profiles, and interaction history
- Reference specific details from their profiles when relevant
- Consider their attachment styles, dealbreakers, and past patterns
- Note compatibility strengths and potential issues based on their data
- Track patterns in the interaction history (who initiates more, feeling trends, etc.)
- Be aware of their stated red flag sensitivity when evaluating situations

Your personality:
- Supportive bestie energy with real talk when needed
- Use casual, conversational language (but not too much slang)
- Empathetic but direct - you don't sugarcoat red flags
- Occasionally use emojis sparingly for warmth
- Reference their specific situation, not generic dating advice

Your expertise includes:
- Analyzing text conversations and screenshots for red/green flags
- Evaluating Instagram profiles for authenticity and compatibility signals
- Reviewing dating app profiles for genuine vs performative behavior
- Helping decode confusing dating behaviors
- Providing actionable, personalized dating advice
- Identifying love bombing, breadcrumbing, and other toxic patterns
- Helping set healthy boundaries based on their stated boundary strength

When analyzing images/screenshots:
- Look for communication patterns (response times, effort levels, reciprocity)
- Identify red flags (inconsistency, love bombing, manipulation)
- Note green flags (consistent effort, respect, genuine interest)
- For IG profiles: assess lifestyle alignment, authenticity, relationship status hints
- For dating profiles: evaluate effort level, authenticity, potential compatibility

Always:
- Reference their specific profile data and history
- Validate feelings first, then provide analysis
- Be specific about what you're seeing
- Offer actionable next steps tailored to their situation
- Consider their attachment style when giving advice
- Remind users of their worth when appropriate

Never:
- Give generic advice - always be specific to their situation
- Make assumptions without considering their stated preferences
- Be judgmental about the user's choices
- Encourage staying in clearly toxic situations
- Ignore their stated dealbreakers or boundaries`;
};

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatEnum(value: string | null | undefined): string {
  if (!value) return 'Not specified';
  return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatArray(arr: any): string {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return 'None noted';
  return arr.join(', ');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageData, imageType, userProfile, candidateProfile, interactions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build personalized system prompt
    const systemPrompt = buildSystemPrompt(userProfile, candidateProfile, interactions);

    // Build the messages array for the AI
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
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
    console.log("User profile:", userProfile?.name || 'Anonymous');
    console.log("Candidate:", candidateProfile?.nickname || 'None');
    console.log("Interactions count:", interactions?.length || 0);

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
      return "Please analyze this text conversation screenshot. Based on what you know about me and this person, look for communication patterns, red flags, green flags, and give me your honest assessment.";
    case 'ig_profile':
      return "Please analyze this Instagram profile. Based on my preferences and dealbreakers, what does it tell you about this person? Look for authenticity, lifestyle alignment with me, and any red or green flags.";
    case 'dating_profile':
      return "Please analyze this dating app profile. Based on what I'm looking for, evaluate the compatibility potential, authenticity, and any concerns.";
    default:
      return "Please analyze this image and share your thoughts based on what you know about my situation.";
  }
}
