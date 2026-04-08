import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface OnboardingProgressCTAProps {
  profile: Profile | null;
  onDismiss: () => void;
  onAskInChat?: (prompt: string) => void;
  onOpenSection?: (sectionId: string) => void;
  className?: string;
}

const ONBOARDING_SECTIONS = [
  {
    id: "identity",
    label: "Basic Identity",
    emoji: "👤",
    prompt: "Let's set up my basic identity — ask me about my gender, pronouns, and name.",
    check: (p: Profile) => !!(p.gender_identity && p.pronouns),
  },
  {
    id: "dating_prefs",
    label: "Dating Preferences",
    emoji: "💘",
    prompt: "Ask me about my dating preferences — who I'm interested in, age range, and what I'm attracted to.",
    check: (p: Profile) => !!(p.interested_in && p.interested_in.length > 0),
  },
  {
    id: "goals",
    label: "Relationship Goals",
    emoji: "🎯",
    prompt: "Let's talk about my relationship goals — what I'm looking for and my timeline.",
    check: (p: Profile) => !!(p.relationship_goal),
  },
  {
    id: "values",
    label: "Faith & Values",
    emoji: "🙏",
    prompt: "Ask me about my faith, religion, and core values in relationships.",
    check: (p: Profile) => !!(p.religion || p.faith_importance),
  },
  {
    id: "kids_family",
    label: "Kids & Family",
    emoji: "👶",
    prompt: "Let's talk about kids and family — whether I want them, timeline, and my current situation.",
    check: (p: Profile) => !!(p.kids_desire),
  },
  {
    id: "career",
    label: "Career & Lifestyle",
    emoji: "💼",
    prompt: "Ask me about my career, education, and lifestyle — work schedule, ambition, and finances.",
    check: (p: Profile) => !!(p.career_stage || p.education_level),
  },
  {
    id: "communication",
    label: "Communication Style",
    emoji: "💬",
    prompt: "Let's explore my communication style — how I handle conflict, express feelings, and connect.",
    check: (p: Profile) => !!(p.communication_style || p.conflict_style),
  },
  {
    id: "past_patterns",
    label: "Past Patterns",
    emoji: "🔄",
    prompt: "Ask me about my past relationship patterns — attachment style, typical partners, and what I've learned.",
    check: (p: Profile) => !!(p.attachment_style || p.typical_partner_type),
  },
  {
    id: "family_upbringing",
    label: "Family Background",
    emoji: "🏠",
    prompt: "Let's talk about my family background — parents' relationship, upbringing, and how it shaped me.",
    check: (p: Profile) => !!(p.parents_relationship_dynamic || p.felt_loved_as_child),
  },
  {
    id: "boundaries",
    label: "Boundaries & Safety",
    emoji: "🛡️",
    prompt: "Ask me about my boundaries and dealbreakers — what I won't tolerate and my safety priorities.",
    check: (p: Profile) => !!(p.boundary_strength || (p.dealbreakers && (p.dealbreakers as unknown[]).length > 0)),
  },
];

export const OnboardingProgressCTA: React.FC<OnboardingProgressCTAProps> = ({
  profile,
  onDismiss,
  onAskInChat,
  onOpenSection,
  className,
}) => {
  const { completed, total, nextSection, percentage } = useMemo(() => {
    if (!profile) return { completed: 0, total: ONBOARDING_SECTIONS.length, nextSection: ONBOARDING_SECTIONS[0], percentage: 0 };

    let done = 0;
    let next = null as (typeof ONBOARDING_SECTIONS)[0] | null;

    for (const section of ONBOARDING_SECTIONS) {
      if (section.check(profile)) {
        done++;
      } else if (!next) {
        next = section;
      }
    }

    return {
      completed: done,
      total: ONBOARDING_SECTIONS.length,
      nextSection: next || ONBOARDING_SECTIONS[ONBOARDING_SECTIONS.length - 1],
      percentage: Math.round((done / ONBOARDING_SECTIONS.length) * 100),
    };
  }, [profile]);

  if (completed >= total) return null;

  const greeting = completed === 0
    ? "Let's personalize D.E.V.I. for you!"
    : completed <= 3
    ? "You're off to a great start!"
    : "Almost there — keep going!";

  const handleSectionClick = (section: typeof ONBOARDING_SECTIONS[0]) => {
    if (onOpenSection) {
      onOpenSection(section.id);
    } else if (onAskInChat) {
      onAskInChat(section.prompt);
    }
  };

  return (
    <div className={`rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 space-y-3 relative ${className || ""}`}>
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/80 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-2.5 pr-6">
        <div className="w-9 h-9 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">{greeting}</p>
          <p className="text-[11px] text-muted-foreground">
            {completed}/{total} sections complete
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ONBOARDING_SECTIONS.slice(0, 6).map((section) => {
          const isDone = profile ? section.check(profile) : false;
          return (
            <button
              key={section.id}
              onClick={() => !isDone && handleSectionClick(section)}
              disabled={isDone}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                isDone
                  ? "bg-primary/15 text-primary cursor-default"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer"
              }`}
            >
              {isDone ? <Check className="w-2.5 h-2.5" /> : <span>{section.emoji}</span>}
              {section.label}
            </button>
          );
        })}
        {ONBOARDING_SECTIONS.length > 6 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
            +{ONBOARDING_SECTIONS.length - 6} more
          </span>
        )}
      </div>

      {nextSection && (
        <Button
          size="sm"
          className="w-full gap-2 bg-[image:var(--gradient-hero)] hover:opacity-90 h-10 font-semibold"
          onClick={() => handleSectionClick(nextSection)}
        >
          <span>{nextSection.emoji}</span>
          Continue: {nextSection.label}
          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
        </Button>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        The more D.E.V.I. knows, the better the advice ✨
      </p>
    </div>
  );
};
