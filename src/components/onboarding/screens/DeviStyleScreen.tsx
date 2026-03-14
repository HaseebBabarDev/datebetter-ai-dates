import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Volume2 } from "lucide-react";
import { Label } from "@/components/ui/label";

const DEVI_STYLES = [
  {
    value: "direct",
    label: "Direct",
    description: "Straight to the point. No fluff, just insights.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Warm but honest. The default experience.",
  },
  {
    value: "gentle",
    label: "Gentle",
    description: "Extra supportive and encouraging tone.",
  },
];

const DEVI_VOICES = [
  {
    value: "younger",
    label: "Younger",
    description: "Energetic and relatable vibe.",
  },
  {
    value: "mature",
    label: "Mature",
    description: "Warm and reassuring tone.",
  },
];

const DeviStyleScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const isValid = !!data.deviStyle && !!data.deviVoice;

  return (
    <OnboardingLayout
      title="How should D.E.V.I. talk to you?"
      subtitle="Choose your preferred communication style for your AI dating coach"
      emoji="🤖"
    >
      <div className="space-y-6">
        {/* Communication Style */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Communication Style</Label>
          {DEVI_STYLES.map((style) => (
            <OptionCard
              key={style.value}
              selected={data.deviStyle === style.value}
              onClick={() => updateData({ deviStyle: style.value })}
              title={style.label}
              description={style.description}
            />
          ))}
        </div>

        {/* Voice Preference */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Voice
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {DEVI_VOICES.map((voice) => (
              <div
                key={voice.value}
                onClick={() => updateData({ deviVoice: voice.value })}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  data.deviVoice === voice.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-medium text-sm">{voice.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{voice.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        className="w-full mt-6"
        size="lg"
        disabled={!isValid}
        onClick={nextStep}
      >
        Continue
      </Button>
    </OnboardingLayout>
  );
};

export default DeviStyleScreen;
