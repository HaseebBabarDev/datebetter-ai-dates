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
- Intimacy Comfort: ${userProfile.intimacy_comfort || 'Not specified'}
- Requires Exclusivity Before Intimacy: ${userProfile.exclusivity_before_intimacy === true ? 'Yes' : userProfile.exclusivity_before_intimacy === false ? 'No' : 'Not specified'}
- Post-Intimacy Tendency: ${userProfile.post_intimacy_tendency || 'Not specified'}
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
- First Intimacy Date: ${candidateProfile.first_intimacy_date || 'Has not occurred'}
` : '';

  // Check intimacy status and user's relationship goals
  const intimacyNotOccurred = candidateProfile && !candidateProfile.first_intimacy_date;
  const intimacyHasOccurred = candidateProfile && candidateProfile.first_intimacy_date;
  const userValuesExclusivity = userProfile?.exclusivity_before_intimacy === true;
  const intimacyComfort = userProfile?.intimacy_comfort;
  const userGoal = userProfile?.relationship_goal;
  const isCasualGoal = userGoal === 'casual' || userGoal === 'situationship';
  
  // Check if this is a female user dating a male candidate (for intimacy pacing advice)
  const femaleGenders = ['woman_cis', 'woman_trans'];
  const maleGenders = ['man_cis', 'man_trans'];
  const isFemaleUserMaleCandidate = femaleGenders.includes(userProfile?.gender_identity || '') && 
                                     maleGenders.includes(candidateProfile?.gender_identity || '');
  
  let intimacyGuidance = '';
  
  if (isCasualGoal && intimacyHasOccurred) {
    // Casual/situationship AND intimacy has happened - remind about emotional protection
    intimacyGuidance = `
CASUAL INTIMACY GUIDANCE (user wants ${userGoal} and intimacy HAS occurred):
When discussions about feelings, the relationship, or this person come up:
- Gently remind them to check in with themselves: Are their expectations still aligned with what they signed up for?
- Oxytocin released during sex creates bonding feelings - this is BIOLOGY, not necessarily real connection. Be aware of this.
- Watch for signs they might be "catching feelings" beyond what they wanted - increased jealousy, wanting more time, feeling hurt by their dating others.
- If they're starting to want more, that's valid - but encourage honest conversation with themselves first: Is this person actually relationship material, or just familiar?
- Remind them: sex doesn't change someone's intentions. If they wanted casual, they likely still want casual.
- Encourage maintaining boundaries: keeping other options open, not over-investing emotionally, staying grounded in reality.
- It's okay to want casual - just protect your heart by keeping expectations realistic.
- Frame supportively, not judgmentally. It's about self-awareness and emotional protection.
`;
  } else if (isCasualGoal && intimacyNotOccurred) {
    // Casual/situationship but intimacy hasn't happened yet
    intimacyGuidance = `
CASUAL INTIMACY GUIDANCE (user wants ${userGoal}, intimacy has NOT occurred yet):
If intimacy comes up:
- Since they want something casual, physical intimacy may be fine - but remind them to stay self-aware.
- Oxytocin from sex can create unexpected attachment. Know this going in so you're not caught off guard.
- Ask themselves: Can I handle this staying casual? Am I okay if feelings develop and they don't reciprocate?
- Keep expectations grounded in reality - casual means casual.
`;
  } else if (intimacyNotOccurred && isFemaleUserMaleCandidate) {
    // Serious relationship goal, female user with male candidate, intimacy hasn't happened
    intimacyGuidance = `
INTIMACY PACING GUIDANCE (female user with male candidate, intimacy has NOT occurred):
When the topic of physical intimacy or sex comes up naturally, gently encourage pacing:
- Remind them that delaying intimacy can actually strengthen the bond. Here's why:
- Men bond through INVESTMENT, not sex. Vasopressin (the male bonding hormone) is released when he invests time, effort, and emotional energy - not during sex.
- For women, oxytocin released during sex creates attachment. But for him? Mostly dopamine (pleasure, novelty) - which fades.
- The goal isn't to "withhold" - it's to give him time to invest and bond BEFORE the dopamine hit of sex.
- If he's genuinely interested, waiting won't push him away. If it does, that tells you something important.
${userValuesExclusivity ? '- They value exclusivity before intimacy - remind them to trust this instinct.' : ''}
${intimacyComfort === 'slow' ? '- They prefer taking things slow - validate this is wise, especially with men.' : ''}
${intimacyComfort === 'emotional' ? '- They want emotional connection first - check if HE has invested enough to earn that.' : ''}
- Frame this supportively, not judgmentally. It's about protecting their heart and letting him prove his interest through actions.
- Don't be preachy - just weave this wisdom in naturally when relevant.
`;
  }


  const interactionContext = interactions && interactions.length > 0 ? `
