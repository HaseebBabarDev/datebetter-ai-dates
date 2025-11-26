import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const genderOptions = [
  { value: "woman_cis", label: "Woman (cisgender)" },
  { value: "woman_trans", label: "Woman (transgender)" },
  { value: "non_binary", label: "Non-binary" },
  { value: "gender_fluid", label: "Gender-fluid" },
  { value: "self_describe", label: "Prefer to self-describe" },
];

const pronounOptions = [
  { value: "she_her", label: "She/Her" },
  { value: "he_him", label: "He/Him" },
  { value: "they_them", label: "They/Them" },
  { value: "other", label: "Other" },
];

const BasicIdentityScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const isValid = data.name && data.genderIdentity;

  return (
    <OnboardingLayout
      title="Basic Identity"
      subtitle="Let's get to know you"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">What should we call you?</Label>
          <Input
            id="name"
            placeholder="Your first name"
            value={data.name || ""}
            onChange={(e) => updateData({ name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Only your first name for privacy</p>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Where are you based?</Label>
          <Input
            id="location"
            placeholder="City, State"
            value={data.location || ""}
            onChange={(e) => updateData({ location: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">For finding nearby matches</p>
        </div>

        {/* Gender Identity */}
        <div className="space-y-3">
          <Label>I identify as:</Label>
          <div className="space-y-2">
            {genderOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.genderIdentity === option.value}
                onClick={() => updateData({ genderIdentity: option.value })}
                title={option.label}
              />
            ))}
          </div>
        </div>

        {/* Pronouns */}
        <div className="space-y-2">
          <Label>My pronouns:</Label>
          <Select
            value={data.pronouns}
            onValueChange={(value) => updateData({ pronouns: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pronouns" />
            </SelectTrigger>
            <SelectContent>
              {pronounOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {data.pronouns === "other" && (
            <Input
              placeholder="Enter your pronouns"
              value={data.customPronouns || ""}
              onChange={(e) => updateData({ customPronouns: e.target.value })}
              className="mt-2"
            />
          )}
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

export default BasicIdentityScreen;
