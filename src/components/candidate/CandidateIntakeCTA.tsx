import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<"candidates">;

interface CandidateIntakeCTAProps {
  candidate: Candidate | null;
  onDismiss: () => void;
  onOpenSection: (sectionId: string) => void;
  className?: string;
}

const CANDIDATE_SECTIONS = [
  {
    id: "basics",
    label: "Basics",
    emoji: "👤",
    check: (c: Candidate) => !!(c.age && c.gender_identity),
  },
  {
    id: "dating_context",
    label: "How You Met",
    emoji: "💘",
    check: (c: Candidate) => !!(c.met_via || c.met_app),
  },
  {
    id: "relationship_intent",
    label: "Their Goals",
    emoji: "🎯",
    check: (c: Candidate) => !!(c.their_relationship_goal || c.relationship_intention),
  },
  {
    id: "personality",
    label: "Personality & Style",
    emoji: "✨",
    check: (c: Candidate) => !!(c.their_attachment_style || c.their_social_style),
  },
  {
    id: "values",
    label: "Values & Faith",
    emoji: "🙏",
    check: (c: Candidate) => !!(c.their_religion || c.their_politics),
  },
  {
    id: "kids_family",
    label: "Kids & Family",
    emoji: "👶",
    check: (c: Candidate) => !!(c.their_kids_desire || c.their_kids_status),
  },
  {
    id: "career_lifestyle",
    label: "Career & Lifestyle",
    emoji: "💼",
    check: (c: Candidate) => !!(c.their_career_stage || c.their_education_level),
  },
  {
    id: "family_background",
    label: "Family Background",
    emoji: "🏠",
    check: (c: Candidate) => !!(c.their_parents_relationship || c.their_family_stability),
  },
  {
    id: "past_relationships",
    label: "Past Relationships",
    emoji: "💔",
    check: (c: Candidate) => !!(c.their_past_relationships && (c.their_past_relationships as unknown[]).length > 0) || !!c.their_relationship_notes,
  },
  {
    id: "mental_health",
    label: "Mental Health",
    emoji: "🧠",
    check: (c: Candidate) => !!(c.their_mental_health_awareness || c.their_in_therapy),
  },
  {
    id: "chemistry",
    label: "Chemistry & Attraction",
    emoji: "🔥",
    check: (c: Candidate) => !!(c.physical_attraction || c.overall_chemistry),
  },
];

export const CandidateIntakeCTA: React.FC<CandidateIntakeCTAProps> = ({
  candidate,
  onDismiss,
  onOpenSection,
  className,
}) => {
  const { completed, total, nextSection, percentage } = useMemo(() => {
    if (!candidate) return { completed: 0, total: CANDIDATE_SECTIONS.length, nextSection: CANDIDATE_SECTIONS[0], percentage: 0 };

    let done = 0;
    let next = null as (typeof CANDIDATE_SECTIONS)[0] | null;

    for (const section of CANDIDATE_SECTIONS) {
      if (section.check(candidate)) {
        done++;
      } else if (!next) {
        next = section;
      }
    }

    return {
      completed: done,
      total: CANDIDATE_SECTIONS.length,
      nextSection: next || CANDIDATE_SECTIONS[CANDIDATE_SECTIONS.length - 1],
      percentage: Math.round((done / CANDIDATE_SECTIONS.length) * 100),
    };
  }, [candidate]);

  if (!candidate || completed >= total) return null;

  const greeting = completed === 0
    ? `Add more about ${candidate.nickname} for better insights!`
    : completed <= 3
    ? `Good start on ${candidate.nickname}!`
    : `Almost complete — keep going!`;

  return (
    <div className={`rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-background p-4 space-y-3 relative ${className || ""}`}>
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
            {completed}/{total} sections complete — better data = better advice
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
        {CANDIDATE_SECTIONS.map((section) => {
          const isDone = candidate ? section.check(candidate) : false;
          return (
            <button
              key={section.id}
              onClick={() => !isDone && onOpenSection(section.id)}
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
      </div>

      {nextSection && (
        <Button
          size="sm"
          className="w-full gap-2 bg-[image:var(--gradient-hero)] hover:opacity-90 h-10 font-semibold"
          onClick={() => onOpenSection(nextSection.id)}
        >
          <span>{nextSection.emoji}</span>
          Continue: {nextSection.label}
          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
        </Button>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        The more D.E.V.I. knows about them, the smarter the advice ✨
      </p>
    </div>
  );
};
