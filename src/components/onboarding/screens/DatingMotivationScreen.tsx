import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { Heart, Crown, Wallet, Users, Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const motivationOptions = [
  { value: "love", label: "Love & Connection", description: "Looking for a genuine, committed relationship", icon: Heart },
  { value: "social_status", label: "Social Status", description: "Interested in high-profile or influential partners", icon: Crown },
  { value: "financial_help", label: "Financial Security", description: "Seeking stability and financial support", icon: Wallet },
  { value: "companionship", label: "Companionship", description: "Want someone to share life experiences with", icon: Users },
  { value: "adventure", label: "Adventure & Excitement", description: "Looking for fun and new experiences", icon: Sparkles },
];

const partnerTypeOptions = [
  { value: "regular", label: "Regular Professional", description: "Standard career path" },
  { value: "influencer", label: "Influencer/Content Creator", description: "Social media presence" },
  { value: "athlete", label: "Athlete", description: "Professional or semi-pro sports" },
  { value: "musician_dj", label: "Musician/DJ", description: "Music industry" },
  { value: "celebrity", label: "Celebrity/Public Figure", description: "High public visibility" },
  { value: "wealthy", label: "Wealthy/High Net Worth", description: "Entrepreneurs, executives" },
  { value: "other", label: "Other", description: "Different type" },
];

const DatingMotivationScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const toggleMotivation = (value: string) => {
    const current = data.datingMotivation || [];
    if (current.includes(value)) {
      updateData({ datingMotivation: current.filter(v => v !== value) });
    } else {
      updateData({ datingMotivation: [...current, value] });
    }
  };

  const isHighProfilePartner = ["influencer", "athlete", "musician_dj", "celebrity", "wealthy"].includes(data.typicalPartnerType || "");
  const isLookingForLove = (data.datingMotivation || []).includes("love");

  const isValid = (data.datingMotivation?.length || 0) > 0;

  return (
    <OnboardingLayout
      title="What Are You Looking For?"
      subtitle="Be honest—this helps D.E.V.I. give you realistic advice"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Primary Motivation */}
        <div className="space-y-3">
          <Label className="text-base">What's driving your dating life right now? (select all that apply)</Label>
          <div className="space-y-2">
            {motivationOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={(data.datingMotivation || []).includes(option.value)}
                onClick={() => toggleMotivation(option.value)}
                icon={<option.icon className="w-5 h-5" />}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Partner Type */}
        <div className="space-y-3">
          <Label className="text-base">What type of partners do you typically date?</Label>
          <div className="space-y-2">
            {partnerTypeOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.typicalPartnerType === option.value}
                onClick={() => updateData({ typicalPartnerType: option.value })}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Contextual Warning */}
        {isHighProfilePartner && isLookingForLove && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-amber-600 dark:text-amber-400">Reality Check</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    High-profile partners (athletes, influencers, etc.) often have many options. D.E.V.I. will help you 
                    navigate these dynamics and set realistic expectations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isHighProfilePartner && !isLookingForLove && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Crown className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">No Judgment Here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    D.E.V.I. will help you navigate dating high-profile partners with clear eyes, 
                    understanding the unique dynamics involved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

export default DatingMotivationScreen;
