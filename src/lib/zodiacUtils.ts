// Zodiac sign utilities for entertainment purposes only

export const ZODIAC_SIGNS = [
  { value: "aries", label: "Aries", symbol: "♈", dates: "Mar 21 - Apr 19" },
  { value: "taurus", label: "Taurus", symbol: "♉", dates: "Apr 20 - May 20" },
  { value: "gemini", label: "Gemini", symbol: "♊", dates: "May 21 - Jun 20" },
  { value: "cancer", label: "Cancer", symbol: "♋", dates: "Jun 21 - Jul 22" },
  { value: "leo", label: "Leo", symbol: "♌", dates: "Jul 23 - Aug 22" },
  { value: "virgo", label: "Virgo", symbol: "♍", dates: "Aug 23 - Sep 22" },
  { value: "libra", label: "Libra", symbol: "♎", dates: "Sep 23 - Oct 22" },
  { value: "scorpio", label: "Scorpio", symbol: "♏", dates: "Oct 23 - Nov 21" },
  { value: "sagittarius", label: "Sagittarius", symbol: "♐", dates: "Nov 22 - Dec 21" },
  { value: "capricorn", label: "Capricorn", symbol: "♑", dates: "Dec 22 - Jan 19" },
  { value: "aquarius", label: "Aquarius", symbol: "♒", dates: "Jan 20 - Feb 18" },
  { value: "pisces", label: "Pisces", symbol: "♓", dates: "Feb 19 - Mar 20" },
];

export function getZodiacFromBirthDate(birthDate: string): string | null {
  if (!birthDate) return null;
  
  const date = new Date(birthDate);
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "pisces";
  
  return null;
}

export function getZodiacSymbol(sign: string | null): string {
  if (!sign) return "";
  const zodiac = ZODIAC_SIGNS.find(z => z.value === sign.toLowerCase());
  return zodiac?.symbol || "";
}

export function getZodiacLabel(sign: string | null): string {
  if (!sign) return "";
  const zodiac = ZODIAC_SIGNS.find(z => z.value === sign.toLowerCase());
  return zodiac?.label || sign;
}

// Horoscope compatibility data (for entertainment only)
type CompatibilityLevel = "high" | "medium" | "low" | "challenging";

interface CompatibilityResult {
  level: CompatibilityLevel;
  percentage: number;
  description: string;
  strengths: string[];
  challenges: string[];
  loveAdvice: string;
  communicationTip: string;
  dateIdea: string;
}

interface WeeklyPrediction {
  theme: string;
  loveEnergy: "high" | "medium" | "low";
  advice: string;
  luckyDay: string;
  focusArea: string;
}

// Traditional astrological compatibility based on elements
// Fire: Aries, Leo, Sagittarius
// Earth: Taurus, Virgo, Capricorn
// Air: Gemini, Libra, Aquarius
// Water: Cancer, Scorpio, Pisces

