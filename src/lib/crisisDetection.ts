// Crisis keywords and phrases that should trigger SUPPORT alerts (not block)
// IMPORTANT: These should be specific phrases, not single words that could appear in normal dating context
const CRISIS_KEYWORDS = [
  // Suicidal ideation - these are specific enough
  "suicidal", "suicide", "kill myself", "end my life", "want to die", "don't want to live",
  "better off dead", "no reason to live", "end it all", "take my own life",
  // Self-harm - specific phrases
  "self harm", "self-harm", "cutting myself", "hurt myself", "hurting myself",
  // Abuse indicators - REQUIRE CONTEXT, use specific phrases only
  // Removed standalone "controlling", "abuse", "pressured", "coerced" - too vague
  "he hit me", "she hit me", "they hit me", "hits me", "hitting me", 
  "he's abusive", "she's abusive", "abusive relationship", "abusive partner",
  "violent toward me", "violent with me", "threatens to hurt me", "threatened to hurt me",
  "scared of him hurting", "scared of her hurting", "scared he will", "scared she will",
  "afraid he will hurt", "afraid she will hurt", "afraid of him hurting", "afraid of her hurting",
  "he controls me", "she controls me", "controls everything i do", "won't let me leave",
  "won't let me see", "isolating me from", "isolated me from",
  // Coercion - more specific phrases
  "forced me to", "forcing me to", "made me do things", "sexually coerced",
  // Danger indicators - keep these specific
  "stalking me", "he's stalking", "she's stalking", "my stalker", 
  "following me everywhere", "won't stop contacting me", "harassing me constantly",
];

// EMERGENCY keywords - should prompt call 911
const EMERGENCY_KEYWORDS = [
  "rape", "raped", "raping", "being raped", "he raped me", "she raped me",
  "sexual assault", "sexually assaulted", "being assaulted",
];

// Explicit harmful phrases that should ALWAYS be blocked (no context needed)
// NOTE: This is specifically for content involving MINORS or INCEST - not adult sexual content
const EXPLICIT_HARMFUL_KEYWORDS = [
  // Explicit harmful phrases involving minors
  "dating a minor", "dating underage", "attracted to minors", "attracted to children",
  "attracted to kids", "sexual with minor", "sexual with child", "inappropriate with minor",
  "inappropriate with child", "inappropriate with kid", "sex with minor", "sex with child",
  "sex with kid", "sexual contact with minor", "sexual contact with child",
  "sex with a child", "sex with a minor", "sex with a kid",
  // Incest - explicit harmful phrases
  "incest", "dating my sister", "dating my brother", "dating my mother", "dating my father",
  "dating my daughter", "dating my son", "dating my cousin", "dating family",
  "romantic with family", "sexual with family", "attracted to family",
  "in love with my sister", "in love with my brother", "in love with my mother",
  "in love with my father", "in love with my daughter", "in love with my son",
  "sleeping with my sister", "sleeping with my brother", "sleeping with my mother",
  "sleeping with my father", "sleeping with my daughter", "sleeping with my son",
  "sex with my sister", "sex with my brother", "sex with my mother",
  "sex with my father", "sex with my daughter", "sex with my son",
  // Other truly harmful content
  "pedophile", "pedophilia", "child abuse", "child exploitation",
  "sex trafficking", "human trafficking", "child porn", "child pornography",
  "molest", "molested", "molesting",
];

// Racial slurs that should ALWAYS be blocked - zero tolerance
// Users can discuss race/ethnicity freely, but slurs are never acceptable
const RACIAL_SLURS = [
  // Anti-Black slurs
  "nigger", "nigga", "nigg3r", "n1gger", "n1gga", "nig nog", "coon", "darkie", "jigaboo", "sambo", "spook",
  // Anti-Asian slurs
  "chink", "gook", "slant eye", "slanteye", "zipperhead", "ch1nk", "ching chong", "chinaman",
  // Anti-Latino/Hispanic slurs
  "wetback", "beaner", "spic", "sp1c",
  // Anti-Middle Eastern/South Asian slurs
  "raghead", "towelhead", "sand nigger", "camel jockey",
  // Anti-White slurs
  "cracker",
  // Anti-Indigenous slurs
  "redskin", "injun", "prairie nigger",
  // General ethnic slurs
  "kike", "hymie", "wop", "dago", "polack", "mick",
  // Anti-LGBTQ+ slurs
  "faggot", "fag", "f4ggot", "f4g", "dyke", "tranny", "tr4nny", "shemale", "she-male",
  "homo", "sodomite", "batty boy", "battyboy", "chi chi man", "chichi man",
  "moffie", "pansy", "fairy", "nancy boy", "poofter", "poof",
];

// Words that are ONLY harmful when combined with sexual/romantic context
// These MUST be about minors specifically
const CONTEXT_SENSITIVE_MINOR_TERMS = [
  "underage", "minor", "preteen",
  "child", "children",
  "young girl", "young boy", "little girl", "little boy",
];

// Sexual context words that make minor terms harmful
// NOTE: These are checked ONLY when combined with minor terms above
const SEXUAL_CONTEXT_FOR_MINORS = [
  "sex with", "sleep with", "sleeping with",
  "attracted to", "sexual with", "sexual relationship with",
  "hooking up with", "hook up with", "intimate with",
];

// Context words that make family terms harmful when combined
const HARMFUL_CONTEXT_WORDS = [
  "dating",
  "romantic",
  "romantic relationship with",
  "attracted to",
  "sexual",
  "sexual relationship with",
  "in love with",
  "sleep with",
  "sleeping with",
  "hook up with",
  "hooking up with",
  "had sex with",
  "having sex with",
  "sex with",
];

