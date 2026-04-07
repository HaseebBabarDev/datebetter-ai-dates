import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { Progress } from "@/components/ui/progress";

type Profile = Tables<"profiles">;

interface OnboardingProgressCTAProps {
  profile: Profile | null;
  onDismiss: () => void;
  className?: string;
}

const ONBOARDING_SECTIONS = [
  {
    id: "identity",
    label: "Basic Identity",
    emoji: "👤",
    route: "/setup?setup=full",
    step: 2,
    check: (p: Profile) => !!(p.gender_identity && p.pronouns),
  },
  {
    id: "dating_prefs",
    label: "Dating Preferences",
    emoji: "💘",
    route: "/setup?setup=full",
    step: 3,
    check: (p: Profile) => !!(p.interested_in && p.interested_in.length > 0),
  },
  {
    id: "goals",
    label: "Relationship Goals",
    emoji: "🎯",
    route: "/setup?setup=full",
    step: 7,
    check: (p: Profile) => !!(p.relationship_goal),
  },
  {
    id: "values",
    label: "Faith & Values",
    emoji: "🙏",
    route: "/setup?setup=full",
    step: 9,
    check: (p: Profile) => !!(p.religion || p.faith_importance),
  },
  {
    id: "kids_family",
    label: "Kids & Family",
    emoji: "👶",
    route: "/setup?setup=full",
    step: 8,
    check: (p: Profile) => !!(p.kids_desire),
  },
  {
    id: "career",
    label: "Career & Lifestyle",
    emoji: "💼",
    route: "/setup?setup=full",
    step: 11,
    check: (p: Profile) => !!(p.career_stage || p.education_level),
  },
  {
    id: "communication",
    label: "Communication Style",
    emoji: "💬",
    route: "/setup?setup=full",
    step: 15,
    check: (p: Profile) => !!(p.communication_style || p.conflict_style),
  },
  {
    id: "past_patterns",
    label: "Past Patterns",
    emoji: "🔄",
    route: "/setup?setup=full",
    step: 16,
    check: (p: Profile) => !!(p.attachment_style || p.typical_partner_type),
  },
  {
    id: "family_upbringing",
    label: "Family Background",
    emoji: "🏠",
    route: "/setup?setup=full",
    step: 20,
    check: (p: Profile) => !!(p.parents_relationship_dynamic || p.felt_loved_as_child),
  },
  {
    id: "boundaries",
    label: "Boundaries & Safety",
    emoji: "🛡️",
    route: "/setup?setup=full",
    step: 21,
    check: (p: Profile) => !!(p.boundary_strength || (p.dealbreakers && (p.dealbreakers as unknown[]).length > 0)),
  },
];

export const OnboardingProgressCTA: React.FC<OnboardingProgressCTAProps> = ({
  profile,
  onDismiss,
  className,
}) => {
  const navigate = useNavigate();

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

  // All complete — don't show
  if (completed >= total) return null;

  const greeting = completed === 0
    ? "Let's personalize D.E.V.I. for you!"
    : completed <= 3
    ? "You're off to a great start!"
    : "Almost there — keep going!";

  return (
    <div className={`rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 space-y-3 relative ${className || ""}`}>
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/80 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Header */}
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

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Section pills — show next 3 incomplete */}
      <div className="flex flex-wrap gap-1.5">
        {ONBOARDING_SECTIONS.slice(0, 6).map((section) => {
          const isDone = profile ? section.check(profile) : false;
          return (
            <span
              key={section.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                isDone
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isDone ? <Check className="w-2.5 h-2.5" /> : <span>{section.emoji}</span>}
              {section.label}
            </span>
          );
        })}
        {ONBOARDING_SECTIONS.length > 6 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
            +{ONBOARDING_SECTIONS.length - 6} more
          </span>
        )}
      </div>

      {/* Next step CTA */}
      {nextSection && (
        <Button
          size="sm"
          className="w-full gap-2 bg-[image:var(--gradient-hero)] hover:opacity-90 h-10 font-semibold"
          onClick={() => navigate("/setup?setup=full")}
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