const COMPATIBILITY_MATRIX: Record<string, Record<string, { level: CompatibilityLevel; percentage: number }>> = {
  aries: {
    aries: { level: "high", percentage: 85 },
    taurus: { level: "medium", percentage: 65 },
    gemini: { level: "high", percentage: 83 },
    cancer: { level: "challenging", percentage: 42 },
    leo: { level: "high", percentage: 93 },
    virgo: { level: "medium", percentage: 58 },
    libra: { level: "medium", percentage: 75 },
    scorpio: { level: "challenging", percentage: 50 },
    sagittarius: { level: "high", percentage: 95 },
    capricorn: { level: "challenging", percentage: 47 },
    aquarius: { level: "high", percentage: 88 },
    pisces: { level: "medium", percentage: 67 },
  },
  taurus: {
    aries: { level: "medium", percentage: 65 },
    taurus: { level: "high", percentage: 90 },
    gemini: { level: "challenging", percentage: 45 },
    cancer: { level: "high", percentage: 92 },
    leo: { level: "medium", percentage: 70 },
    virgo: { level: "high", percentage: 95 },
    libra: { level: "medium", percentage: 72 },
    scorpio: { level: "high", percentage: 88 },
    sagittarius: { level: "challenging", percentage: 48 },
    capricorn: { level: "high", percentage: 97 },
    aquarius: { level: "challenging", percentage: 40 },
    pisces: { level: "high", percentage: 85 },
  },
  gemini: {
    aries: { level: "high", percentage: 83 },
    taurus: { level: "challenging", percentage: 45 },
    gemini: { level: "high", percentage: 82 },
    cancer: { level: "medium", percentage: 60 },
    leo: { level: "high", percentage: 88 },
    virgo: { level: "medium", percentage: 68 },
    libra: { level: "high", percentage: 93 },
    scorpio: { level: "challenging", percentage: 48 },
    sagittarius: { level: "high", percentage: 78 },
    capricorn: { level: "medium", percentage: 55 },
    aquarius: { level: "high", percentage: 95 },
    pisces: { level: "medium", percentage: 62 },
  },
  cancer: {
    aries: { level: "challenging", percentage: 42 },
    taurus: { level: "high", percentage: 92 },
    gemini: { level: "medium", percentage: 60 },
    cancer: { level: "high", percentage: 88 },
    leo: { level: "medium", percentage: 65 },
    virgo: { level: "high", percentage: 90 },
    libra: { level: "medium", percentage: 58 },
    scorpio: { level: "high", percentage: 94 },
    sagittarius: { level: "challenging", percentage: 45 },
    capricorn: { level: "high", percentage: 83 },
    aquarius: { level: "challenging", percentage: 42 },
    pisces: { level: "high", percentage: 97 },
  },
  leo: {
    aries: { level: "high", percentage: 93 },
    taurus: { level: "medium", percentage: 70 },
    gemini: { level: "high", percentage: 88 },
    cancer: { level: "medium", percentage: 65 },
    leo: { level: "high", percentage: 82 },
    virgo: { level: "medium", percentage: 58 },
    libra: { level: "high", percentage: 90 },
    scorpio: { level: "medium", percentage: 72 },
    sagittarius: { level: "high", percentage: 97 },
    capricorn: { level: "challenging", percentage: 50 },
    aquarius: { level: "medium", percentage: 75 },
    pisces: { level: "medium", percentage: 60 },
  },
  virgo: {
    aries: { level: "medium", percentage: 58 },
    taurus: { level: "high", percentage: 95 },
    gemini: { level: "medium", percentage: 68 },
    cancer: { level: "high", percentage: 90 },
    leo: { level: "medium", percentage: 58 },
    virgo: { level: "high", percentage: 88 },
    libra: { level: "medium", percentage: 65 },
    scorpio: { level: "high", percentage: 92 },
    sagittarius: { level: "challenging", percentage: 48 },
    capricorn: { level: "high", percentage: 97 },
    aquarius: { level: "challenging", percentage: 45 },
    pisces: { level: "medium", percentage: 78 },
  },
  libra: {
    aries: { level: "medium", percentage: 75 },
    taurus: { level: "medium", percentage: 72 },
    gemini: { level: "high", percentage: 93 },
    cancer: { level: "medium", percentage: 58 },
    leo: { level: "high", percentage: 90 },
    virgo: { level: "medium", percentage: 65 },
    libra: { level: "high", percentage: 85 },
    scorpio: { level: "medium", percentage: 70 },
    sagittarius: { level: "high", percentage: 88 },
    capricorn: { level: "medium", percentage: 62 },
    aquarius: { level: "high", percentage: 97 },
    pisces: { level: "medium", percentage: 68 },
  },
  scorpio: {
    aries: { level: "challenging", percentage: 50 },
    taurus: { level: "high", percentage: 88 },
    gemini: { level: "challenging", percentage: 48 },
    cancer: { level: "high", percentage: 94 },
    leo: { level: "medium", percentage: 72 },
    virgo: { level: "high", percentage: 92 },
    libra: { level: "medium", percentage: 70 },
    scorpio: { level: "high", percentage: 90 },
    sagittarius: { level: "medium", percentage: 58 },
    capricorn: { level: "high", percentage: 93 },
    aquarius: { level: "challenging", percentage: 45 },
    pisces: { level: "high", percentage: 97 },
  },
  sagittarius: {
    aries: { level: "high", percentage: 95 },
    taurus: { level: "challenging", percentage: 48 },
    gemini: { level: "high", percentage: 78 },
    cancer: { level: "challenging", percentage: 45 },
    leo: { level: "high", percentage: 97 },
    virgo: { level: "challenging", percentage: 48 },
    libra: { level: "high", percentage: 88 },
    scorpio: { level: "medium", percentage: 58 },
    sagittarius: { level: "high", percentage: 90 },
    capricorn: { level: "medium", percentage: 60 },
    aquarius: { level: "high", percentage: 93 },
    pisces: { level: "medium", percentage: 65 },
  },
  capricorn: {
    aries: { level: "challenging", percentage: 47 },
    taurus: { level: "high", percentage: 97 },
    gemini: { level: "medium", percentage: 55 },
    cancer: { level: "high", percentage: 83 },
    leo: { level: "challenging", percentage: 50 },
    virgo: { level: "high", percentage: 97 },
    libra: { level: "medium", percentage: 62 },
    scorpio: { level: "high", percentage: 93 },
    sagittarius: { level: "medium", percentage: 60 },
    capricorn: { level: "high", percentage: 88 },
    aquarius: { level: "medium", percentage: 65 },
    pisces: { level: "high", percentage: 85 },
  },
  aquarius: {
    aries: { level: "high", percentage: 88 },
    taurus: { level: "challenging", percentage: 40 },
    gemini: { level: "high", percentage: 95 },
    cancer: { level: "challenging", percentage: 42 },
    leo: { level: "medium", percentage: 75 },
    virgo: { level: "challenging", percentage: 45 },
    libra: { level: "high", percentage: 97 },
    scorpio: { level: "challenging", percentage: 45 },
    sagittarius: { level: "high", percentage: 93 },
    capricorn: { level: "medium", percentage: 65 },
    aquarius: { level: "high", percentage: 90 },
    pisces: { level: "medium", percentage: 68 },
  },
  pisces: {
    aries: { level: "medium", percentage: 67 },
    taurus: { level: "high", percentage: 85 },
    gemini: { level: "medium", percentage: 62 },
    cancer: { level: "high", percentage: 97 },
    leo: { level: "medium", percentage: 60 },
    virgo: { level: "medium", percentage: 78 },
    libra: { level: "medium", percentage: 68 },
    scorpio: { level: "high", percentage: 97 },
    sagittarius: { level: "medium", percentage: 65 },
    capricorn: { level: "high", percentage: 85 },
    aquarius: { level: "medium", percentage: 68 },
    pisces: { level: "high", percentage: 92 },
  },
};

