import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, Shield, Star, Sun } from "lucide-react";

const affirmations = [
  {
    message: "You deserve to be treated with kindness and respect. Always.",
    icon: Heart,
  },
  {
    message: "Your worth is not determined by how others treat you.",
    icon: Star,
  },
  {
    message: "You are worthy of love that feels safe and consistent.",
    icon: Shield,
  },
  {
    message: "It takes strength to recognize what you deserve. You have that strength.",
    icon: Sparkles,
  },
  {
    message: "Choosing yourself is never the wrong choice.",
    icon: Sun,
  },
  {
    message: "You deserve someone who makes you feel valued, not questioned.",
    icon: Heart,
  },
  {
    message: "Trust your instincts—they're protecting you.",
    icon: Shield,
  },
  {
    message: "Walking away from what hurts you is an act of self-love.",
    icon: Star,
  },
  {
    message: "You are whole and complete on your own.",
    icon: Sun,
  },
  {
    message: "The right person will never make you feel less than.",
    icon: Sparkles,
  },
];

interface SelfWorthReminderProps {
  advice?: string;
  concerns?: string[];
  score?: number;
}

// Patterns that indicate abusive/harmful behavior
const abusivePatterns = [
  // Discriminatory/Degrading
  "discriminat", "degrad", "derogate", "fat sham", "body sham", "racial", "racist",
  "sexist", "homophobic", "slur", "insult", "belittl", "humiliat", "mock",
  // Harassment/Stalking
  "harass", "stalk", "threaten", "intimidat", "won't leave", "showing up",
  "following", "obsessive", "controlling", "manipulat",
  // Ghosting/Blocking abuse
  "blocked you", "blocking you", "ghosted", "ghosting",
  // Love bombing
  "love bomb", "too fast", "excessive gift", "overwhelming",
  // Post-intimacy issues
  "post-intimacy", "after intimacy", "used you", "only wanted",
  // General abuse indicators
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

  // Check if abusive patterns are detected
  const hasAbusivePatterns = React.useMemo(() => {
    const combinedText = [
      advice || "",
      ...(concerns || []),
    ].join(" ").toLowerCase();

    // Also show for very low scores (20 or below indicates serious issues)
    if (score !== undefined && score <= 20) {
      return true;
    }

    return abusivePatterns.some(pattern => combinedText.includes(pattern));
  }, [advice, concerns, score]);

  // Rotate affirmation on mount
  useEffect(() => {
    if (hasAbusivePatterns) {
      const randomIndex = Math.floor(Math.random() * affirmations.length);
      setCurrentAffirmation(affirmations[randomIndex]);
    }
  }, [hasAbusivePatterns]);

  if (!hasAbusivePatterns) {
    return null;
  }

  const Icon = currentAffirmation.icon;

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-purple-500/10 shadow-lg">
      <div className="relative p-4">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
            </div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Self-Worth Reminder
            </span>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-sm text-foreground leading-relaxed font-medium">
              {currentAffirmation.message}
            </p>
          </div>
          
          <div className="mt-3 pt-3 border-t border-rose-500/10">
            <p className="text-xs text-muted-foreground">
              D.E.V.I. detected concerning patterns. Remember: you deserve better.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
