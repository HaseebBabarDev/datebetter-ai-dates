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

function isMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return !Number.isFinite(value);
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "" || v === "not specified";
  }
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function normalizeTextValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v ? v : null;
}

// Education level hierarchy (higher index = higher education)
const EDUCATION_HIERARCHY: Record<string, number> = {
  "high_school": 1,
  "some_college": 2,
  "associates": 3,
  "bachelors": 4,
  "masters": 5,
  "doctorate": 6,
  "phd": 6,
};

function getEducationLevel(value: string | null): number {
  if (!value) return 0;
  const key = value.toLowerCase().replace(/[^a-z_]/g, "");
  return EDUCATION_HIERARCHY[key] || 0;
}

function enforceEducationConsistency(analysis: any, profile: any, candidate: any) {
  const userPrefEduRaw = normalizeTextValue((profile as any)?.preferred_education_level);
  const candEduRaw = normalizeTextValue(candidate?.their_education_level);

  // If we don't know the candidate's education, we can't validate claims about it.
  if (!candEduRaw) return;

  const userPrefEduLevel = getEducationLevel(userPrefEduRaw);
  const candEduLevel = getEducationLevel(candEduRaw);

  const userPrefEduFriendly = userPrefEduRaw ? formatEnumValue(userPrefEduRaw) : null;
  const candEduFriendly = formatEnumValue(candEduRaw);

  const eduRegex = /(doctorate|phd|master'?s|bachelor'?s|associate|some\s+college|college|degree|university|graduate|post[-\s]?grad)/i;
  const bothRegex = /\byou\s+both\b/i;

  if (Array.isArray(analysis?.strengths)) {
    const before = analysis.strengths.length;
    analysis.strengths = analysis.strengths.filter((s: unknown) => {
      if (typeof s !== "string") return true;
      // Remove only the problematic education claims that say "you both".
      return !(eduRegex.test(s) && bothRegex.test(s));
    });

    const removed = before - analysis.strengths.length;
    if (removed > 0) {
      analysis.strengths.unshift("You're clear about your standards around education and long-term stability.");
    }
  }

  // Only flag if candidate's education is LOWER than preference
  // Higher education than preferred is always acceptable
  if (Array.isArray(analysis?.concerns) && userPrefEduLevel > 0 && candEduLevel > 0) {
    const alreadyMentionsEducation = analysis.concerns.some(
      (c: unknown) => typeof c === "string" && c.toLowerCase().includes("education")
    );

    // Only add concern if candidate's education is BELOW the user's preference
    if (!alreadyMentionsEducation && candEduLevel < userPrefEduLevel && userPrefEduFriendly) {
      const concern = `Education alignment: you prefer a partner with ${userPrefEduFriendly}, but ${candidate.nickname} has ${candEduFriendly}.`;
      analysis.concerns.unshift(concern);
    }
  }
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
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("Auth error:", userError?.message || "User not found");
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Fetch recent USER interactions for context.
    // IMPORTANT: We exclude system-generated "D.E.V.I. Score Update" interactions so refreshes don't
    // (a) count as new data and (b) affect sentiment scoring.
    const { data: interactionsRaw } = await supabase
      .from("interactions")
      .select("*")
      .eq("candidate_id", candidateId)
      .eq("user_id", user.id)
      .order("interaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(25);

    const interactions = (interactionsRaw || [])
      .filter((i: any) => {
        const notes = typeof i?.notes === "string" ? i.notes : "";
        return !notes.startsWith("D.E.V.I. Score Update:");
      })
      .slice(0, 10);

    // CHECK IF THERE'S NEW DATA SINCE LAST SCORE UPDATE
    // Score should only change when the USER logs a new interaction.
    const lastScoreUpdate = candidate.last_score_update ? new Date(candidate.last_score_update) : null;

    let hasNewDataSinceLastScore = false;

    if (!lastScoreUpdate) {
      // Never scored before - needs calculation
      hasNewDataSinceLastScore = true;
    } else {
      // Check if any user interaction was created since last score
      if (interactions && interactions.length > 0) {
        const mostRecentInteraction = interactions[0];
        const interactionCreatedAt = mostRecentInteraction.created_at
          ? new Date(mostRecentInteraction.created_at)
          : null;
        if (interactionCreatedAt && interactionCreatedAt > lastScoreUpdate) {
          hasNewDataSinceLastScore = true;
        }
      }
    }
    
    // If no new data, return the existing score unchanged
    if (!hasNewDataSinceLastScore && candidate.compatibility_score !== null) {
      console.log(`NO NEW DATA since last score update (${lastScoreUpdate?.toISOString()}). Returning existing score: ${candidate.compatibility_score}%`);
      return new Response(
        JSON.stringify({
          overall_score: candidate.compatibility_score,
          previous_score: candidate.compatibility_score,
          score_changed: false,
          breakdown: candidate.score_breakdown || {},
          no_recalculation_needed: true,
          message: "Score unchanged - no new interactions or updates since last calculation"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`NEW DATA DETECTED - recalculating score (last update: ${lastScoreUpdate?.toISOString()})`);

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
    let hasCandidateHarassment = false; // Candidate obsessively contacts/stalks user
    let hasDiscriminatoryBehavior = false; // Fat shaming, racism, degrading remarks
    let shouldEndRelationship = false; // When true, score will be capped very low
    let recentPositiveStreak = 0; // Track consecutive positive recent interactions for recovery
    let recoveryBonusFromStreak = 0; // Derived from streak; used to relax caps gradually

    // IMPORTANT: Some relationship-ending patterns (e.g. love bombing) may be present in older
    // interactions that fall outside the "recent 10" window. We still need to honor those
    // signals and keep the overall score capped until the user has a sustained positive streak.
    const { data: historicalFlagInteractions } = await supabase
      .from("interactions")
      .select("notes")
      .eq("candidate_id", candidateId)
      .eq("user_id", user.id)
      .not("notes", "is", null)
      // Only pull notes that match relationship-ending flags.
      .or(
        [
          "notes.ilike.%ghost%",
          "notes.ilike.%blocked%",
          "notes.ilike.%love bomb%",
          "notes.ilike.%lovebomb%",
          "notes.ilike.%post intimacy%",
          "notes.ilike.%dropped off after sex%",
          "notes.ilike.%changed after intimacy%",
          "notes.ilike.%different after sex%",
        ].join(",")
      )
      .limit(50);

    const historicalFlagText = `${(historicalFlagInteractions || [])
      .map((r: any) => r.notes || "")
      .join(" ")} ${(candidate.notes || "")}`.toLowerCase();

    const hasHistoricalGhosting = historicalFlagText.includes("ghost");
    const hasHistoricalBlocked = historicalFlagText.includes("blocked");
    const hasHistoricalLoveBombing = historicalFlagText.includes("love bomb");
    const hasHistoricalPostIntimacy =
      historicalFlagText.includes("post intimacy") ||
      historicalFlagText.includes("dropped off after sex") ||
      historicalFlagText.includes("changed after intimacy") ||
      historicalFlagText.includes("different after sex");

    if (hasHistoricalGhosting) hasGhostingPattern = true;
    if (hasHistoricalBlocked) hasBlockedPattern = true;
    if (hasHistoricalLoveBombing) hasLoveBombingPattern = true;
    if (hasHistoricalPostIntimacy) hasPostIntimacyDropOff = true;

    // If any historical "relationship-ending" pattern exists, keep low-cap mode on.
    if (
      hasHistoricalGhosting ||
      hasHistoricalBlocked ||
      hasHistoricalLoveBombing ||
      hasHistoricalPostIntimacy
    ) {
      shouldEndRelationship = true;
      console.log(
        `HISTORICAL FLAGS: end-mode enabled (ghosting=${hasHistoricalGhosting}, blocked=${hasHistoricalBlocked}, loveBomb=${hasHistoricalLoveBombing}, postIntimacy=${hasHistoricalPostIntimacy})`
      );
    }

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
      
      // Discriminatory, degrading, and abusive remarks - INSTANT DEAL-BREAKERS
      const discriminatoryPhrases = [
        // Fat shaming
        "called me fat", "said i was fat", "fat shaming", "fat shamed", "too fat", "lose weight",
        "you're fat", "you're overweight", "disgusting body", "gross body", "need to diet",
        "let yourself go", "gained weight", "too heavy", "whale", "pig", "cow",
        // Racial discrimination
        "racist", "racial slur", "called me a", "n word", "the n word", "racial remark",
        "because of my race", "my skin color", "your people", "you people", "go back to",
        "don't date your kind", "your kind", "ethnic slur",
        // General degrading/derogatory
        "degrading", "degraded me", "derogatory", "belittled", "humiliated", "humiliating",
        "called me stupid", "called me dumb", "called me ugly", "you're ugly", "you're disgusting",
        "worthless", "pathetic", "piece of", "trash", "garbage", "useless",
        "no one will want you", "no one else will", "lucky to have me", "can't do better",
        "put me down", "puts me down", "insults me", "insulted me", "mocked me", "mocking",
        "made fun of", "laughed at me", "ridiculed", "shamed me", "body shamed",
        // Slurs and hate speech
        "slur", "hate speech", "bigot", "sexist", "misogynist", "misogyny",
        "homophobic", "transphobic", "ableist", "xenophobic"
      ];
      
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
      
      // Candidate obsessively contacting user (harassment/stalking)
      const candidateObsessivePhrases = [
        "keeps texting me", "keeps calling me", "keeps messaging me", "won't stop texting",
        "won't stop calling", "blowing up my phone", "spam calling", "spam texting",
        "showed up at my", "showed up unannounced", "came to my house", "came to my work",
        "waiting outside", "following me", "stalking", "harassing me", "won't leave me alone",
        "threatening me", "threatening to", "making threats", "sent threats",
        "contacted my friends", "contacted my family", "messaged my mom", "messaged my sister",
        "keeps showing up", "won't take no", "doesn't respect my boundaries",
        "created fake account", "new number", "different number", "made new account"
      ];
      
      // Combine all notes for pattern detection
      const allNotes = interactions.map((i: any) => (i.notes || "").toLowerCase()).join(" ");
      const candidateNotes = (candidate.notes || "").toLowerCase();
      const combinedNotes = `${allNotes} ${candidateNotes}`;
      
      // DETECT RELATIONSHIP-ENDING PATTERNS
      
      // 1. Ghosting detection
      // Avoid false positives like "no response" without any time context.
      const ghostingIndicators = [
        "ghosted",
        "ghosting",
        "got ghosted",
        "being ghosted",
        "went silent",
        "radio silence",
        "stopped responding",
        "disappeared",
        "no response for days",
        "no response for weeks",
        "no response for a week",
        "no response for 3 days",
      ];
      hasGhostingPattern = ghostingIndicators.some((phrase) => combinedNotes.includes(phrase));
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
      
      // 3a. Obsessive contact detection (user keeps contacting after ghosting/blocking)
      hasObsessiveContactPattern = obsessiveContactPhrases.some(phrase => combinedNotes.includes(phrase));
      if (hasObsessiveContactPattern && (hasGhostingPattern || hasBlockedPattern)) {
        shouldEndRelationship = true;
        interactionSentiment -= 30; // Additional penalty
        console.log("DETECTED: Obsessive contact pattern after ghosting/blocking - CRITICAL");
      }
      
      // 3b. Candidate harassment/stalking detection (candidate obsessively contacting user)
      hasCandidateHarassment = candidateObsessivePhrases.some(phrase => combinedNotes.includes(phrase));
      if (hasCandidateHarassment) {
        shouldEndRelationship = true;
        interactionSentiment -= 60;
        console.log("DETECTED: Candidate harassment/stalking - RELATIONSHIP SHOULD END IMMEDIATELY");
      }
      
      // 3c. Discriminatory/degrading behavior detection
      hasDiscriminatoryBehavior = discriminatoryPhrases.some(phrase => combinedNotes.includes(phrase));
      if (hasDiscriminatoryBehavior) {
        shouldEndRelationship = true;
        interactionSentiment -= 70; // Severe penalty - this is unacceptable
        console.log("DETECTED: Discriminatory/degrading behavior - RELATIONSHIP SHOULD END IMMEDIATELY");
      }
      
      // 4. Love bombing detection
      // NOTE: avoid false positives. One romantic phrase alone should NOT force an end-mode cap.
      const matchedLoveBombingPhrases = loveBombingPhrases.filter((phrase) => combinedNotes.includes(phrase));
      const hasLoveBombingLanguage = matchedLoveBombingPhrases.length > 0;

      // Stronger love-bombing signals (more predictive of manipulation when very early)
      const strongLoveBombingPhrases = [
        "soulmate",
        "marry me",
        "move in together",
        "you're the one",
        "you're my everything",
        "can't live without you",
        "planning our future",
        "talking about marriage",
        "talking about kids",
        "destiny",
        "fate brought us",
      ];
      const hasStrongLoveBombingLanguage = strongLoveBombingPhrases.some((phrase) => combinedNotes.includes(phrase));

      const hasFinancialInstability = combinedNotes.includes("not financially stable") || 
        combinedNotes.includes("earning hourly") || 
        combinedNotes.includes("broke") ||
        combinedNotes.includes("no money") ||
        combinedNotes.includes("can't afford") ||
        combinedNotes.includes("struggling financially");

      if (hasLoveBombingLanguage) {
        hasLoveBombingPattern = true;

        const daysSinceFirstContact = candidate.first_contact_date 
          ? Math.floor((Date.now() - new Date(candidate.first_contact_date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Severity: strong phrases count heavier; multiple matches matters.
        const loveBombingSeverity =
          (hasStrongLoveBombingLanguage ? 2 : 0) + Math.min(3, matchedLoveBombingPhrases.length);

        // Only force end-mode when love bombing is clearly intense AND early/paired with other red flags.
        if (hasFinancialInstability && loveBombingSeverity >= 3) {
          shouldEndRelationship = true;
          interactionSentiment -= 45;
          console.log("DETECTED: Strong love bombing + financial instability - end-mode");
        } else if (daysSinceFirstContact <= 14 && loveBombingSeverity >= 4) {
          shouldEndRelationship = true;
          interactionSentiment -= 35;
          console.log("DETECTED: Strong early love bombing (2+ strong signals) - end-mode");
        } else if (loveBombingSeverity >= 4 && (hasGhostingPattern || hasBlockedPattern)) {
          shouldEndRelationship = true;
          interactionSentiment -= 35;
          console.log("DETECTED: Strong love bombing + ghosting/blocked - end-mode");
        } else {
          // Otherwise treat as a caution signal, not a hard cap.
          interactionSentiment -= Math.min(25, 10 + loveBombingSeverity * 3);
          console.log("DETECTED: Mild love bombing language (caution)");
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
      // Track recent positive streak for recovery scoring
      let streakBroken = false;
      
      interactions.forEach((i: any, index: number) => {
        const feeling = i.overall_feeling || 3;
        const gut = (i.gut_feeling || "").toLowerCase();
        const notes = (i.notes || "").toLowerCase();
        
        // Check for relationship-ending flags in this interaction
        const hasEndingFlag = relationshipEndingFlags.some(phrase => notes.includes(phrase));
        const hasCritical = criticalRedFlags.some(phrase => notes.includes(phrase));
        const hasSerious = seriousRedFlags.some(phrase => notes.includes(phrase));
        const hasModerate = moderateRedFlags.some(phrase => notes.includes(phrase));
        
        // Track positive streak (interactions are ordered most recent first)
        const isPositive = feeling >= 4 && !hasEndingFlag && !hasCritical && !hasSerious && !hasModerate;
        if (!streakBroken && isPositive) {
          recentPositiveStreak++;
        } else if (!isPositive && index < 5) {
          // Only break streak on negative interaction in the 5 most recent
          streakBroken = true;
        }
        
        // Apply recency weighting - recent interactions (first 3) have more impact
        const recencyMultiplier = index < 3 ? 1.5 : (index < 6 ? 1.0 : 0.7);
        
        if (hasEndingFlag) {
          shouldEndRelationship = true;
          negativeCount++;
          interactionSentiment -= Math.round(35 * recencyMultiplier);
        } else if (hasCritical) {
          hasCriticalRedFlag = true;
          shouldEndRelationship = true;
          negativeCount++;
          interactionSentiment -= Math.round(40 * recencyMultiplier);
        } else if (hasSerious) {
          negativeCount++;
          interactionSentiment -= Math.round(25 * recencyMultiplier);
        } else if (hasModerate || feeling <= 2 || negativeGutFeelings.includes(gut)) {
          negativeCount++;
          const penalty = hasModerate ? 15 : (feeling === 1 ? 12 : 8);
          interactionSentiment -= Math.round(penalty * recencyMultiplier);
        } else if (feeling >= 4 && positiveGutFeelings.includes(gut)) {
          positiveCount++;
          // Positive interactions get boosted by recency
          interactionSentiment += Math.round(5 * recencyMultiplier);
        } else if (feeling >= 4) {
          // Positive feeling without specific gut feeling still helps
          positiveCount++;
          interactionSentiment += Math.round(3 * recencyMultiplier);
        }
      });
      
      // Recovery logic: If there's a consistent positive streak, allow VERY gradual score recovery
      // This encourages growth and behavior change over time - but slowly over weeks/months
      recoveryBonusFromStreak = 0;
      if (recentPositiveStreak >= 3) {
        // 3+ consecutive positive interactions = start recovering VERY slowly
        // Only +1% per positive interaction after the first 2 (not +5%)
        recoveryBonusFromStreak = recentPositiveStreak - 2; // +1 per positive after the first 2
        recoveryBonusFromStreak = Math.min(recoveryBonusFromStreak, 15); // Cap recovery bonus at 15 max (needs 17+ positives)
        console.log(
          `RECOVERY: ${recentPositiveStreak} consecutive positive interactions, bonus: +${recoveryBonusFromStreak}`
        );
      }

      // Cap the sentiment adjustment based on severity, but apply recovery bonus
      if (shouldEndRelationship) {
        // Allow recovery if there's a positive streak - but keep sentiment very negative
        const adjustedMin = -40 + recoveryBonusFromStreak;
        interactionSentiment = Math.max(
          -80,
          Math.min(adjustedMin, interactionSentiment + recoveryBonusFromStreak)
        );
      } else if (hasCriticalRedFlag) {
        interactionSentiment = Math.max(
          -60,
          Math.min(10 + recoveryBonusFromStreak, interactionSentiment + recoveryBonusFromStreak)
        );
      } else {
        interactionSentiment = Math.max(
          -45,
          Math.min(15 + recoveryBonusFromStreak, interactionSentiment + recoveryBonusFromStreak)
        );
      }
    }

    // Calculate base scores from profile data for consistency
    const baseScores = calculateBaseScores(profile, candidate);
    
    // Apply interaction sentiment - full impact for negative, reduced for positive
    const adjustedEmotionalScore = Math.max(5, Math.min(100, baseScores.emotional_compatibility + interactionSentiment));
    
    // Hard cap the overall score based on severity of issues
    // Recovery is VERY gradual - score can only go up by 1% at a time
    let sentimentAdjustedOverall;
    if (shouldEndRelationship) {
      // Relationship-ending patterns: cap in low range (12-28%)
      // Use deterministic base derived from sentiment (no randomness!)
      const baseLowCap = Math.max(12, Math.min(19, 15 + Math.round(interactionSentiment / 20)));
      const maxCap = Math.min(28, baseLowCap + recoveryBonusFromStreak);

      // Get previous score to ensure we only move gradually (both up AND down)
      const previousScore =
        typeof candidate.compatibility_score === "number"
          ? Math.round(candidate.compatibility_score)
          : null;

      // Base computed score (deterministic, no random variance)
      let computedScore = Math.min(
        maxCap,
        Math.max(8, Math.round(baseScores.overall_score + interactionSentiment))
      );

      if (previousScore === null) {
        // First time scoring - use computed in low range
        sentimentAdjustedOverall = Math.min(maxCap, Math.max(12, computedScore));
      } else if (recentPositiveStreak >= 3 && computedScore >= previousScore) {
        // GRADUAL RECOVERY: Only allow +1 increase per rescore
        sentimentAdjustedOverall = Math.min(maxCap, previousScore + 1);
      } else if (computedScore < previousScore) {
        // GRADUAL DECREASE: Only allow -1 decrease per rescore when there's genuinely new negative data
        sentimentAdjustedOverall = Math.max(8, previousScore - 1);
      } else {
        // No change needed - keep previous score stable
        sentimentAdjustedOverall = previousScore;
      }

      console.log(
        `SCORE with recovery: ${sentimentAdjustedOverall} (max cap: ${maxCap}, previous: ${previousScore}, computed: ${computedScore}, streak: ${recentPositiveStreak})`
      );
    } else if (hasCriticalRedFlag) {
      const recoveryBonus = Math.max(0, interactionSentiment + 20);
      const maxCap = Math.min(55, 30 + recoveryBonus);
      sentimentAdjustedOverall = Math.min(maxCap, Math.max(15, baseScores.overall_score + interactionSentiment));
    } else {
      sentimentAdjustedOverall = Math.max(20, Math.min(100, baseScores.overall_score + interactionSentiment));
    }

    // Build the prompt for AI analysis
    const datingMotivation = (profile as any).dating_motivation || [];
    const isLookingForLove = datingMotivation.includes("love");

    const missingCandidateFields = [
      { label: "Location", value: `${candidate.city || ""}${candidate.country || ""}` },
      { label: "Relationship Status", value: candidate.their_relationship_status },
      { label: "Relationship Goal", value: candidate.their_relationship_goal },
      { label: "Religion", value: candidate.their_religion },
      { label: "Politics", value: candidate.their_politics },
      { label: "Kids Status", value: candidate.their_kids_status },
      { label: "Kids Desire", value: candidate.their_kids_desire },
      { label: "Attachment Style", value: candidate.their_attachment_style },
      { label: "Ambition Level", value: candidate.their_ambition_level },
      { label: "Career Stage", value: candidate.their_career_stage },
      { label: "Education Level", value: candidate.their_education_level },
      { label: "Exercise Habits", value: candidate.their_exercise },
      { label: "Schedule Flexibility", value: candidate.their_schedule_flexibility },
    ]
      .filter((f) => isMissing(f.value))
      .map((f) => f.label);

    const missingUserFields = [
      { label: "Location", value: `${profile.city || ""}${profile.state || ""}${profile.country || ""}` },
      { label: "Religion", value: profile.religion },
      { label: "Politics", value: profile.politics },
      { label: "Kids Status", value: profile.kids_status },
      { label: "Kids Desire", value: profile.kids_desire },
      { label: "Attachment Style", value: profile.attachment_style },
      { label: "Ambition Level", value: profile.ambition_level },
      { label: "Career Stage", value: profile.career_stage },
      { label: "Education Level", value: profile.education_level },
      { label: "Schedule Flexibility", value: profile.schedule_flexibility },
      { label: "Income Range", value: (profile as any).income_range },
      { label: "Preferred Partner Income", value: (profile as any).preferred_income_range },
    ]
      .filter((f) => isMissing(f.value))
      .map((f) => f.label);

    const dataAvailabilityBlock = `
DATA AVAILABILITY (do NOT assume missing info matches):
- Candidate fields missing/unknown: ${missingCandidateFields.length ? missingCandidateFields.join(", ") : "None"}
- Your fields missing/unknown: ${missingUserFields.length ? missingUserFields.join(", ") : "None"}

LANGUAGE RULE (MUST FOLLOW):
- ONLY say "you both" when you have explicit info for BOTH of you about that exact point.
- If candidate info is missing, write "You ..." and/or "Unknown whether ${candidate.nickname} ...". Never assume similarity.
`;

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
- Gender Identity: ${formatEnumValue(profile.gender_identity)}
- Sexual Orientation: ${formatEnumValue(profile.sexual_orientation)}
- Interested In: ${Array.isArray(profile.interested_in) ? profile.interested_in.map((i: string) => formatEnumValue(i)).join(", ") : "Not specified"}
- Location: ${profile.city || "Not specified"}, ${profile.state || ""}, ${profile.country || "Not specified"}
${motivationContext}
- Relationship Status: ${formatEnumValue(profile.relationship_status)}
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
  
  EDUCATION FACTS (do not mix these up):
  - You have: ${formatEnumValue(profile.education_level)}
  - You prefer a partner with: ${formatEnumValue((profile as any).preferred_education_level) || "No preference"}
  - ${candidate.nickname} has: ${formatEnumValue(candidate.their_education_level)}
  IMPORTANT: Your preference is NOT the candidate's education.
- Height Preference for partner: ${profile.height_preference || "No preference"}
- Schedule Flexibility: ${formatEnumValue(profile.schedule_flexibility)}
- Distance Preference: ${formatEnumValue(profile.distance_preference)}

CANDIDATE PROFILE (${candidate.nickname}):
- Name: ${candidate.nickname}
- Gender Identity: ${formatEnumValue(candidate.gender_identity)}
- Pronouns: ${formatEnumValue(candidate.pronouns)}
- Location: ${candidate.city || "Not specified"}, ${candidate.country || "Not specified"}
- Distance from you: ${formatEnumValue(candidate.distance_approximation)}
- Relationship Status: ${formatEnumValue(candidate.their_relationship_status)}
- Their Relationship Goal (what THEY are looking for): ${formatEnumValue(candidate.their_relationship_goal)}
- YOUR Goal for ${candidate.nickname} (what YOU want with them): ${formatEnumValue((candidate as any).user_goal_for_candidate) || "Not specified"}
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
${dataAvailabilityBlock}

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
- OBSESSIVE CONTACT (by user): ${hasObsessiveContactPattern ? "YES - User keeps contacting after being ghosted/blocked" : "No"}
- HARASSMENT/STALKING (by candidate): ${hasCandidateHarassment ? "YES - Candidate is obsessively contacting/stalking the user" : "No"}
- DISCRIMINATORY/DEGRADING BEHAVIOR: ${hasDiscriminatoryBehavior ? "YES - Fat shaming, racism, degrading/derogatory remarks detected" : "No"}
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
11. ${hasCandidateHarassment ? "**HARASSMENT/STALKING ALERT**: The candidate is showing dangerous obsessive behavior (repeatedly contacting, showing up uninvited, stalking, threatening). This is a SAFETY CONCERN. Advise the user to block them everywhere, document incidents, and consider involving authorities if threats continue. This is NON-NEGOTIABLE - they must cut ALL contact." : ""}
12. ${hasDiscriminatoryBehavior ? "**DISCRIMINATORY/DEGRADING BEHAVIOR**: The candidate has made fat shaming, racist, degrading, or derogatory remarks. This is VERBAL/EMOTIONAL ABUSE. No one deserves to be treated this way. Tell the user firmly that this behavior is UNACCEPTABLE and will only get worse. They must end this relationship immediately. Remind them of their worth and that they deserve someone who respects and values them." : ""}
13. ${hasLoveBombingPattern ? "**LOVE BOMBING**: When someone makes big promises (providing, family, taking care of you) but their situation doesn't support it, this is manipulation. Their words don't match their ability to deliver. Advise ending this relationship." : ""}
14. ${hasPostIntimacyDropOff ? "**POST-INTIMACY DROP-OFF**: The candidate's behavior changed negatively AFTER intimacy. This is a classic pattern of someone who was only interested in sex. Tell the user this person showed their true intentions and they deserve better." : ""}

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

GOAL ALIGNMENT SCORING (CRITICAL - factor this into compatibility):
- If the user has specified a goal for this candidate, compare it with what the candidate is looking for:
  * Perfect match (both want same thing) = +15 to future_goals
  * User wants MORE commitment than candidate (e.g., user wants marriage, they want casual) = -40 to future_goals, and FLAG this prominently in concerns
  * User wants LESS commitment than candidate (e.g., user wants casual, they want marriage) = -25 to future_goals (potential for hurt feelings on their end)
  * One or both are "unsure" = neutral, but note they should clarify intentions
- This is fundamental! If goals don't align, the relationship has limited potential regardless of chemistry.

Consider these factors when adjusting lifestyle scores:
- Distance/location compatibility (same city is best, long distance reduces score if they prefer nearby)
- Schedule flexibility compatibility (remote/flexible pairs well with most, 9-5 office and overnight may conflict)
- Frequent travelers need partners who are understanding of their lifestyle - flexible schedules work best
- Professional athletes have demanding, seasonal schedules - consider this for lifestyle compatibility
- Activity level and lifestyle compatibility
- Financial compatibility: if user has specified income preferences, consider whether the match aligns
- Education compatibility: if user values education level, factor this into lifestyle assessment
- If user is "in a relationship" but dating others, adjust advice to acknowledge their current situation

DATING CONTEXT CONSIDERATIONS - Factor these into your analysis:
- Adapt your tone based on the user's gender - if they're a man, be more direct "bro talk" style; if they're a woman, use supportive bestie energy
- For straight men dating women: understand that women often face different safety concerns, move at different paces, and may communicate differently. Help him understand these dynamics without being preachy.
- For straight women dating men: understand unique challenges like safety vetting, reading mixed signals, and navigating modern dating expectations

HETEROSEXUAL MALE SCORING MATRIX (for straight/bi men dating women):

1. UNDERSTANDING WOMEN'S PERSPECTIVE - Help him see her side:
   - Women prioritize safety - meeting in public, telling friends, etc. = Normal (+0)
   - She wants to take things slow = Healthy boundary (+10 if he respects it)
   - He pressures for faster progression = -30 (boundary violation)
   - He gets frustrated by her caution = -20 (lacks empathy)
   - He understands and accommodates her pace = +20 (emotionally intelligent)

2. COMMUNICATION STYLE COMPATIBILITY:
   - She prefers calls, he only texts = -15 (communication mismatch)
   - She needs more emotional expression, he's stoic = -20 (emotional availability gap)
   - He dismisses her feelings as "dramatic" = -40 (invalidation pattern)
   - He actively listens and validates = +25 (emotionally mature)
   - He shares feelings openly = +20 (vulnerability positive)

3. INITIATIVE & EFFORT RED FLAGS:
   - He never plans dates, always "whatever you want" = -25 (low effort)
   - He only texts late night = -35 (booty call pattern)
   - He cancels frequently = -30 (unreliable)
   - He plans thoughtful dates = +20 (high effort)
   - He follows through on plans = +15 (reliable)
   - He remembers details she mentioned = +15 (attentive)

4. FINANCIAL DYNAMICS:
   - He expects her to always pay = -20 (imbalanced)
   - He's stingy on dates but brags about spending on himself = -30 (selfish)
   - He offers to pay but respects if she wants to split = +15 (balanced)
   - He uses money to control or impress excessively = -25 (manipulation)
   - He's transparent about financial situation = +10 (honest)

5. RESPECT & BOUNDARIES:
   - He pushes physical boundaries = -50 (CONSENT ISSUE)
   - He sulks when she says no to anything = -35 (manipulation)
   - He respects her "no" without guilt-tripping = +25 (healthy)
   - He asks for consent explicitly = +20 (respectful)
   - He pressures for exclusivity too fast = -20 (rushing)
   - He respects her need for space = +15 (secure attachment)

6. EX & JEALOUSY PATTERNS:
   - He trash-talks all his exes = -30 (pattern of blame)
   - He's still entangled with an ex = -40 (unavailable)
   - He gets jealous of her male friends = -25 (insecurity/control)
   - He checks her phone or social media = -50 (controlling behavior)
   - He speaks neutrally about past relationships = +10 (maturity)
   - He's comfortable with her having male friends = +15 (secure)

7. LIFE STAGE & GOALS ALIGNMENT:
   - He's not over his party phase, she wants stability = -35 (maturity mismatch)
   - He's vague about the future = -20 (avoidance)
   - He has clear goals aligned with hers = +25 (compatible vision)
   - He's actively working on himself = +20 (growth mindset)
   - He expects her to fit into his life with no compromise = -30 (inflexible)

8. RED FLAGS SPECIFIC TO HETERO MALE BEHAVIOR:
   - "I'm not like other guys" = -15 (performative)
   - Negging or backhanded compliments = -40 (manipulation)
   - "You're so mature for your age" (age gap) = -35 (grooming language)
   - Love bombing (excessive gifts/attention early) = -45 (manipulation tactic)
   - Hot and cold behavior = -35 (emotional unavailability)
   - "My ex was crazy" (about multiple exes) = -30 (red flag pattern)
   - "I don't do labels" when she wants commitment = -40 (avoidance)
   - Criticizes her appearance = -45 (negging/control)
   - Compares her to other women = -35 (disrespectful)
   - Gets angry when she doesn't respond fast = -40 (controlling)

9. POSITIVE INDICATORS FOR HETERO MEN:
   - Introduces her to friends/family = +25 (investment)
   - Makes her feel safe = +30 (security)
   - Supports her goals and ambitions = +25 (partner energy)
   - Takes accountability for mistakes = +20 (maturity)
   - Consistent communication patterns = +20 (reliability)
   - Shows interest in her life beyond romance = +15 (genuine interest)
   - Handles rejection/conflict gracefully = +25 (emotional regulation)

10. INTIMACY & PHYSICAL EXPECTATIONS:
    - Pressures for intimacy before she's ready = -50 (BOUNDARY VIOLATION)
    - Gets upset about waiting = -30 (entitlement)
    - Respects her timeline completely = +25 (respect)
    - Focuses on her pleasure, not just his = +20 (considerate)
    - Uses intimacy as reward/punishment = -40 (manipulation)
    - Open communication about intimacy = +20 (healthy)

11. LONG-TERM VIABILITY SIGNALS:
    - He sees partnership as 50/50 = +25 (equality)
    - He expects traditional gender roles rigidly = -20 to +10 (depends on her preference)
    - He's willing to do domestic tasks = +15 (partnership)
    - He respects her career ambitions = +20 (supportive)
    - He wants kids on similar timeline = +25 (aligned)
    - He dismisses her career for "future family" = -35 (outdated/controlling)

MLM (MEN LOVING MEN) SPECIFIC SCORING MATRIX:
1. GAY MEN DATING GAY MEN - Core Match Quality:
   - Gay man + Gay man = Perfect match (+25 baseline)
   - Gay man + Bi man (dates men) = Good match (+20) - verify bi-acceptance
   - Gay man + Pansexual/Queer man = Good match (+18)
   - Gay man + "Discreet/DL" man = Compatibility varies (-15 to +10) - flag outness mismatch
   - Gay man + Heteroflexible = Uncertain (-10) - commitment uncertainty concern
   - Gay man + Straight-identified MSM = High risk (-40) - identity conflict modal

2. BISEXUAL MEN CONSIDERATIONS:
   - Bi man + Bi man = Excellent (+25-30) - shared identity understanding
   - Watch for BIPHOBIA patterns that should tank score:
     * "Bi guys always cheat" = -70 (biphobia detected)
     * "You'll leave me for a woman" = -50 (bi erasure)
     * "Just pick a side" = -55 (identity invalidation)
     * "I don't date bi guys" = filter out entirely
     * Questions fidelity due to bi identity = -45
   - POSITIVE: Openly supportive of bi identity = +20 bonus

3. GAY/BI MEN DATING TRANS MEN:
   - User "dates all men" + Trans man = Good match (+20)
   - User explicitly dates trans men = +25 but VERIFY not a chaser
   - User "cis men only" + Trans man = No match (filter out)
   - CHASER DETECTION (red flags):
     * Fetishizes trans identity = -60
     * Asks invasive surgery questions early = -45
     * Focuses only on genitals = -55
     * Uses slurs or deadnames = -80 (TRANSPHOBIA DETECTED modal)
     * Misgenders deliberately = -80 (SAFETY CONCERN modal)
   - POSITIVE indicators:
     * Educated about trans issues = +15
     * Has dated trans men respectfully before = +20
     * Active trans ally = +25

4. GAY/BI MEN DATING TRANS WOMEN:
   - Gay man (men only) + Trans woman = Orientation mismatch (filter out)
   - Bi/Pan man + Trans woman = Compatible (+20-22)
   - SAFETY red flags for trans women:
     * Only contacts late night/secretively = -45 (secret relationship)
     * History of violence toward trans people = -100 (SAFETY DANGER)
     * Trans panic defense mentioned = -100 (IMMEDIATE SAFETY RISK)
     * Anger when trans status disclosed = -80 (violence risk)
   - POSITIVE: Trans-affirming past relationships = +20

5. SEXUAL ROLE/POSITION COMPATIBILITY (MLM-specific):
   - Top (exclusive) + Bottom (exclusive) = Ideal match (+25)
   - Versatile + Versatile = Great flexibility (+25)
   - Versatile + Top or Bottom = Works well (+20)
   - Top + Top or Bottom + Bottom = Position mismatch (-30)
   - Side (no penetration) + Side = Aligned (+25)
   - Side + Penetration-focused = Mismatch (-25)

6. OUTNESS COMPATIBILITY:
   - Both fully out = Aligned (+25)
   - Fully out + Closeted at work = Medium risk (+5)
   - Fully out + Mostly closeted = Mismatch (-20)
   - Fully out + Completely closeted = Significant mismatch (-40)
   - Both closeted for safety = Mutual understanding (+15)

7. HIV/PrEP & SEXUAL HEALTH:
   - U=U (Undetectable = Untransmittable) is medically established - reduce stigma
   - HIV+ undetectable + Educated partner = +15 (informed partner)
   - Any + Stigmatizing HIV response = -50
   - Any + "I don't date poz guys" = -60 (serophobia)
   - On PrEP + Supports PrEP = +10 (health-conscious)
   - Any + Shames PrEP use = -30
   - Condom use required + Pushes for bareback = -50 (BOUNDARY VIOLATION)

8. MLM-SPECIFIC RED FLAGS:
   - Using outness as leverage/outing threats = -80 (OUTING THREAT modal)
   - Isolating from LGBTQ+ community = -70 (ISOLATION TACTIC)
   - Love bombing + quick commitment in MLM context = -60
   - Age gap + financial dependence = -50 (power imbalance risk)
   - "Daddy/boy" dynamic with unhealthy control = -35
   - Chemsex expectations forced = -60 (substance pressure)
   - Internalized homophobia patterns:
     * "I'm not like other gays" = -25
     * Shames effeminate men = -40
     * "Masc4masc only" with rigid disdain = -20

9. TRANS-SPECIFIC DATING CONSIDERATIONS:
   - Disclosure timing respected = +20
   - Public acknowledgment (willing to be seen together) = +15
   - Consistent correct pronouns = +15
   - Misgenders "by accident" often = -30
   - Pressures surgery decisions = -45 (body autonomy violation)
   - Fetishizes transition stage = -50 (chaser behavior)

10. INTERSECTIONALITY FACTORS:
    - Racial fetishization ("I only date [race]") = -50 to -60
    - "No [race]" in profile = -100 (racism - filter out)
    - Uses racial slurs/stereotypes = -80 (RACISM DETECTED)
    - Body shaming comments = -40
    - Fetishizes body type (chaser behavior) = -35

11. SUCCESS PATTERN COMBINATIONS (apply bonuses):
    - Out + community-connected + healthy boundaries = +45
    - Trans-affirming + educated + patient + respectful = +50
    - Bi-affirming + secure + no jealousy about orientation = +40
    - HIV-educated + no stigma + health-conscious = +35
    - Position compatible + open communication + flexibility = +35

If there's a mismatch between user's "interested in" preferences and candidate's gender, flag this as a fundamental incompatibility.
Non-binary users: recognize diverse relationship dynamics and gender expression compatibility.

CRITICAL: In all output text (strengths, concerns, advice), use natural human language. Never output values like "definitely_yes" - always write "definitely wants" or similar human phrases.`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are D.E.V.I., a warm relationship coach. Be conversational and direct. Use provided sentiment-adjusted scores as your foundation. NEVER increase the score above the sentiment-adjusted score when there are negative interactions. Only say 'you both' when BOTH profiles have explicit info for that point; otherwise say 'You...' or 'Unknown whether...'. Keep responses concise." },
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
                    description: `List of 2-4 strengths. ONLY say "you both" when BOTH profiles have explicit data for that point. If candidate data is missing, write "You ..." and/or "Unknown whether ${candidate.nickname} ...".`
                  },
                  concerns: {
                    type: "array",
                    items: { type: "string" },
                    description: `List of 2-4 concerns or red flags. ONLY say "you both" when BOTH profiles have explicit data for that point. If candidate data is missing, frame as "Unknown whether ${candidate.nickname} ..." rather than assuming similarity.`
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

    // Guardrail: fix common "you both" claims that contradict the actual profile data.
    enforceEducationConsistency(analysis, profile, candidate);

    // Track previous score for comparison
    const previousScore = candidate.compatibility_score;

    // CRITICAL BUG FIX: Prevent dramatic score increases
    // If there was a previous score that was low (under 25%), it was low for a reason
    // (relationship-ending patterns, red flags, etc.). We must prevent the AI from
    // ignoring this and jumping to a high score.
    const previousScoreNum = typeof previousScore === "number" ? Math.round(previousScore) : null;
    
    // ENFORCE SCORE LIMITS in multiple scenarios:
    
    // 0. CRITICAL: If relationship-ending patterns are detected, FORCE score down to cap
    // This fixes the bug where score went to 83% but should be capped at 20%
    if (shouldEndRelationship && analysis.overall_score > sentimentAdjustedOverall) {
      console.log(`FORCING SCORE DOWN: Relationship-ending pattern detected. AI suggested ${analysis.overall_score}%, forcing to ${sentimentAdjustedOverall}%`);
      analysis.overall_score = sentimentAdjustedOverall;
    }
    
    // 1. If there are negative interactions, cap the score
    if (negativeCount > 0 && analysis.overall_score > sentimentAdjustedOverall) {
      console.log(`Capping AI score from ${analysis.overall_score} to ${sentimentAdjustedOverall} due to ${negativeCount} negative interactions`);
      analysis.overall_score = sentimentAdjustedOverall;
    }
    
    // 2. CRITICAL: If previous score was low (under 25%), prevent jumping more than +3 points
    // This prevents the AI from "forgetting" why the score was low
    if (previousScoreNum !== null && previousScoreNum < 25 && analysis.overall_score > previousScoreNum + 3) {
      const maxAllowed = previousScoreNum + 3;
      console.log(`PREVENTING SCORE JUMP: Previous was ${previousScoreNum}%, AI suggested ${analysis.overall_score}%, capping to ${maxAllowed}%`);
      analysis.overall_score = maxAllowed;
    }
    
    // 3. If previous score was between 25-40%, prevent jumping more than +5 points
    if (previousScoreNum !== null && previousScoreNum >= 25 && previousScoreNum < 40 && analysis.overall_score > previousScoreNum + 5) {
      const maxAllowed = previousScoreNum + 5;
      console.log(`PREVENTING MODERATE SCORE JUMP: Previous was ${previousScoreNum}%, AI suggested ${analysis.overall_score}%, capping to ${maxAllowed}%`);
      analysis.overall_score = maxAllowed;
    }
    
    // 4. Also cap emotional compatibility if there are negative interactions
    if (negativeCount > 0 && analysis.breakdown?.emotional_compatibility > adjustedEmotionalScore) {
      analysis.breakdown.emotional_compatibility = adjustedEmotionalScore;
    }
    
    // 5. Force emotional score down if relationship should end
    if (shouldEndRelationship && analysis.breakdown?.emotional_compatibility > adjustedEmotionalScore) {
      analysis.breakdown.emotional_compatibility = adjustedEmotionalScore;
    }

    // If the relationship is in a "low cap" state but the user is logging a consistent
    // recovery streak, ensure the score goes up by exactly +1 (very gradual).
    // Max cap is now 20 (not 45) to keep recovery slow.
    if (
      shouldEndRelationship &&
      typeof previousScoreNum === "number" &&
      recentPositiveStreak >= 3
    ) {
      const maxCap = Math.min(20, 5 + recoveryBonusFromStreak);
      const nudged = Math.min(maxCap, previousScoreNum + 1);

      if (typeof analysis.overall_score === "number" && analysis.overall_score < nudged) {
        console.log(
          `NUDGE: increasing score from ${analysis.overall_score} to ${nudged} due to recovery streak ${recentPositiveStreak}`
        );
        analysis.overall_score = nudged;
      }
    }

    const scoreChanged = previousScore !== analysis.overall_score;

    // Only update if we have a valid score
    if (analysis.overall_score !== undefined && analysis.overall_score !== null) {
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

      // Log an interaction to record this score update
      if (scoreChanged && previousScore !== null && previousScore !== undefined) {
        const changeDirection = analysis.overall_score > previousScore ? "increased" : "decreased";
        const changeAmount = Math.abs(analysis.overall_score - previousScore);
        
        const { error: interactionError } = await supabase
          .from("interactions")
          .insert({
            candidate_id: candidateId,
            user_id: candidate.user_id,
            interaction_type: "texting", // Using texting as a neutral interaction type
            interaction_date: new Date().toISOString().split("T")[0],
            notes: `D.E.V.I. Score Update: ${previousScore}% → ${analysis.overall_score}% (${changeDirection} by ${changeAmount} points)`,
            gut_feeling: analysis.overall_score >= 70 ? "hopeful" : analysis.overall_score >= 40 ? "curious" : "cautious",
            overall_feeling: analysis.overall_score >= 70 ? 4 : analysis.overall_score >= 40 ? 3 : 2,
          });

        if (interactionError) {
          console.error("Failed to log score update interaction:", interactionError);
        } else {
          console.log(`Logged score update interaction: ${previousScore}% → ${analysis.overall_score}%`);
        }
      }
    } else {
      console.log("Score is undefined, keeping existing score");
    }

    // Include previous score in response for UI to show change
    return new Response(JSON.stringify({
      ...analysis,
      previous_score: previousScore,
      score_changed: scoreChanged
    }), {
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
// BALANCED SCORING: Start at 50 — neutral profiles deserve a neutral score, not a failing grade
function calculateBaseScores(profile: any, candidate: any) {
  let valuesScore = 50;
  let lifestyleScore = 50;
  let emotionalScore = 50;
  let futureGoalsScore = 50;

  
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