const COMPATIBILITY_DESCRIPTIONS: Record<CompatibilityLevel, string[]> = {
  high: [
    "Strong natural connection with great potential for understanding",
    "Your energies complement each other beautifully",
    "A classic pairing with natural chemistry",
  ],
  medium: [
    "A balanced match that requires mutual effort",
    "Different perspectives can enrich your connection",
    "Potential for growth through understanding differences",
  ],
  low: [
    "May require extra patience and understanding",
    "Different approaches to life can be challenging",
    "Success depends on mutual respect and communication",
  ],
  challenging: [
    "Opposite energies that can attract or repel",
    "Requires significant effort to understand each other",
    "Growth potential through overcoming differences",
  ],
};

const ELEMENT_STRENGTHS: Record<string, string[]> = {
  fire: ["Passion", "Adventure", "Spontaneity", "Confidence"],
  earth: ["Stability", "Reliability", "Sensuality", "Practicality"],
  air: ["Communication", "Intellectual connection", "Flexibility", "Social harmony"],
  water: ["Emotional depth", "Intuition", "Nurturing", "Romantic"],
};

const ELEMENT_MAP: Record<string, string> = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};

// Love advice by pairing type
const LOVE_ADVICE: Record<string, string[]> = {
  "fire-fire": [
    "Keep the spark alive with spontaneous adventures",
    "Give each other space to shine individually",
    "Channel competitive energy into shared goals",
  ],
  "fire-earth": [
    "Fire can inspire Earth to take more risks",
    "Earth helps ground Fire's impulsive nature",
    "Balance excitement with stability",
  ],
  "fire-air": [
    "An exciting match! Air fans Fire's flames",
    "Stay connected through deep conversations",
    "Support each other's independence",
  ],
  "fire-water": [
    "Fire can help Water come out of their shell",
    "Water teaches Fire emotional depth",
    "Practice patience with different communication styles",
  ],
  "earth-earth": [
    "Build a secure foundation together",
    "Don't forget to add excitement and novelty",
    "Share your practical dreams and plans",
  ],
  "earth-air": [
    "Earth provides grounding for Air's ideas",
    "Air helps Earth see new perspectives",
    "Find balance between routine and spontaneity",
  ],
  "earth-water": [
    "A nurturing and stable combination",
    "Create a comfortable sanctuary together",
    "Express emotions openly despite Earth's reserve",
  ],
  "air-air": [
    "Endless conversations and intellectual connection",
    "Remember to ground dreams in reality",
    "Give each other emotional reassurance",
  ],
  "air-water": [
    "Air can help Water communicate feelings",
    "Water teaches Air emotional intelligence",
    "Be patient with different processing styles",
  ],
  "water-water": [
    "Deep emotional understanding and intuition",
    "Create healthy boundaries to avoid codependency",
    "Channel emotions into creative expression together",
  ],
};

