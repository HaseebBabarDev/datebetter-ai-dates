import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { MultiSelectOption } from "../MultiSelectOption";
import { SliderInput } from "../SliderInput";

const orientationOptions = [
  { value: "straight", label: "Straight/Heterosexual" },
  { value: "lesbian", label: "Lesbian" },
  { value: "bisexual", label: "Bisexual" },
  { value: "pansexual", label: "Pansexual" },
  { value: "queer", label: "Queer" },
  { value: "asexual", label: "Asexual spectrum" },
  { value: "no_label", label: "Prefer not to label" },
  { value: "self_describe", label: "Prefer to self-describe" },
];

const interestedInOptions = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "non_binary", label: "Non-binary people" },
  { value: "all", label: "All genders" },
];

const DatingPreferencesScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const toggleInterestedIn = (value: string) => {
    const current = data.interestedIn || [];
    if (value === "all") {
      updateData({ interestedIn: ["all"] });
    } else {
      const filtered = current.filter((v) => v !== "all");
      if (filtered.includes(value)) {
        updateData({ interestedIn: filtered.filter((v) => v !== value) });
      } else if (filtered.length < 2) {
        updateData({ interestedIn: [...filtered, value] });
      }
    }
  };

  const isValid = data.sexualOrientation && (data.interestedIn?.length ?? 0) > 0;

  return (
    <OnboardingLayout
      title="Dating Preferences"
      subtitle="Who are you looking to date?"
    >
      <div className="space-y-4 animate-fade-in">
        {/* Sexual Orientation */}
        <div className="space-y-2">
          <Label className="text-sm">I identify as:</Label>
          <div className="grid grid-cols-2 gap-2">
            {orientationOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.sexualOrientation === option.value}
                onClick={() => updateData({ sexualOrientation: option.value })}
                title={option.label}
                compact
              />
            ))}
          </div>
        </div>

        {/* Interested In */}
        <div className="space-y-2">
          <Label className="text-sm">I'm interested in dating:</Label>
          <p className="text-xs text-muted-foreground">Select top 2</p>
          <div className="grid grid-cols-2 gap-2">
            {interestedInOptions.map((option) => (
              <MultiSelectOption
                key={option.value}
                selected={data.interestedIn?.includes(option.value) || false}
                onClick={() => toggleInterestedIn(option.value)}
                label={option.label}
              />
            ))}
          </div>
        </div>

        {/* Match Specificity */}
        <SliderInput
          label="My ideal match:"
          value={data.matchSpecificity || 5}
          onChange={(value) => updateData({ matchSpecificity: value })}
          min={1}
          max={10}
          leftLabel="Open to anyone"
          rightLabel="Very specific type"
        />

        {/* Continue Button */}
        <Button
          onClick={nextStep}
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

export default DatingPreferencesScreen;
