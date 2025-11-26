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

export interface CrisisDetectionResult {
  detected: boolean;
  keywords: string[];
  severity: "moderate" | "severe";
}

export function detectCrisisContent(text: string): CrisisDetectionResult {
  if (!text) return { detected: false, keywords: [], severity: "moderate" };
  
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];
  
  for (const keyword of CRISIS_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }
  
  // Determine severity
  const severeKeywords = ["suicidal", "suicide", "kill myself", "end my life", "want to die"];
  const hasSevere = foundKeywords.some(k => severeKeywords.includes(k.toLowerCase()));
  
  return {
    detected: foundKeywords.length > 0,
    keywords: foundKeywords,
    severity: hasSevere ? "severe" : "moderate",
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
