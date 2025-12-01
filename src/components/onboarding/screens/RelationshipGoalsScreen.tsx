import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OptionCard } from "../OptionCard";
import { RankedOption } from "../RankedOption";
import { Heart, Coffee, Sparkles, Diamond, HelpCircle, User, Users, HeartCrack, Infinity } from "lucide-react";

const statusOptions = [
  { value: "single", label: "Single", icon: User },
  { value: "in_relationship", label: "In a Relationship", icon: Heart },
  { value: "married", label: "Married", icon: Users },
  { value: "recently_divorced", label: "Recently Divorced", icon: HeartCrack },
  { value: "ethical_non_monogamy", label: "Ethical Non-Monogamy", icon: Infinity },
];

const goalOptions = [
  { value: "casual", label: "Casual dating", icon: Coffee },
  { value: "dating", label: "Dating", icon: Sparkles },
  { value: "serious", label: "Serious relationship", icon: Heart },
  { value: "marriage", label: "Marriage-minded", icon: Diamond },
  { value: "unsure", label: "Not sure yet", icon: HelpCircle },
];

const structureOptions = [
  { value: "monogamous", label: "Strictly monogamous" },
  { value: "open", label: "Open relationship" },
  { value: "polyamorous", label: "Polyamorous" },
  { value: "unsure", label: "Exploring" },
];

const priorityOptions = [
  { value: "emotional_connection", label: "Emotional connection" },
  { value: "physical_chemistry", label: "Physical chemistry" },
  { value: "shared_values", label: "Shared values" },
  { value: "communication", label: "Communication" },
  { value: "trust", label: "Trust & loyalty" },
  { value: "independence", label: "Independence" },
];

const RelationshipGoalsScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const relationshipPriorities = data.relationshipPriorities || [];

  const handlePriorityClick = (value: string) => {
    const currentIndex = relationshipPriorities.indexOf(value);
    
    if (currentIndex !== -1) {
      updateData({ 
        relationshipPriorities: relationshipPriorities.filter(p => p !== value) 
      });
    } else if (relationshipPriorities.length < 2) {
      updateData({ 
        relationshipPriorities: [...relationshipPriorities, value] 
      });
    }
  };

  const getRank = (value: string): number | null => {
    const index = relationshipPriorities.indexOf(value);
    return index !== -1 ? index + 1 : null;
  };

  const isValid = data.relationshipStatus && data.relationshipGoal;

  return (
    <OnboardingLayout
      title="Relationship Goals"
      subtitle="What are you looking for?"
    >
      <div className="space-y-4 animate-fade-in">
        {/* Current Relationship Status */}
        <div className="space-y-2">
          <Label className="text-sm">What's your current relationship status?</Label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.relationshipStatus === option.value}
                onClick={() => updateData({ relationshipStatus: option.value })}
                icon={<option.icon className="w-4 h-4" />}
                title={option.label}
                compact
              />
            ))}
          </div>
        </div>

        {/* Primary Goal */}
        <div className="space-y-2">
          <Label className="text-sm">What are you looking for?</Label>
          <div className="grid grid-cols-2 gap-2">
            {goalOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.relationshipGoal === option.value}
                onClick={() => updateData({ relationshipGoal: option.value })}
                icon={<option.icon className="w-4 h-4" />}
                title={option.label}
                compact
              />
            ))}
          </div>
        </div>

        {/* Relationship Structure */}
        <div className="space-y-2">
          <Label className="text-sm">Your ideal relationship structure:</Label>
          <div className="grid grid-cols-2 gap-2">
            {structureOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.relationshipStructure === option.value}
                onClick={() => updateData({ relationshipStructure: option.value })}
                title={option.label}
                compact
              />
            ))}
          </div>
        </div>

        {/* Top 2 Priorities */}
        <div className="space-y-2">
          <Label className="text-sm">Top 2 priorities in a relationship (rank in order)</Label>
          <p className="text-xs text-muted-foreground">Select your top 2 priorities</p>
          <div className="grid grid-cols-2 gap-2">
            {priorityOptions.map((o) => (
              <RankedOption
                key={o.value}
                label={o.label}
                rank={getRank(o.value)}
                onClick={() => handlePriorityClick(o.value)}
                disabled={relationshipPriorities.length >= 2 && !relationshipPriorities.includes(o.value)}
              />
            ))}
          </div>
        </div>

        {/* Non-negotiables */}
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
          <h3 className="font-medium text-sm">Non-Negotiables</h3>
          
          {data.relationshipStructure === "monogamous" && (
            <div className="flex items-center justify-between">
              <Label htmlFor="monogamy" className="text-xs">Monogamy is absolutely required</Label>
              <Switch
                id="monogamy"
                checked={data.monogamyRequired}
                onCheckedChange={(checked) => updateData({ monogamyRequired: checked })}
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Label htmlFor="exclusivity" className="text-xs">I need exclusivity before intimacy</Label>
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