// Communication tips by sign
const COMMUNICATION_TIPS: Record<string, string> = {
  aries: "Be direct but patient—they appreciate honesty and quick resolution",
  taurus: "Give them time to process—rushing leads to stubbornness",
  gemini: "Keep it interesting—variety and mental stimulation are key",
  cancer: "Create emotional safety—they need to feel secure to open up",
  leo: "Acknowledge their feelings first—appreciation goes a long way",
  virgo: "Be specific and practical—vague statements cause anxiety",
  libra: "Stay balanced and fair—they hate conflict and one-sidedness",
  scorpio: "Be authentic—they can sense insincerity immediately",
  sagittarius: "Keep it light and optimistic—heavy talks need humor breaks",
  capricorn: "Show respect for their time—be organized and purposeful",
  aquarius: "Appeal to logic first—emotions can follow understanding",
  pisces: "Be gentle and compassionate—harsh words wound deeply",
};

// Date ideas by element pairing
const DATE_IDEAS: Record<string, string[]> = {
  "fire-fire": ["Adventure sports", "Dance class", "Road trip", "Competitive games night"],
  "fire-earth": ["Hiking with a picnic", "Cooking class", "Wine tasting", "Home improvement project together"],
  "fire-air": ["Art gallery hopping", "Comedy show", "Karaoke night", "Travel planning date"],
  "fire-water": ["Sunset beach walk", "Spa day", "Romantic dinner", "Stargazing"],
  "earth-earth": ["Farmers market & cooking", "Pottery class", "Garden date", "Financial planning + nice dinner"],
  "earth-air": ["Museum visit", "Book club for two", "Escape room", "Trying new restaurants"],
  "earth-water": ["Cozy movie night in", "Couples massage", "Aquarium visit", "Baking together"],
  "air-air": ["Trivia night", "Poetry reading", "Group social event", "Learning something new together"],
  "air-water": ["Music concert", "Beach bonfire", "Art therapy class", "Deep conversation café date"],
  "water-water": ["Candlelit dinner at home", "Nature retreat", "Couples meditation", "Memory scrapbook making"],
};

// Weekly themes based on planetary energy (simplified, rotates weekly)
const WEEKLY_THEMES = [
  { theme: "Communication", focusArea: "Express your feelings openly this week", luckyDay: "Wednesday" },
  { theme: "Romance", focusArea: "Small gestures of love have big impact", luckyDay: "Friday" },
  { theme: "Growth", focusArea: "Work through a challenge together", luckyDay: "Tuesday" },
  { theme: "Adventure", focusArea: "Try something new as a couple", luckyDay: "Saturday" },
  { theme: "Intimacy", focusArea: "Deepen your emotional connection", luckyDay: "Sunday" },
  { theme: "Harmony", focusArea: "Find balance in give and take", luckyDay: "Thursday" },
  { theme: "Passion", focusArea: "Reignite the spark with spontaneity", luckyDay: "Monday" },
];

const WEEKLY_ADVICE_BY_LEVEL: Record<CompatibilityLevel, string[]> = {
  high: [
    "The stars align in your favor! Use this energy to deepen your bond.",
    "Your natural chemistry is amplified—plan something special together.",
    "Trust flows easily now—share something vulnerable with each other.",
  ],
  medium: [
    "This is a week for understanding differences and finding common ground.",
    "Focus on quality time—even small moments can strengthen your connection.",
    "A good week to practice active listening and patience.",
  ],
  low: [
    "Take it slow this week—small steps lead to big breakthroughs.",
    "Focus on one area of your relationship to improve together.",
    "Patience is your superpower right now—use it generously.",
  ],
  challenging: [
    "Challenges this week are opportunities for growth—embrace them.",
    "Give each other extra grace—everyone processes differently.",
    "Focus on what you appreciate about each other, not what frustrates you.",
  ],
};

