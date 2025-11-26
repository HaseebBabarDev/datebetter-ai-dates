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

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "NL", label: "Netherlands" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "IN", label: "India" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "SG", label: "Singapore" },
  { value: "OTHER", label: "Other" },
];

const genderOptions = [
  { value: "woman_cis", label: "Woman" },
  { value: "woman_trans", label: "Woman (transgender)" },
  { value: "man_cis", label: "Man" },
  { value: "man_trans", label: "Man (transgender)" },
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

const heightOptions = [
  { value: "under_5ft", label: "Under 5'0\" (152 cm)" },
  { value: "5ft_5ft3", label: "5'0\" - 5'3\" (152-160 cm)" },
  { value: "5ft4_5ft6", label: "5'4\" - 5'6\" (163-168 cm)" },
  { value: "5ft7_5ft9", label: "5'7\" - 5'9\" (170-175 cm)" },
  { value: "5ft10_6ft", label: "5'10\" - 6'0\" (178-183 cm)" },
  { value: "over_6ft", label: "Over 6'0\" (183+ cm)" },
];

const bodyTypeOptions = [
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "average", label: "Average" },
  { value: "curvy", label: "Curvy" },
  { value: "plus_size", label: "Plus size" },
];

const BasicIdentityScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const isValid = data.genderIdentity;

  return (
    <OnboardingLayout
      title="Basic Identity"
      subtitle="Let's get to know you"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Location Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Where are you based?</Label>
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={data.country}
              onValueChange={(value) => updateData({ country: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={data.city || ""}
                onChange={(e) => updateData({ city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                placeholder="State"
                value={data.state || ""}
                onChange={(e) => updateData({ state: e.target.value })}
              />
            </div>
          </div>
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

        {/* Height */}
        <div className="space-y-2">
          <Label>Your height:</Label>
          <Select
            value={data.height}
            onValueChange={(value) => updateData({ height: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your height" />
            </SelectTrigger>
            <SelectContent>
              {heightOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Body Type */}
        <div className="space-y-2">
          <Label>Your body type:</Label>
          <Select
            value={data.bodyType}
            onValueChange={(value) => updateData({ bodyType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select body type" />
            </SelectTrigger>
            <SelectContent>
              {bodyTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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