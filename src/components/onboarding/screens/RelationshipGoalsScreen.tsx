import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OptionCard } from "../OptionCard";
import { Heart, Coffee, Sparkles, Diamond, HelpCircle, User, Users, HeartCrack, Infinity } from "lucide-react";

const statusOptions = [
  { value: "single", label: "Single", description: "Not currently in a relationship", icon: User },
  { value: "married", label: "Married", description: "Currently married", icon: Users },
  { value: "recently_divorced", label: "Recently Divorced", description: "Recently ended a marriage", icon: HeartCrack },
  { value: "ethical_non_monogamy", label: "Ethical Non-Monogamy", description: "In an open/poly relationship", icon: Infinity },
];

const goalOptions = [
  { value: "casual", label: "Casual dating", description: "Fun without commitment", icon: Coffee },
  { value: "dating", label: "Dating", description: "Getting to know people", icon: Sparkles },
  { value: "serious", label: "Serious relationship", description: "Looking for a partner", icon: Heart },
  { value: "marriage", label: "Marriage-minded", description: "Ready for forever", icon: Diamond },
  { value: "unsure", label: "Not sure yet", description: "Exploring options", icon: HelpCircle },
];

const structureOptions = [
  { value: "monogamous", label: "Strictly monogamous", description: "One partner only" },
  { value: "open", label: "Open relationship", description: "Primary partner + others" },
  { value: "polyamorous", label: "Polyamorous", description: "Multiple loving relationships" },
  { value: "unsure", label: "Exploring", description: "Open to different structures" },
];

const RelationshipGoalsScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const isValid = data.relationshipStatus && data.relationshipGoal;

  return (
    <OnboardingLayout
      title="Relationship Goals"
      subtitle="What are you looking for?"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Current Relationship Status */}
        <div className="space-y-3">
          <Label className="text-base">What's your current relationship status?</Label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.relationshipStatus === option.value}
                onClick={() => updateData({ relationshipStatus: option.value })}
                icon={<option.icon className="w-5 h-5" />}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Primary Goal */}
        <div className="space-y-3">
          <Label className="text-base">What are you looking for?</Label>
          <div className="space-y-2">
            {goalOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.relationshipGoal === option.value}
                onClick={() => updateData({ relationshipGoal: option.value })}
                icon={<option.icon className="w-5 h-5" />}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Relationship Structure */}
        <div className="space-y-3">
          <Label className="text-base">Your ideal relationship structure:</Label>
          <div className="space-y-2">
            {structureOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.relationshipStructure === option.value}
                onClick={() => updateData({ relationshipStructure: option.value })}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Non-negotiables */}
        <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="font-medium">Non-Negotiables</h3>
          
          {data.relationshipStructure === "monogamous" && (
            <div className="flex items-center justify-between">
              <Label htmlFor="monogamy">Monogamy is absolutely required</Label>
              <Switch
                id="monogamy"
                checked={data.monogamyRequired}
                onCheckedChange={(checked) => updateData({ monogamyRequired: checked })}
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Label htmlFor="exclusivity">I need exclusivity before intimacy</Label>
            <Switch
              id="exclusivity"
              checked={data.exclusivityBeforeIntimacy}
              onCheckedChange={(checked) => updateData({ exclusivityBeforeIntimacy: checked })}
            />
          </div>
        </div>

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

export default RelationshipGoalsScreen;
