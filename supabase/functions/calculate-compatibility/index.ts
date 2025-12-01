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
    // Candidate status values
    "just_matched": "just matched",
    "texting": "texting stage",
    "planning_date": "planning a date",
    "dating": "situationship",
    "dating_casually": "dating casually",
    "getting_serious": "getting serious",
    "serious_relationship": "in a serious relationship",
    "no_contact": "no contact",
    "archived": "archived/ended",
    // Relationship status values
    "single": "single",
    "in_relationship": "currently in a relationship",
    "married": "married",
    "recently_divorced": "recently divorced",
    "ethical_non_monogamy": "in an ethically non-monogamous relationship",
    // Relationship goal values
    "casual": "casual dating",
    "serious": "serious relationship",
    "marriage": "marriage-minded",
    "unsure": "unsure/exploring",
    // Income ranges
    "under_25k": "under $25,000",
    "25k_50k": "$25,000 - $50,000",
    "50k_75k": "$50,000 - $75,000",
    "75k_100k": "$75,000 - $100,000",
    "100k_150k": "$100,000 - $150,000",
    "150k_250k": "$150,000 - $250,000",
    "250k_500k": "$250,000 - $500,000",
    "over_500k": "over $500,000",
    "prefer_not_to_say": "prefers not to say",
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

    // Fetch recent interactions for context (order by date then created_at to get true most recent)
    const { data: interactions } = await supabase
      .from("interactions")
      .select("*")
      .eq("candidate_id", candidateId)
      .eq("user_id", user.id)
      .order("interaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    // Build interaction summary and calculate sentiment
    let interactionSummary = "No interactions logged yet.";
    let interactionSentiment = 0;
    let negativeCount = 0;
    let positiveCount = 0;
    let hasCriticalRedFlag = false; // Deal-breakers like infidelity
    let hasLoveBombingPattern = false;
    let hasPostIntimacyDropOff = false;
    let hasGhostingPattern = false;
    let hasBlockedPattern = false;
    let hasObsessiveContactPattern = false; // User keeps contacting after being ghosted/blocked
    let shouldEndRelationship = false; // When true, score will be capped very low
    
    if (interactions && interactions.length > 0) {
      const interactionDetails = interactions.map((i: any) => 
        `- ${i.interaction_date}: ${i.interaction_type}${i.duration ? ` (${i.duration})` : ''} - Feeling: ${i.overall_feeling}/5${i.gut_feeling ? `, Gut: "${i.gut_feeling}"` : ''}${i.notes ? ` - Notes: "${i.notes}"` : ''}`
      ).join("\n");
      interactionSummary = `${interactions.length} interactions logged:\n${interactionDetails}`;
      
      // Calculate sentiment from interactions
      const negativeGutFeelings = ["sad", "anxious", "confused", "angry", "hurt", "frustrated", "disappointed"];
      const positiveGutFeelings = ["happy", "excited", "hopeful", "content", "loved", "secure"];
      
      // RELATIONSHIP ENDING FLAGS - These should result in advice to END the relationship
      const relationshipEndingFlags = [
        "ghosted", "ghosting", "got ghosted", "being ghosted", "blocked me", "got blocked", 
        "they blocked", "blocked on", "unfriended", "removed me",
        "love bombing", "love bombed", "lovebombed",
        "post intimacy drop", "dropped off after sex", "changed after intimacy", "different after sex",
        "keeps ignoring", "still ignoring", "won't respond", "no response for days", "no response for weeks"
      ];
      
      // Critical red flags that should tank the score (deal-breakers)
      const criticalRedFlags = ["seeing someone else", "cheating", "cheated", "other woman", "other guy", "married", "has a girlfriend", "has a boyfriend", "lied about", "abusive", "hit me", "threatened", "wants to end", "end things", "break up", "breaking up", "over between us", "done with", "leave me alone", "leave it alone", "don't contact", "stop contacting"];
      
      // Serious red flags
      const seriousRedFlags = ["ignored", "disappeared", "breadcrumbing", "not interested", "just friends", "moving on", "need space", "taking a break", "stopped responding", "went silent", "radio silence"];
      
      // Moderate red flags  
      const moderateRedFlags = ["distant", "cold", "switched up", "hot and cold", "inconsistent", "didn't answer", "didn't respond", "bummed", "confused", "pointless", "idk what to do", "less interested", "pulled back", "different energy"];
      
      // Obsessive contact indicators (user keeps reaching out after rejection)
      const obsessiveContactPhrases = [
        "i texted again", "i called again", "i messaged again", "i reached out again",
        "still trying to reach", "keep texting", "keep calling", "keep messaging",
        "texted multiple times", "called multiple times", "won't give up",
        "contacted even though", "messaged even though", "reached out after being blocked",
        "made a new account", "contacted from different", "tried again"
      ];
      
      // Love bombing detection phrases (overpromising)
      const loveBombingPhrases = [
        "want to take care of", "want to provide", "want a family", "wants kids with me", 
        "marry me", "move in together", "soulmate", "never felt this way", "meant to be",
        "planning our future", "talking about marriage", "talking about kids",
        "want to give you everything", "i'll take care of everything", "future together",
        "you're the one", "you're my everything", "can't live without you",
        "perfect for me", "we're meant to be", "destiny", "fate brought us"
      ];
      
      // Combine all notes for pattern detection
      const allNotes = interactions.map((i: any) => (i.notes || "").toLowerCase()).join(" ");
      const candidateNotes = (candidate.notes || "").toLowerCase();
      const combinedNotes = `${allNotes} ${candidateNotes}`;
      
      // DETECT RELATIONSHIP-ENDING PATTERNS
      
      // 1. Ghosting detection
      const ghostingIndicators = ["ghosted", "ghosting", "got ghosted", "being ghosted", "went silent", "radio silence", "stopped responding", "no response", "disappeared"];
      hasGhostingPattern = ghostingIndicators.some(phrase => combinedNotes.includes(phrase));
      if (hasGhostingPattern) {
        shouldEndRelationship = true;
        interactionSentiment -= 50;
        console.log("DETECTED: Ghosting pattern - RELATIONSHIP SHOULD END");
      }
      
      // 2. Blocked detection
      const blockedIndicators = ["blocked me", "got blocked", "they blocked", "blocked on", "unfriended", "removed me"];
      hasBlockedPattern = blockedIndicators.some(phrase => combinedNotes.includes(phrase));
      if (hasBlockedPattern) {
        shouldEndRelationship = true;
        interactionSentiment -= 60;
        console.log("DETECTED: Blocked pattern - RELATIONSHIP SHOULD END");
      }
      
      // 3. Obsessive contact detection (user keeps contacting after ghosting/blocking)
      hasObsessiveContactPattern = obsessiveContactPhrases.some(phrase => combinedNotes.includes(phrase));
      if (hasObsessiveContactPattern && (hasGhostingPattern || hasBlockedPattern)) {
        shouldEndRelationship = true;
        interactionSentiment -= 30; // Additional penalty
        console.log("DETECTED: Obsessive contact pattern after ghosting/blocking - CRITICAL");
      }
      
      // 4. Love bombing detection
      const hasLoveBombingLanguage = loveBombingPhrases.some(phrase => combinedNotes.includes(phrase));
      const hasFinancialInstability = combinedNotes.includes("not financially stable") || 
        combinedNotes.includes("earning hourly") || 
        combinedNotes.includes("broke") ||
        combinedNotes.includes("no money") ||
        combinedNotes.includes("can't afford") ||
        combinedNotes.includes("struggling financially");
      
      // Love bombing with ANY concerning pattern = major red flag
      if (hasLoveBombingLanguage) {
        hasLoveBombingPattern = true;
        const daysSinceFirstContact = candidate.first_contact_date 
          ? Math.floor((Date.now() - new Date(candidate.first_contact_date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (hasFinancialInstability) {
          shouldEndRelationship = true;
          interactionSentiment -= 45;
          console.log("DETECTED: Love bombing with financial instability - RELATIONSHIP SHOULD END");
        } else if (daysSinceFirstContact <= 14) {
          shouldEndRelationship = true;
          interactionSentiment -= 40;
          console.log("DETECTED: Early love bombing within 2 weeks - RELATIONSHIP SHOULD END");
        } else {
          interactionSentiment -= 25;
          console.log("DETECTED: Love bombing pattern");
        }
      }
      
      // 5. Post-intimacy drop-off detection
      const hasIntimacy = interactions.some((i: any) => i.interaction_type === "intimate");
      if (hasIntimacy) {
        const intimateIndex = interactions.findIndex((i: any) => i.interaction_type === "intimate");
        const postIntimacyInteractions = interactions.slice(0, intimateIndex);
        
        if (postIntimacyInteractions.length > 0) {
          const avgFeelingPostIntimacy = postIntimacyInteractions.reduce((sum: number, i: any) => 
            sum + (i.overall_feeling || 3), 0) / postIntimacyInteractions.length;
          
          const hasNegativePostIntimacy = postIntimacyInteractions.some((i: any) => {
            const notes = (i.notes || "").toLowerCase();
            return i.overall_feeling <= 2 || 
              ghostingIndicators.some(flag => notes.includes(flag)) ||
              blockedIndicators.some(flag => notes.includes(flag)) ||
              seriousRedFlags.some(flag => notes.includes(flag));
          });
          
          if (avgFeelingPostIntimacy < 3 || hasNegativePostIntimacy) {
            hasPostIntimacyDropOff = true;
            shouldEndRelationship = true;
            interactionSentiment -= 45;
            console.log("DETECTED: Post-intimacy drop-off - RELATIONSHIP SHOULD END");
          }
        }
      }
      
      // Process each interaction for additional penalties
      interactions.forEach((i: any) => {
        const feeling = i.overall_feeling || 3;
        const gut = (i.gut_feeling || "").toLowerCase();
        const notes = (i.notes || "").toLowerCase();
        
        // Check for relationship-ending flags in this interaction
        const hasEndingFlag = relationshipEndingFlags.some(phrase => notes.includes(phrase));
        const hasCritical = criticalRedFlags.some(phrase => notes.includes(phrase));
        const hasSerious = seriousRedFlags.some(phrase => notes.includes(phrase));
        const hasModerate = moderateRedFlags.some(phrase => notes.includes(phrase));
        
        if (hasEndingFlag) {
          shouldEndRelationship = true;
          negativeCount++;
          interactionSentiment -= 35;
        } else if (hasCritical) {
          hasCriticalRedFlag = true;
          shouldEndRelationship = true;
          negativeCount++;
          interactionSentiment -= 40;
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
      
      // Cap the sentiment adjustment based on severity
      if (shouldEndRelationship) {
        interactionSentiment = Math.max(-80, Math.min(-40, interactionSentiment));
      } else if (hasCriticalRedFlag) {
        interactionSentiment = Math.max(-60, Math.min(10, interactionSentiment));
      } else {
        interactionSentiment = Math.max(-45, Math.min(10, interactionSentiment));
      }
    }

    // Calculate base scores from profile data for consistency
    const baseScores = calculateBaseScores(profile, candidate);
    
    // Apply interaction sentiment - full impact for negative, reduced for positive
    const adjustedEmotionalScore = Math.max(5, Math.min(100, baseScores.emotional_compatibility + interactionSentiment));
    
    // Hard cap the overall score based on severity of issues
    let sentimentAdjustedOverall;
    if (shouldEndRelationship) {
      // Relationship-ending patterns: cap at 20 max
      sentimentAdjustedOverall = Math.min(20, Math.max(5, baseScores.overall_score + interactionSentiment));
      console.log(`SCORE CAPPED at ${sentimentAdjustedOverall} due to relationship-ending pattern`);
    } else if (hasCriticalRedFlag) {
      sentimentAdjustedOverall = Math.min(30, Math.max(15, baseScores.overall_score + interactionSentiment));
    } else {
      sentimentAdjustedOverall = Math.max(20, Math.min(100, baseScores.overall_score + interactionSentiment));
    }

    // Build the prompt for AI analysis
    const datingMotivation = (profile as any).dating_motivation || [];
    const isLookingForLove = datingMotivation.includes("love");
    
    // Detect high-profile partner from candidate data
    const careerStage = (candidate.their_career_stage || "").toLowerCase();
    const notes = (candidate.notes || "").toLowerCase();
    const metVia = (candidate.met_via || "").toLowerCase();
    const metApp = (candidate.met_app || "").toLowerCase();
    
    // Keywords that indicate high-profile partners
    const highProfileKeywords = [
      "influencer", "content creator", "youtuber", "tiktoker", "instagram",
      "athlete", "player", "nba", "nfl", "mlb", "soccer", "football", "basketball",
      "dj", "musician", "rapper", "singer", "artist", "producer", "band",
      "celebrity", "famous", "public figure", "actor", "actress", "model",
      "wealthy", "rich", "millionaire", "billionaire", "entrepreneur", "ceo", "founder",
      "travels a lot", "always busy", "touring", "on the road"
    ];
    
    const combinedText = `${careerStage} ${notes} ${metVia} ${metApp}`;
    const detectedHighProfile = highProfileKeywords.some(keyword => combinedText.includes(keyword));
    
    // Determine partner type for context
    let detectedPartnerType = "regular professional";
    if (combinedText.match(/influencer|content creator|youtuber|tiktoker|instagram/)) {
      detectedPartnerType = "influencer/content creator";
    } else if (combinedText.match(/athlete|player|nba|nfl|mlb|soccer|football|basketball/)) {
      detectedPartnerType = "athlete";
    } else if (combinedText.match(/dj|musician|rapper|singer|producer|band|touring/)) {
      detectedPartnerType = "musician/DJ";
    } else if (combinedText.match(/celebrity|famous|actor|actress|model/)) {
      detectedPartnerType = "celebrity/public figure";
    } else if (combinedText.match(/wealthy|rich|millionaire|billionaire|entrepreneur|ceo|founder/)) {
      detectedPartnerType = "high net worth individual";
    }
    
    const motivationContext = datingMotivation.length > 0 
      ? `- Dating Motivations: ${datingMotivation.map((m: string) => formatEnumValue(m)).join(", ")}`
      : "- Dating Motivations: Not specified";

    const highProfileWarning = detectedHighProfile ? `
IMPORTANT CONTEXT - HIGH-PROFILE PARTNER DETECTED:
D.E.V.I. has identified that ${candidate.nickname} appears to be a ${detectedPartnerType}. When providing advice:
${isLookingForLove ? `
- The user is looking for LOVE - be realistic about the challenges with high-profile partners
- High-profile individuals often have many romantic options and demanding schedules
- If ${candidate.nickname} has not clearly chosen exclusivity or shown serious commitment, advise the user to move with CAUTION
- Watch for signs they may be "one of many": inconsistent availability, vague about relationship status, keeping things casual, breadcrumbing
- If their relationship goal is anything less than "serious" or "marriage-minded", STRONGLY advise proceeding carefully
- Don't discourage the user, but help them see the situation clearly and protect their heart
- Look for GREEN flags showing genuine investment: introducing to inner circle, making time despite busy schedule, clear communication about intentions, consistency
` : `
- The user is not primarily seeking love, so focus on whether the dynamic meets their actual goals
- Still note any concerning patterns but frame advice around their stated motivations
`}
` : "";

    const prompt = `You are D.E.V.I. (Dating Evaluation & Vetting Intelligence), a warm, direct relationship coach helping someone evaluate their dating situation. Analyze compatibility between them and their dating candidate. Always address them as "you" - be conversational, empathetic, but honest.
${highProfileWarning}
YOUR PROFILE:
- Location: ${profile.city || "Not specified"}, ${profile.state || ""}, ${profile.country || "Not specified"}
${motivationContext}
- Relationship Status: ${formatEnumValue(profile.relationship_status)}
- Relationship Goal: ${formatEnumValue(profile.relationship_goal)}
- Religion: ${formatEnumValue(profile.religion)}, Importance: ${profile.faith_importance || 3}/5
- Politics: ${formatEnumValue(profile.politics)}, Importance: ${profile.politics_importance || 3}/5
- Kids Status: ${formatEnumValue(profile.kids_status)}
- Kids Desire: You ${formatEnumValue(profile.kids_desire)} children
- Attachment Style: ${formatEnumValue(profile.attachment_style)}
- Ambition Level: ${profile.ambition_level || 3}/5
- Career Stage: ${formatEnumValue(profile.career_stage)}
- Income Range: ${formatEnumValue((profile as any).income_range) || "Not specified"}
- Preferred Partner Income: ${formatEnumValue((profile as any).preferred_income_range) || "No preference"}
- Financial Importance: ${(profile as any).financial_importance || 3}/5
- Dealbreakers: ${JSON.stringify(profile.dealbreakers || [])}
- Communication Style: ${formatEnumValue(profile.communication_style)}
- Height: ${profile.height || "Not specified"}
- Body Type: ${formatEnumValue(profile.body_type)}
- Activity Level: ${formatEnumValue(profile.activity_level)}
- Education Level: ${formatEnumValue(profile.education_level)}
- Preferred Partner Education: ${formatEnumValue((profile as any).preferred_education_level) || "No preference"}
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

MOST RECENT INTERACTION TO ADDRESS:
${interactions && interactions.length > 0 
  ? `The latest interaction was on ${interactions[0].interaction_date}: ${interactions[0].interaction_type}
  ${interactions[0].notes ? `Notes: "${interactions[0].notes}"` : "No notes"}
  ${interactions[0].gut_feeling ? `User felt: ${interactions[0].gut_feeling}` : ""}
  Overall feeling: ${interactions[0].overall_feeling}/5
  
  YOUR ADVICE MUST DIRECTLY ADDRESS THIS SPECIFIC SITUATION. Do not give generic advice - respond to what actually happened.`
  : "No interactions logged yet - give advice based on profile compatibility."}

INTERACTION ANALYSIS:
- Total negative interactions: ${negativeCount}
- Total positive interactions: ${positiveCount}
- Calculated sentiment adjustment: ${interactionSentiment} points
- CRITICAL RED FLAG DETECTED: ${hasCriticalRedFlag ? "YES - DEAL-BREAKER PRESENT" : "No"}
- RELATIONSHIP SHOULD END: ${shouldEndRelationship ? "YES - CRITICAL PATTERN DETECTED" : "No"}
- GHOSTING DETECTED: ${hasGhostingPattern ? "YES - They are ghosting/have ghosted the user" : "No"}
- BLOCKED DETECTED: ${hasBlockedPattern ? "YES - User has been blocked" : "No"}
- OBSESSIVE CONTACT: ${hasObsessiveContactPattern ? "YES - User keeps contacting after being ghosted/blocked" : "No"}
- LOVE BOMBING DETECTED: ${hasLoveBombingPattern ? "YES - Actions don't match words (overpromising)" : "No"}
- POST-INTIMACY DROP-OFF: ${hasPostIntimacyDropOff ? "YES - Behavior changed negatively after intimacy" : "No"}

BASE COMPATIBILITY SCORES (calculated from profile matching):
- Values Alignment: ${baseScores.values_alignment}
- Lifestyle: ${baseScores.lifestyle_compatibility}
- Emotional: ${baseScores.emotional_compatibility} (ADJUSTED TO ${adjustedEmotionalScore} after interactions)
- Chemistry: ${baseScores.chemistry_score}
- Future Goals: ${baseScores.future_goals}
- Base Overall: ${baseScores.overall_score} (HARD CAPPED TO ${sentimentAdjustedOverall} after interactions)

CRITICAL SCORING RULES - YOU MUST FOLLOW THESE:
1. ${shouldEndRelationship ? "**RELATIONSHIP MUST END** - One or more critical patterns detected. Score MUST be 20 or below. Your advice MUST clearly tell the user to END this relationship and move on. Be compassionate but FIRM." : ""}
2. ${hasCriticalRedFlag ? "CRITICAL RED FLAG DETECTED! Score MUST be 30 or below. This is a deal-breaker situation." : ""}
3. The overall_score MUST NOT exceed ${sentimentAdjustedOverall} - this is a hard limit
4. If someone admits to "seeing someone else", is cheating, or shows major disrespect - emotional_compatibility should be 20 or lower
5. Your advice should match the severity of the score - a score under 35 means "walk away" advice
6. Do not sugarcoat concerns when serious red flags are present
7. The emotional_compatibility score should be ${adjustedEmotionalScore} or lower given the interactions
8. ${hasGhostingPattern ? "**GHOSTING DETECTED**: When someone ghosts you, it's OVER. They have made their choice by not communicating. Tell the user to respect themselves and move on. Do NOT suggest reaching out again." : ""}
9. ${hasBlockedPattern ? "**BLOCKED**: Being blocked is a CLEAR signal the relationship is over. There is nothing to salvage. Advise the user to accept this and focus on healing." : ""}
10. ${hasObsessiveContactPattern ? "**OBSESSIVE CONTACT WARNING**: The user appears to be repeatedly contacting someone who has ghosted/blocked them. This is unhealthy behavior. Gently but firmly advise them to STOP contacting this person immediately and work on themselves." : ""}
11. ${hasLoveBombingPattern ? "**LOVE BOMBING**: When someone makes big promises (providing, family, taking care of you) but their situation doesn't support it, this is manipulation. Their words don't match their ability to deliver. Advise ending this relationship." : ""}
12. ${hasPostIntimacyDropOff ? "**POST-INTIMACY DROP-OFF**: The candidate's behavior changed negatively AFTER intimacy. This is a classic pattern of someone who was only interested in sex. Tell the user this person showed their true intentions and they deserve better." : ""}

WRITING STYLE FOR ADVICE - IMPORTANT:
- CRITICAL: Your advice MUST directly reference the most recent interaction content. If they mentioned vacation, talk about that. If they had a fight, address that.
- DO NOT give generic advice like "keep communicating" - be SPECIFIC to what's actually happening
- Write like a supportive friend who tells it like it is, not a robot
- Use natural, conversational language - "Look," "Here's the thing," "Real talk," etc.
- Reference the specific situation: "So ${candidate.nickname} wants to go on vacation together..." or "After that conversation about..."
- Be direct about incompatibilities without being harsh - "This is a fundamental mismatch" not "directly conflicts"
- Use phrases like "you two want different things" instead of technical descriptions
- If kids desires conflict, say something like "${candidate.nickname} wants kids and you don't - that's a big deal that won't change"
- Make advice actionable and situation-specific - not generic "communicate more"
- Show empathy - "I know it's not what you want to hear, but..."
- NEVER use underscores or technical enum values in your output

Consider these factors when adjusting lifestyle scores:
- Distance/location compatibility (same city is best, long distance reduces score if they prefer nearby)
- Schedule flexibility compatibility (remote/flexible pairs well with most, 9-5 office and overnight may conflict)
- Frequent travelers need partners who are understanding of their lifestyle - flexible schedules work best
- Professional athletes have demanding, seasonal schedules - consider this for lifestyle compatibility
- Activity level and lifestyle compatibility
- Financial compatibility: if user has specified income preferences, consider whether the match aligns
- Education compatibility: if user values education level, factor this into lifestyle assessment
- If user is "in a relationship" but dating others, adjust advice to acknowledge their current situation

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
                    description: "Personalized advice that DIRECTLY ADDRESSES the most recent interaction content. Reference specific details from their latest interaction (e.g., vacation plans, conversations they mentioned). Never give generic advice - be specific to the situation."
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
// HARSHER SCORING: Start at 40 instead of 50, require positive evidence to go up
function calculateBaseScores(profile: any, candidate: any) {
  let valuesScore = 40;
  let lifestyleScore = 40;
  let emotionalScore = 40;
  let futureGoalsScore = 40;
  
  // Values alignment (religion, politics) - HARSHER for mismatches
  if (profile.religion && candidate.their_religion) {
    if (profile.religion === candidate.their_religion) {
      valuesScore += 25;
    } else if (profile.faith_importance >= 4) {
      valuesScore -= 30; // Harsher penalty
    } else if (profile.faith_importance >= 3) {
      valuesScore -= 15;
    }
  } else if (profile.faith_importance >= 4 && !candidate.their_religion) {
    valuesScore -= 15; // Unknown religion when it matters
  }
  
  if (profile.politics && candidate.their_politics) {
    const politicsOrder = ["progressive", "liberal", "moderate", "conservative", "traditional"];
    const userIdx = politicsOrder.indexOf(profile.politics);
    const candIdx = politicsOrder.indexOf(candidate.their_politics);
    const diff = Math.abs(userIdx - candIdx);
    if (diff === 0) valuesScore += 20;
    else if (diff === 1) valuesScore += 10;
    else if (diff >= 3 && profile.politics_importance >= 4) valuesScore -= 30; // Harsher
    else if (diff >= 2) valuesScore -= 15;
  } else if (profile.politics_importance >= 4 && !candidate.their_politics) {
    valuesScore -= 15; // Unknown politics when it matters
  }
  
  // Income/Financial compatibility - NEW
  const userPreferredIncome = (profile as any).preferred_income_range;
  const candCareerStage = candidate.their_career_stage;
  if (userPreferredIncome && userPreferredIncome !== "no_preference") {
    const highIncomePrefs = ["250k_plus", "250k_500k", "over_500k", "150k_250k"];
    const lowIncomeStages = ["student", "entry_level", "between", "between_jobs"];
    
    if (highIncomePrefs.includes(userPreferredIncome) && lowIncomeStages.includes(candCareerStage)) {
      lifestyleScore -= 25; // Big gap between income expectations
      futureGoalsScore -= 15;
    }
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
  
  // Distance compatibility - MUCH HARSHER
  if (candidate.distance_approximation) {
    const candDist = candidate.distance_approximation;
    const distPref = profile.distance_preference;
    
    // If user wants nearby but candidate is far/long distance, heavy penalty
    if (distPref && distPref !== "ldr" && distPref !== "relocate" && distPref !== "long_distance") {
      if (candDist === "long_distance" || candDist === "different_country" || candDist === "different_state") {
        lifestyleScore -= 35; // HARSH penalty for long distance when user wants local
        futureGoalsScore -= 20; // Also impacts future goals
      } else if (candDist === "different_city" || candDist === "2_plus_hours" || candDist === "1_2_hours") {
        lifestyleScore -= 20;
      } else if (candDist === "30_60_min") {
        lifestyleScore -= 10;
      } else if (candDist === "same_city" || candDist === "nearby" || candDist === "under_30_min") {
        lifestyleScore += 15;
      }
    } else if (distPref === "ldr" || distPref === "relocate" || distPref === "long_distance") {
      // User is okay with long distance
      lifestyleScore += 10;
    } else {
      // Default: still penalize long distance moderately
      if (candDist === "long_distance" || candDist === "different_country") {
        lifestyleScore -= 25;
      }
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