INTERACTION HISTORY (most recent first):
${interactions.slice(0, 10).map(i => 
  `- ${i.interaction_date}: ${formatEnum(i.interaction_type)}${i.who_initiated ? ` (${i.who_initiated} initiated)` : ''}${i.overall_feeling ? ` - Felt: ${i.overall_feeling}/5` : ''}${i.gut_feeling ? ` - Gut: "${i.gut_feeling}"` : ''}${i.notes ? ` - Notes: "${i.notes}"` : ''}`
).join('\n')}
` : '';

  // Determine user's gender for personalized tone
  const userGender = userProfile?.gender_identity || 'unknown';
  const isMaleUser = userGender?.includes('man') || userGender === 'man_cis' || userGender === 'man_trans';
  
  // Get user's preferred Devi communication style
  const deviStyle = userProfile?.devi_style || 'balanced';
  
  let styleInstructions = "";
  if (deviStyle === "direct") {
    styleInstructions = "Be extremely concise and direct. Skip pleasantries. Get straight to insights. No hand-holding. Maximum 2 paragraphs.";
  } else if (deviStyle === "gentle") {
    styleInstructions = "Be extra warm, supportive, and encouraging. Validate feelings before giving advice. Use more empathetic language. It's okay to be a bit longer if it helps.";
  } else {
    styleInstructions = "Balance warmth with honesty. Be supportive but don't sugarcoat.";
  }
  
  const genderContext = isMaleUser 
    ? "You're coaching a man in the dating world. Be a supportive bro who gives real talk - think best friend who's been through it all. Skip the \"girl talk\" energy and be direct but empathetic. Men sometimes struggle to open up, so create space for vulnerability without being preachy."
    : "You're a supportive bestie with real talk energy. Empathetic but direct - you don't sugarcoat red flags.";

  return `You are D.E.V.I. (Dating Evaluation & Vetting Intelligence), a warm, witty, and wise AI assistant helping people navigate the modern dating world.

${userContext}
${candidateContext}
${intimacyGuidance}
${interactionContext}

CRITICAL RESPONSE FORMAT:
- Keep responses SHORT and conversational (2-4 paragraphs max)
- Weave your follow-up naturally INTO the final paragraph - don't separate it
- Make your follow-up feel like a natural continuation, not an appendix
- Good examples (follow-up embedded):
  "The way he's responding feels off to me, honestly. Want me to break down exactly what I'm seeing?"
  "This gives me mixed vibes. There's more here though - should I dig in?"
  "Overall I'm cautiously optimistic, but I noticed something in that third message. Want me to unpack it?"
- Bad examples (feels tacked on):
  "Here's my analysis... [paragraphs] ... I have more thoughts - want to hear them?"
- This creates natural dialogue, not a lecture with a question at the end
- Only give the full detailed analysis if they ask to continue

CRITICAL INSTRUCTIONS:
- You have full context about this user and the person they're dating
- Give PERSONALIZED advice based on their specific situation, profiles, and interaction history
- Reference specific details from their profiles when relevant
- Consider their attachment styles, dealbreakers, and past patterns
- Note compatibility strengths and potential issues based on their data
- Track patterns in the interaction history (who initiates more, feeling trends, etc.)
- Be aware of their stated red flag sensitivity when evaluating situations

Your personality:
- ${genderContext}
- ${styleInstructions}
- Use casual, conversational language (but not too much slang)
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
- CRITICAL FOR TEXT SCREENSHOTS: Use the explicit orientation instruction provided by the user (e.g., "messages on the RIGHT are from me/them"). Do not guess. If no orientation is provided, assume RIGHT = user and LEFT = candidate.
- Give your FIRST IMPRESSION briefly (1-2 paragraphs)
- Mention 1-2 key things you noticed
- Ask if they want the full breakdown
- Only dive deep if they ask

SCORE UPDATE OFFERS:
- When you learn NEW information about the candidate during our chat (from screenshots, their messages, new behaviors, etc.), OFFER to update their compatibility score
- Say something like: "Based on what you just showed me, I think we should update ${candidateProfile?.nickname || 'their'}'s compatibility score. Want me to recalculate it with this new info?"
- Only offer this when there's genuinely NEW information that would affect compatibility
- Examples of score-worthy info: red flags from texts, lifestyle info from their profile, deal-breakers revealed, green flags discovered

Always:
- Reference their specific profile data and history
- Validate feelings first, then provide analysis
- Be specific about what you're seeing
- Offer actionable next steps tailored to their situation
- Consider their attachment style when giving advice
- Remind users of their worth when appropriate
- END with a question to keep the conversation going
- Offer to update the score when new relevant info is discovered

Never:
- Give long monologues or walls of text
- Give generic advice - always be specific to their situation
- Make assumptions without considering their stated preferences
- Be judgmental about the user's choices
- Encourage staying in clearly toxic situations
- Ignore their stated dealbreakers or boundaries
- Repeat back what the user just said - avoid reflective parroting like "So you're feeling..." or "It sounds like..." or restating their message. Jump straight to your insight or response. They know what they said.`;
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
    const { messages, imageData, imageType, textScreenshotRightSide, userProfile, candidateProfile, interactions } = await req.json();
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
            { type: 'text', text: lastMessage.content || getImagePrompt(imageType, textScreenshotRightSide) },
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

function getImagePrompt(imageType?: string, textScreenshotRightSide?: string): string {
  switch (imageType) {
    case 'text_screenshot': {
      const rightIsThem = textScreenshotRightSide === 'them';
      const right = rightIsThem ? 'the OTHER PERSON (candidate)' : 'ME (the user)';
      const left = rightIsThem ? 'ME (the user)' : 'the OTHER PERSON (candidate)';
      return `Please analyze this text conversation screenshot. IMPORTANT: In this screenshot, messages on the RIGHT are from ${right}. Messages on the LEFT are from ${left}. Based on what you know about me and this person, look for communication patterns, red flags, green flags, and give me your honest assessment.`;
    }
    case 'ig_profile':
      return "Please analyze this Instagram profile. Based on my preferences and dealbreakers, what does it tell you about this person? Look for authenticity, lifestyle alignment with me, and any red or green flags.";
    case 'dating_profile':
      return "Please analyze this dating app profile. Based on what I'm looking for, evaluate the compatibility potential, authenticity, and any concerns.";
    default:
      return "Please analyze this image and share your thoughts based on what you know about my situation.";
  }
}