function getElementPairing(element1: string, element2: string): string {
  const sorted = [element1, element2].sort();
  return `${sorted[0]}-${sorted[1]}`;
}

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

export function getHoroscopeCompatibility(
  userSign: string | null,
  partnerSign: string | null
): CompatibilityResult | null {
  if (!userSign || !partnerSign) return null;
  
  const user = userSign.toLowerCase();
  const partner = partnerSign.toLowerCase();
  
  const compatibility = COMPATIBILITY_MATRIX[user]?.[partner];
  if (!compatibility) return null;
  
  const userElement = ELEMENT_MAP[user];
  const partnerElement = ELEMENT_MAP[partner];
  const elementPairing = getElementPairing(userElement, partnerElement);
  
  // Use week number for deterministic weekly refresh
  const weekNum = getWeekNumber();
  
  const descriptions = COMPATIBILITY_DESCRIPTIONS[compatibility.level];
  const description = descriptions[weekNum % descriptions.length];
  
  // Build strengths based on shared or complementary elements
  const strengths: string[] = [];
  if (userElement === partnerElement) {
    strengths.push(`Shared ${userElement} energy creates natural understanding`);
    strengths.push(...ELEMENT_STRENGTHS[userElement].slice(0, 2));
  } else {
    strengths.push(`${getZodiacLabel(user)}'s ${userElement} energy brings ${ELEMENT_STRENGTHS[userElement][0].toLowerCase()}`);
    strengths.push(`${getZodiacLabel(partner)}'s ${partnerElement} energy brings ${ELEMENT_STRENGTHS[partnerElement][0].toLowerCase()}`);
  }
  
  // Build challenges based on different elements
  const challenges: string[] = [];
  if (userElement !== partnerElement) {
    if ((userElement === "fire" && partnerElement === "water") || 
        (userElement === "water" && partnerElement === "fire")) {
      challenges.push("Fire's intensity may overwhelm Water's sensitivity");
    } else if ((userElement === "earth" && partnerElement === "air") || 
               (userElement === "air" && partnerElement === "earth")) {
      challenges.push("Earth's practicality may clash with Air's abstract thinking");
    } else {
      challenges.push(`Balancing ${userElement} and ${partnerElement} energies`);
    }
  }
  challenges.push("Remember: compatibility is about effort, not just stars!");

  // Get love advice - refreshes weekly
  const adviceOptions = LOVE_ADVICE[elementPairing] || LOVE_ADVICE["fire-fire"];
  const loveAdvice = adviceOptions[weekNum % adviceOptions.length];

  // Get communication tip for partner
  const communicationTip = COMMUNICATION_TIPS[partner] || "Be open and honest in your communication";

  // Get date idea - refreshes weekly
  const dateIdeas = DATE_IDEAS[elementPairing] || DATE_IDEAS["fire-fire"];
  const dateIdea = dateIdeas[weekNum % dateIdeas.length];
  
  return {
    level: compatibility.level,
    percentage: compatibility.percentage,
    description,
    strengths,
    challenges,
    loveAdvice,
    communicationTip,
    dateIdea,
  };
}

export function getWeeklyPrediction(
  userSign: string | null,
  partnerSign: string | null
): WeeklyPrediction | null {
  if (!userSign || !partnerSign) return null;

  const user = userSign.toLowerCase();
  const partner = partnerSign.toLowerCase();
  
  const compatibility = COMPATIBILITY_MATRIX[user]?.[partner];
  if (!compatibility) return null;

  const weekNum = getWeekNumber();
  const weeklyTheme = WEEKLY_THEMES[weekNum % WEEKLY_THEMES.length];
  
  // Calculate love energy based on compatibility + weekly variance
  const baseEnergy = compatibility.percentage;
  const weeklyVariance = ((weekNum * 17) % 20) - 10; // -10 to +10
  const adjustedEnergy = Math.max(30, Math.min(100, baseEnergy + weeklyVariance));
  
  const loveEnergy: "high" | "medium" | "low" = 
    adjustedEnergy >= 75 ? "high" : 
    adjustedEnergy >= 50 ? "medium" : "low";

  const adviceOptions = WEEKLY_ADVICE_BY_LEVEL[compatibility.level];
  const advice = adviceOptions[weekNum % adviceOptions.length];

  return {
    theme: weeklyTheme.theme,
    loveEnergy,
    advice,
    luckyDay: weeklyTheme.luckyDay,
    focusArea: weeklyTheme.focusArea,
  };
}
