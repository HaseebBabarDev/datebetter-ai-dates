/**
 * Auto-Disqualify Engine
 *
 * Rules are defined here. Users toggle them on/off in Settings.
 * Evaluation runs client-side whenever candidate data changes.
 */

export interface AutoDisqualifyRule {
  id: string;
  category: string;
  label: string;
  description: string;
  /** Minimum profile importance rating (1-5) required to show this rule. Omit = always show. */
  requiresImportanceField?: string;
  requiresImportanceMin?: number;
  enabled: boolean;
}

/** The master list of available rules with defaults */
export const DEFAULT_RULES: Omit<AutoDisqualifyRule, "enabled">[] = [
  // ── Religion ─────────────────────────────────────────────────
  {
    id: "religion_mismatch",
    category: "Religion & Faith",
    label: "Religion mismatch",
    description: "Disqualify if candidate's religion differs from yours (requires faith importance ≥ 4)",
    requiresImportanceField: "faith_importance",
    requiresImportanceMin: 4,
  },
  // ── Politics ─────────────────────────────────────────────────
  {
    id: "politics_mismatch",
    category: "Politics & Values",
    label: "Political mismatch",
    description: "Disqualify if candidate's politics are significantly different (requires politics importance ≥ 4)",
    requiresImportanceField: "politics_importance",
    requiresImportanceMin: 4,
  },
  // ── Substance Use ─────────────────────────────────────────────
  {
    id: "heavy_drinking",
    category: "Substance Use",
    label: "Heavy drinker",
    description: "Disqualify if candidate is noted as a heavy or daily drinker",
  },
  {
    id: "smoker",
    category: "Substance Use",
    label: "Smoker",
    description: "Disqualify if candidate smokes",
  },
  {
    id: "addiction",
    category: "Substance Use",
    label: "Addiction concerns",
    description: "Disqualify if candidate has addiction-related red flags",
  },
  // ── Behavior & Mental Health ──────────────────────────────────
  {
    id: "anger_issues",
    category: "Behavior & Mental Health",
    label: "Anger / aggression",
    description: "Disqualify if candidate has anger or aggressive behavior red flags",
  },
  {
    id: "narcissistic_traits",
    category: "Behavior & Mental Health",
    label: "Narcissistic traits",
    description: "Disqualify if candidate has narcissism-related red flags",
  },
  {
    id: "emotionally_unavailable",
    category: "Behavior & Mental Health",
    label: "Emotionally unavailable",
    description: "Disqualify if candidate has emotional unavailability red flags",
  },
  // ── Kids & Family ─────────────────────────────────────────────
  {
    id: "kids_mismatch",
    category: "Kids & Family",
    label: "Kids desire mismatch",
    description: "Disqualify if candidate's desire to have kids conflicts with yours",
  },
  // ── Relationship Structure ────────────────────────────────────
  {
    id: "not_relationship_minded",
    category: "Relationship Goals",
    label: "Not relationship-minded",
    description: "Disqualify if candidate is only looking for hookups or casual",
  },
  {
    id: "still_married",
    category: "Relationship Goals",
    label: "Currently married / in a relationship",
    description: "Disqualify if candidate's relationship status is married or in a relationship",
  },
  // ── Attachment ───────────────────────────────────────────────
  {
    id: "disorganized_attachment",
    category: "Attachment Style",
    label: "Disorganized attachment",
    description: "Disqualify if candidate has a disorganized attachment style",
  },
];

// ── Evaluation ───────────────────────────────────────────────────────────────

type CandidateData = {
  red_flags?: unknown;
  their_drinking?: string | null;
  their_smoking?: string | null;
  their_religion?: string | null;
  their_politics?: string | null;
  their_kids_desire?: string | null;
  their_relationship_goal?: string | null;
  their_relationship_status?: string | null;
  their_attachment_style?: string | null;
};

type ProfileData = {
  faith_importance?: number | null;
  politics_importance?: number | null;
  religion?: string | null;
  politics?: string | null;
  kids_desire?: string | null;
};

const INCOMPATIBLE_POLITICS: Record<string, string[]> = {
  very_liberal: ["very_conservative", "conservative"],
  liberal: ["very_conservative"],
  conservative: ["very_liberal"],
  very_conservative: ["very_liberal", "liberal"],
};

const INCOMPATIBLE_KIDS: Record<string, string[]> = {
  wants_kids: ["does_not_want_kids", "no_more_kids"],
  does_not_want_kids: ["wants_kids", "open_to_kids"],
  no_more_kids: ["wants_kids"],
};