// Family terms that are only harmful in certain contexts
const FAMILY_TERMS = [
  "sister", "brother", "mother", "father", "mom", "dad", "daughter", "son",
  "cousin", "aunt", "uncle", "niece", "nephew", "grandma", "grandpa",
  "grandmother", "grandfather", "step-sister", "step-brother", "step-mother",
  "step-father", "stepmom", "stepdad", "half-sister", "half-brother",
];

export interface CrisisDetectionResult {
  detected: boolean;
  keywords: string[];
  severity: "moderate" | "severe";
  category?: "crisis" | "harmful_content" | "emergency";
}

function detectHarmfulFamilyContext(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundHarmful: string[] = [];
  
  for (const contextWord of HARMFUL_CONTEXT_WORDS) {
    for (const familyTerm of FAMILY_TERMS) {
      // Check for patterns like "dating my sister" or "attracted to my brother"
      const patterns = [
        `${contextWord} my ${familyTerm}`,
        `${contextWord} his ${familyTerm}`,
        `${contextWord} her ${familyTerm}`,
        `${contextWord} their ${familyTerm}`,
        `${contextWord} a ${familyTerm}`,
      ];
      
      for (const pattern of patterns) {
        if (lowerText.includes(pattern.toLowerCase())) {
          foundHarmful.push(`${contextWord} ${familyTerm}`);
        }
      }
    }
  }
  
  return foundHarmful;
}

function detectMinorSexualContext(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundHarmful: string[] = [];
  
  for (const minorTerm of CONTEXT_SENSITIVE_MINOR_TERMS) {
    if (lowerText.includes(minorTerm.toLowerCase())) {
      // Only flag if ALSO has explicit sexual context with the minor
      for (const sexualContext of SEXUAL_CONTEXT_FOR_MINORS) {
        // Check for patterns like "sex with a child" or "attracted to minors"
        const patterns = [
          `${sexualContext} ${minorTerm}`,
          `${sexualContext} a ${minorTerm}`,
          `${sexualContext} the ${minorTerm}`,
        ];
        
        for (const pattern of patterns) {
          if (lowerText.includes(pattern.toLowerCase())) {
            foundHarmful.push(`${sexualContext} ${minorTerm}`);
          }
        }
      }
    }
  }
  
  return foundHarmful;
}

export function detectCrisisContent(text: string): CrisisDetectionResult {
  if (!text) return { detected: false, keywords: [], severity: "moderate" };
  
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];
  const foundHarmful: string[] = [];
  const foundEmergency: string[] = [];
  
  // Check emergency keywords first (rape/assault - show 911)
  for (const keyword of EMERGENCY_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundEmergency.push(keyword);
    }
  }
  
  // If emergency detected, return immediately with emergency category
  if (foundEmergency.length > 0) {
    return {
      detected: true,
      keywords: foundEmergency,
      severity: "severe",
      category: "emergency",
    };
  }
  
  // Check crisis keywords (show support resources, don't block)
  for (const keyword of CRISIS_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }
  
  // Check for racial slurs (always blocked)
  for (const slur of RACIAL_SLURS) {
    if (lowerText.includes(slur.toLowerCase())) {
      foundHarmful.push(slur);
    }
  }

  // Check explicit harmful keywords (always blocked - minors/incest)
  for (const keyword of EXPLICIT_HARMFUL_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundHarmful.push(keyword);
    }
  }
  
  // Check for minor + sexual context combinations
  const minorSexualPatterns = detectMinorSexualContext(lowerText);
  foundHarmful.push(...minorSexualPatterns);
  
  // Check for harmful family context combinations
  const harmfulFamilyPatterns = detectHarmfulFamilyContext(lowerText);
  foundHarmful.push(...harmfulFamilyPatterns);
  
  // Determine severity and category
  const severeKeywords = ["suicidal", "suicide", "kill myself", "end my life", "want to die"];
  const hasSevereCrisis = foundKeywords.some(k => severeKeywords.includes(k.toLowerCase()));
  const hasHarmfulContent = foundHarmful.length > 0;
  
  // Harmful content is always severe and blocked
  if (hasHarmfulContent) {
    return {
      detected: true,
      keywords: [...new Set([...foundKeywords, ...foundHarmful])],
      severity: "severe",
      category: "harmful_content",
    };
  }
  
  // Crisis content shows resources but allows sending
  if (foundKeywords.length > 0) {
    return {
      detected: true,
      keywords: foundKeywords,
      severity: hasSevereCrisis ? "severe" : "moderate",
      category: "crisis",
    };
  }
  
  return {
    detected: false,
    keywords: [],
    severity: "moderate",
  };
}

export const CRISIS_RESOURCES = {
  emergency: {
    name: "Emergency Services",
    phone: "911",
    description: "Call 911 immediately if you are in danger",
  },
  suicide: {
    name: "National Suicide Prevention Lifeline",
    phone: "988",
    text: "Text HOME to 741741",
    url: "https://988lifeline.org",
  },
  domesticViolence: {
    name: "National Domestic Violence Hotline",
    phone: "1-800-799-7233",
    text: "Text START to 88788",
    url: "https://www.thehotline.org",
  },
  sexualAssault: {
    name: "RAINN Sexual Assault Hotline",
    phone: "1-800-656-4673",
    url: "https://www.rainn.org",
  },
  crisis: {
    name: "Crisis Text Line",
    phone: "Text HOME to 741741",
    url: "https://www.crisistextline.org",
  },
};
