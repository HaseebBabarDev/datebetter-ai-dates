import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { Heart, Shield, Clock, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom multi-select for this screen with description support
const SelectableCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}> = ({ selected, onClick, title, description }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full p-3 rounded-xl border text-left transition-all duration-150",
      "hover:border-primary/40",
      selected
        ? "border-primary bg-primary/5"
        : "border-border/60 bg-card"
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <p className={cn(
          "font-medium text-sm",
          selected ? "text-primary" : "text-foreground"
        )}>
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {selected && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
    </div>
  </button>
);

// Scenario-based questions for male heterosexual users
const HONESTY_OPTIONS = [
  { 
    value: "fully_honest", 
    label: "I'm an open book", 
    description: "I tell her everything, even if it's awkward",
    icon: Heart 
  },
  { 
    value: "mostly_honest", 
    label: "Honest about the important stuff", 
    description: "I'm real about what matters, keep some things private",
    icon: Shield 
  },
  { 
    value: "strategic", 
    label: "I play my cards close", 
    description: "I share what helps the situation",
    icon: Clock 
  },
];

const BLOCKER_OPTIONS = [
  { value: "retroactive_jealousy", label: "Her past bothers me", description: "I think about her exes/body count" },
  { value: "enjoying_youth", label: "Not ready to settle", description: "I want to enjoy being young" },
  { value: "financial", label: "Money situation", description: "Need to get my finances right first" },
  { value: "career_focus", label: "Career comes first", description: "Building my career is priority #1" },
  { value: "trust_issues", label: "Trust issues", description: "Been burned before, hard to trust" },
  { value: "commitment_fear", label: "Commitment scares me", description: "The idea of 'forever' feels heavy" },
  { value: "emotional_unavailable", label: "Emotionally closed off", description: "Hard to open up or be vulnerable" },
  { value: "none", label: "Nothing's blocking me", description: "I'm ready for the right person" },
];

const TIMELINE_OPTIONS = [
  { value: "now", label: "I'm ready now", icon: Heart },
  { value: "6_months", label: "Within 6 months", icon: Clock },
  { value: "1_year", label: "About a year", icon: Clock },
  { value: "uncertain", label: "Not sure when", icon: AlertTriangle },
];

const SKILL_CHALLENGES = [
  { value: "interview_mode", label: "Conversations feel like interviews", description: "I ask too many questions, hard to flow" },
  { value: "oversharing", label: "I overshare too soon", description: "I dump my life story too early" },
  { value: "defensive", label: "I get defensive", description: "I take things personally or shut down" },
  { value: "reading_signals", label: "Hard to read signals", description: "I miss or misinterpret her cues" },
  { value: "texting_games", label: "Texting is confusing", description: "Don't know when/how much to text" },
  { value: "physical_escalation", label: "Physical escalation", description: "Not sure when to make a move" },
  { value: "none", label: "I'm pretty good with women", description: "Just need the right match" },
];

const DatingStyleScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  
  // Initialize from context or defaults
  const [honestyIntent, setHonestyIntent] = useState(data.datingHonestyIntent || "");
  const [blockers, setBlockers] = useState<string[]>(
    Array.isArray(data.relationshipBlockers) ? data.relationshipBlockers : []
  );
  const [timeline, setTimeline] = useState(data.relationshipBlockerTimeline || "");
  const [challenges, setChallenges] = useState<string[]>(
    Array.isArray(data.datingSkillChallenges) ? data.datingSkillChallenges : []
  );

  const toggleBlocker = (value: string) => {
    if (value === "none") {
      setBlockers(["none"]);
    } else {
      const filtered = blockers.filter(b => b !== "none");
      if (filtered.includes(value)) {
        setBlockers(filtered.filter(v => v !== value));
      } else {
        setBlockers([...filtered, value]);
      }
    }
  };

  const toggleChallenge = (value: string) => {
    if (value === "none") {
      setChallenges(["none"]);
    } else {
      const filtered = challenges.filter(c => c !== "none");
      if (filtered.includes(value)) {
        setChallenges(filtered.filter(v => v !== value));
      } else {
        setChallenges([...filtered, value]);
      }
    }
  };

  const handleContinue = () => {
    updateData({
      datingHonestyIntent: honestyIntent,
      relationshipBlockers: blockers,
      relationshipBlockerTimeline: timeline,
      datingSkillChallenges: challenges,
    });
    nextStep();
  };

  const isValid = honestyIntent && blockers.length > 0;
  const showTimeline = blockers.length > 0 && !blockers.includes("none");

  return (
    <OnboardingLayout
      title="Your Dating Style"
      subtitle="Be honest—this helps D.E.V.I. give you better advice"
    >
      <div className="space-y-8 animate-fade-in pb-20">
        {/* Honesty Intent */}
        <div className="space-y-3">
          <Label className="text-base font-medium">How do you approach honesty in dating?</Label>
          <div className="space-y-2">
            {HONESTY_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                selected={honestyIntent === option.value}
                onClick={() => setHonestyIntent(option.value)}
                icon={<option.icon className="w-5 h-5" />}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Relationship Blockers */}
        <div className="space-y-3">
          <Label className="text-base font-medium">What's keeping you from wanting a relationship?</Label>
          <p className="text-sm text-muted-foreground">Select all that apply</p>
          <div className="space-y-2">
            {BLOCKER_OPTIONS.map((option) => (
              <SelectableCard
                key={option.value}
                selected={blockers.includes(option.value)}
                onClick={() => toggleBlocker(option.value)}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Timeline (only if blockers exist) */}
        {showTimeline && (
          <div className="space-y-3">
            <Label className="text-base font-medium">When do you think that might change?</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIMELINE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={timeline === option.value}
                  onClick={() => setTimeline(option.value)}
                  icon={<option.icon className="w-4 h-4" />}
                  title={option.label}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        {/* Dating Skill Challenges */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Where do you struggle with women?</Label>
          <p className="text-sm text-muted-foreground">No judgment—this helps D.E.V.I. coach you better</p>
          <div className="space-y-2">
            {SKILL_CHALLENGES.map((option) => (
              <SelectableCard
                key={option.value}
                selected={challenges.includes(option.value)}
                onClick={() => toggleChallenge(option.value)}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!isValid}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default DatingStyleScreen;