function flagsContain(redFlags: unknown, ...keywords: string[]): boolean {
  if (!Array.isArray(redFlags)) return false;
  return redFlags.some((f) => {
    const str = String(f).toLowerCase();
    return keywords.some((kw) => str.includes(kw));
  });
}

export function evaluateAutoDisqualify(
  candidate: CandidateData,
  profile: ProfileData,
  enabledRuleIds: Set<string>
): { disqualified: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const flags = candidate.red_flags;

  if (enabledRuleIds.has("religion_mismatch")) {
    const importance = profile.faith_importance ?? 0;
    if (
      importance >= 4 &&
      candidate.their_religion &&
      profile.religion &&
      candidate.their_religion !== profile.religion
    ) {
      reasons.push("Religion mismatch");
    }
  }

  if (enabledRuleIds.has("politics_mismatch")) {
    const importance = profile.politics_importance ?? 0;
    if (importance >= 4 && candidate.their_politics && profile.politics) {
      const incompatible = INCOMPATIBLE_POLITICS[profile.politics] || [];
      if (incompatible.includes(candidate.their_politics)) {
        reasons.push("Political incompatibility");
      }
    }
  }

  if (enabledRuleIds.has("heavy_drinking")) {
    const drinking = (candidate.their_drinking || "").toLowerCase();
    if (["heavy", "daily", "alcoholic", "frequent"].some((v) => drinking.includes(v))) {
      reasons.push("Heavy drinker");
    }
    if (flagsContain(flags, "alcohol", "drinking", "alcoholic")) {
      reasons.push("Heavy drinker (flagged)");
    }
  }

  if (enabledRuleIds.has("smoker")) {
    const smoking = (candidate.their_smoking || "").toLowerCase();
    if (["yes", "heavy", "daily", "smoker"].some((v) => smoking.includes(v))) {
      reasons.push("Smoker");
    }
  }

  if (enabledRuleIds.has("addiction")) {
    if (flagsContain(flags, "addict", "substance", "drug", "gambling")) {
      reasons.push("Addiction concerns");
    }
  }

  if (enabledRuleIds.has("anger_issues")) {
    if (flagsContain(flags, "anger", "aggress", "violent", "abuse", "rage", "temper")) {
      reasons.push("Anger / aggression");
    }
  }

  if (enabledRuleIds.has("narcissistic_traits")) {
    if (flagsContain(flags, "narciss", "manipulat", "gaslightin", "control")) {
      reasons.push("Narcissistic traits");
    }
  }

  if (enabledRuleIds.has("emotionally_unavailable")) {
    if (flagsContain(flags, "emotionally unavailable", "avoidant", "cold", "distant", "walls up")) {
      reasons.push("Emotionally unavailable");
    }
  }

  if (enabledRuleIds.has("kids_mismatch")) {
    if (candidate.their_kids_desire && profile.kids_desire) {
      const incompatible = INCOMPATIBLE_KIDS[profile.kids_desire] || [];
      if (incompatible.includes(candidate.their_kids_desire)) {
        reasons.push("Kids desire mismatch");
      }
    }
  }

  if (enabledRuleIds.has("not_relationship_minded")) {
    const goal = (candidate.their_relationship_goal || "").toLowerCase();
    if (["hookup", "casual", "fwb", "friends_with_benefits", "just_fun"].some((v) => goal.includes(v))) {
      reasons.push("Not relationship-minded");
    }
  }

  if (enabledRuleIds.has("still_married")) {
    const status = (candidate.their_relationship_status || "").toLowerCase();
    if (["married", "in_a_relationship", "taken", "committed"].some((v) => status.includes(v))) {
      reasons.push("Currently married / in a relationship");
    }
  }

  if (enabledRuleIds.has("disorganized_attachment")) {
    if ((candidate.their_attachment_style || "").toLowerCase().includes("disorganized")) {
      reasons.push("Disorganized attachment style");
    }
  }

  // Deduplicate
  const unique = [...new Set(reasons)];
  return { disqualified: unique.length > 0, reasons: unique };
}

/** Merge saved user rules with defaults to produce a full rule list */
export function mergeRulesWithDefaults(savedRules: AutoDisqualifyRule[]): AutoDisqualifyRule[] {
  const savedMap = new Map(savedRules.map((r) => [r.id, r]));
  return DEFAULT_RULES.map((def) => ({
    ...def,
    enabled: savedMap.get(def.id)?.enabled ?? false,
  }));
}

/** Group rules by category */
export function groupRulesByCategory(rules: AutoDisqualifyRule[]): Record<string, AutoDisqualifyRule[]> {
  return rules.reduce<Record<string, AutoDisqualifyRule[]>>((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {});
}
