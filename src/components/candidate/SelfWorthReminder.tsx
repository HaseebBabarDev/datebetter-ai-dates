import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const affirmations = [
  "You deserve to be treated with kindness and respect. Always.",
  "Your worth is not determined by how others treat you.",
  "You are worthy of love that feels safe and consistent.",
  "It takes strength to recognize what you deserve. You have that strength.",
  "Choosing yourself is never the wrong choice.",
  "You deserve someone who makes you feel valued, not questioned.",
  "Trust your instincts—they're protecting you.",
  "Walking away from what hurts you is an act of self-love.",
  "You are whole and complete on your own.",
  "The right person will never make you feel less than.",
];

interface SelfWorthReminderProps {
  advice?: string;
  concerns?: string[];
  score?: number;
}

const abusivePatterns = [
  "discriminat", "degrad", "derogate", "fat sham", "body sham", "racial", "racist",
  "sexist", "homophobic", "slur", "insult", "belittl", "humiliat", "mock",
  "harass", "stalk", "threaten", "intimidat", "won't leave", "showing up",
  "following", "obsessive", "controlling", "manipulat",
  "blocked you", "blocking you", "ghosted", "ghosting",
  "love bomb", "too fast", "excessive gift", "overwhelming",
  "post-intimacy", "after intimacy", "used you", "only wanted",
  "toxic", "abusive", "abuse", "red flag", "harmful", "dangerous",
  "disrespect", "dismiss", "invalidat", "gaslight", "end this relationship",
  "walk away", "cut contact", "protect yourself", "your safety",
];

export const SelfWorthReminder: React.FC<SelfWorthReminderProps> = ({
  advice,
  concerns,
  score,
}) => {
  const [currentAffirmation, setCurrentAffirmation] = useState(affirmations[0]);

  const hasAbusivePatterns = React.useMemo(() => {
    const combinedText = [
      advice || "",
      ...(concerns || []),
    ].join(" ").toLowerCase();

    if (score !== undefined && score <= 20) {
      return true;
    }

    return abusivePatterns.some(pattern => combinedText.includes(pattern));
  }, [advice, concerns, score]);

  useEffect(() => {
    if (hasAbusivePatterns) {
      const randomIndex = Math.floor(Math.random() * affirmations.length);
      setCurrentAffirmation(affirmations[randomIndex]);
    }
  }, [hasAbusivePatterns]);

  if (!hasAbusivePatterns) {
    return null;
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 p-4 border border-rose-100 dark:border-rose-900/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
          <Heart className="w-3.5 h-3.5 text-rose-500" fill="currentColor" />
        </div>
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          Self-Worth Reminder
        </span>
      </div>
      
      <p className="text-sm text-foreground leading-relaxed mb-3">
        {currentAffirmation}
      </p>
      
      <p className="text-[11px] text-muted-foreground border-t border-rose-100 dark:border-rose-900/30 pt-2">
        D.E.V.I. detected concerning patterns. You deserve better.
      </p>
    </div>
  );
};
