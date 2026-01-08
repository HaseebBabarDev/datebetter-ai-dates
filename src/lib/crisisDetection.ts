// Crisis keywords and phrases that should trigger alerts
const CRISIS_KEYWORDS = [
  // Suicidal ideation
  "suicidal", "suicide", "kill myself", "end my life", "want to die", "don't want to live",
  "better off dead", "no reason to live", "end it all", "take my own life",
  // Self-harm
  "self harm", "self-harm", "cutting myself", "hurt myself", "hurting myself",
  // Abuse indicators
  "hit me", "hits me", "hitting me", "abusive", "abuse", "violent", "threatens me",
  "threatened me", "scared of him", "scared of her", "scared of them", "afraid of him",
  "afraid of her", "controls me", "controlling", "won't let me", "isolating me",
  // Coercion
  "forced me", "forcing me", "makes me", "made me do", "pressured", "coerced",
  // Danger indicators
  "stalking", "stalker", "following me", "won't leave me alone", "harassing",
];

// Explicit harmful phrases that should ALWAYS be blocked (no context needed)
const EXPLICIT_HARMFUL_KEYWORDS = [
  // Explicit harmful phrases involving minors (require explicit harmful context)
  "dating a minor", "dating underage", "attracted to minors", "attracted to children",
  "attracted to kids", "sexual with minor", "sexual with child", "inappropriate with minor",
  "inappropriate with child", "inappropriate with kid", "sex with minor", "sex with child",
  "sex with kid", "sexual contact with minor", "sexual contact with child",
  // Incest - explicit harmful phrases
  "incest", "dating my sister", "dating my brother", "dating my mother", "dating my father",
  "dating my daughter", "dating my son", "dating my cousin", "dating family",
  "romantic with family", "sexual with family", "attracted to family",
  "in love with my sister", "in love with my brother", "in love with my mother",
  "in love with my father", "in love with my daughter", "in love with my son",
  "sleeping with my sister", "sleeping with my brother", "sleeping with my mother",
  "sleeping with my father", "sleeping with my daughter", "sleeping with my son",
  // Sexual violence
  "rape", "raped", "raping", "sexual assault", "sexually assaulted", "molest",
  "molested", "molesting", "non-consensual sex", "forced sex",
  // Other harmful content
  "pedophile", "pedophilia", "child abuse", "child exploitation",
  "sex trafficking", "human trafficking", "child porn", "child pornography",
];

// Words that are ONLY harmful when combined with sexual/romantic context
const CONTEXT_SENSITIVE_TERMS = [
  // Minors / youth terms (NOT harmful by themselves)
  "underage", "minor", "preteen", "teen", "teenager",
  "child", "children", "kid", "kids",
  "young girl", "young boy", "little girl", "little boy",
];

// Sexual/romantic context words that make context-sensitive terms harmful
const SEXUAL_ROMANTIC_CONTEXT = [
  "dating", "date", "romantic", "attracted", "sexual",
  "sex with", "sleep with", "sleeping with",
  "hook up", "hooking up", "in love with",
];

// Context words that make family terms harmful when combined
// NOTE: Avoid overly broad terms like "relationship with" to prevent false positives
const HARMFUL_CONTEXT_WORDS = [
  "dating",
  "romantic",
  "romantic relationship with",
  "attracted",
  "sexual",
  "sexual relationship with",
  "in love with",
  "sleep with",
  "sleeping with",
  "hook up",
  "hooking up",
  "had sex with",
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
  category?: "crisis" | "harmful_content";
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

export function detectCrisisContent(text: string): CrisisDetectionResult {
  if (!text) return { detected: false, keywords: [], severity: "moderate" };
  
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];
  const foundHarmful: string[] = [];
  
  // Check crisis keywords
  for (const keyword of CRISIS_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }
  
  // Check explicit harmful keywords (always blocked)
  for (const keyword of EXPLICIT_HARMFUL_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundHarmful.push(keyword);
    }
  }
  
  // Check context-sensitive terms (only harmful with sexual/romantic context)
  for (const term of CONTEXT_SENSITIVE_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      // Check if sexual/romantic context is also present
      for (const context of SEXUAL_ROMANTIC_CONTEXT) {
        if (lowerText.includes(context.toLowerCase())) {
          foundHarmful.push(`${context} ${term}`);
          break;
        }
      }
    }
  }
  
  // Check for harmful family context combinations
  const harmfulFamilyPatterns = detectHarmfulFamilyContext(lowerText);
  foundHarmful.push(...harmfulFamilyPatterns);
  
  // Determine severity and category
  const severeKeywords = ["suicidal", "suicide", "kill myself", "end my life", "want to die"];
  const hasSevereCrisis = foundKeywords.some(k => severeKeywords.includes(k.toLowerCase()));
  const hasHarmfulContent = foundHarmful.length > 0;
  
  // Harmful content is always severe
  if (hasHarmfulContent) {
    return {
      detected: true,
      keywords: [...new Set([...foundKeywords, ...foundHarmful])],
      severity: "severe",
      category: "harmful_content",
    };
  }
  
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
  crisis: {
    name: "Crisis Text Line",
    phone: "Text HOME to 741741",
    url: "https://www.crisistextline.org",
  },
};
