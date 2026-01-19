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
  
  const descriptions = COMPATIBILITY_DESCRIPTIONS[compatibility.level];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  
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
  
  return {
    level: compatibility.level,
    percentage: compatibility.percentage,
    description,
    strengths,
    challenges,
  };
}
