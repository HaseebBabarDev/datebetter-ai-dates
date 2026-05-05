import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import ContinueButton from "../ContinueButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionCard } from "../OptionCard";
import { VoiceInputButton } from "@/components/devi/VoiceInputButton";

const appendText = (prev: string | undefined, text: string) =>
  prev && prev.trim() ? `${prev} ${text}`.trim() : text.trim();
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
  { value: "NZ", label: "New Zealand" },
  { value: "IE", label: "Ireland" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "other", label: "Other" },
];

const genderOptions = [
  { value: "woman_cis", label: "Woman" },
  { value: "woman_trans", label: "Woman (transgender)" },
  { value: "man_cis", label: "Man" },
  { value: "man_trans", label: "Man (transgender)" },
  { value: "non_binary", label: "Non-binary" },
  { value: "gender_fluid", label: "Gender fluid" },
  { value: "self_describe", label: "Prefer to self-describe" },
];

const pronounOptions = [
  { value: "she_her", label: "She/Her" },
  { value: "he_him", label: "He/Him" },
  { value: "they_them", label: "They/Them" },
  { value: "other", label: "Other" },
];

const heightOptions = [
  { value: "under_5ft", label: "Under 5'0\"", subtitle: "152 cm" },
  { value: "5ft_5ft3", label: "5'0\" - 5'3\"", subtitle: "152-160 cm" },
  { value: "5ft4_5ft6", label: "5'4\" - 5'6\"", subtitle: "163-168 cm" },
  { value: "5ft7_5ft9", label: "5'7\" - 5'9\"", subtitle: "170-175 cm" },
  { value: "5ft10_6ft", label: "5'10\" - 6'0\"", subtitle: "178-183 cm" },
  { value: "over_6ft", label: "Over 6'0\"", subtitle: "183+ cm" },
];

const bodyTypeOptions = [
  { value: "petite", label: "Petite" },
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "average", label: "Average" },
  { value: "curvy", label: "Curvy" },
  { value: "plus_size", label: "Plus size" },
];

const BasicIdentityScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();

  // Parse existing birthDate if available
  const [month, setMonth] = React.useState(() => {
    if (data.birthDate) {
      const parts = data.birthDate.split('-');
      return parts[1] || "";
    }
    return "";
  });
  const [day, setDay] = React.useState(() => {
    if (data.birthDate) {
      const parts = data.birthDate.split('-');
      return parts[2] || "";
    }
    return "";
  });
  const [year, setYear] = React.useState(() => {
    if (data.birthDate) {
      const parts = data.birthDate.split('-');
      return parts[0] || "";
    }
    return "";
  });

  // Update birthDate when date fields change
  React.useEffect(() => {
    if (month && day && year && year.length === 4) {
      updateData({
        birthDate: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      });
    }
  }, [month, day, year]);

  const hasBirthDate = data.birthDate && data.birthDate.length === 10;

  // Calculate age from birthDate (must be 18+)
  const computedAge = React.useMemo(() => {
    if (!data.birthDate) return null;
    const dob = new Date(data.birthDate);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }, [data.birthDate]);

  const isUnderage = computedAge !== null && computedAge < 18;
  const isValid =
    data.name &&
    data.genderIdentity &&
    data.country &&
    data.pronouns &&
    hasBirthDate &&
    !isUnderage;

  return (
    <OnboardingLayout
      title="Basic Identity"
      subtitle="Let's get to know you"
      emoji="👋"
    >
      <div className="space-y-4 animate-fade-in">
        {/* Date of Birth Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date of Birth</Label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Input
                type="number"
                placeholder="MM"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="text-center"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Day</Label>
              <Input
                type="number"
                placeholder="DD"
                min={1}
                max={31}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="text-center"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Input
                type="number"
                placeholder="YYYY"
                min={1900}
                max={new Date().getFullYear()}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="text-center"
              />
            </div>
          </div>
          {isUnderage && (
            <p className="text-xs font-medium text-destructive mt-1">
              You must be at least 18 to use dateBetter.
            </p>
          )}
        </div>

        {/* Name Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="name" className="text-sm font-medium">What should we call you?</Label>
            <VoiceInputButton
              onTranscript={(text) => updateData({ name: appendText(data.name, text) })}
            />
          </div>
          <Input
            id="name"
            placeholder="Your name"
            value={data.name || ""}
            onChange={(e) => updateData({ name: e.target.value })}
          />
        </div>

        {/* Location Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Where are you based?</Label>
          
          <div className="space-y-2">
            <Label htmlFor="country" className="text-xs">Country</Label>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="city">City</Label>
                <VoiceInputButton
                  onTranscript={(text) => updateData({ city: appendText(data.city, text) })}
                />
              </div>
              <Input
                id="city"
                placeholder="City"
                value={data.city || ""}
                onChange={(e) => updateData({ city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="state">State/Province</Label>
                <VoiceInputButton
                  onTranscript={(text) => updateData({ state: appendText(data.state, text) })}
                />
              </div>
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
          <div className="grid grid-cols-2 gap-2">
            {genderOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.genderIdentity === option.value}
                onClick={() => updateData({ genderIdentity: option.value })}
                title={option.label}
                compact
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
            <div className="relative mt-2">
              <Input
                placeholder="Enter your pronouns"
                value={data.customPronouns || ""}
                onChange={(e) => updateData({ customPronouns: e.target.value })}
                className="pr-10"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <VoiceInputButton
                  onTranscript={(text) => updateData({ customPronouns: appendText(data.customPronouns, text) })}
                />
              </div>
            </div>
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

        <ContinueButton onClick={nextStep} disabled={!isValid} />
      </div>
    </OnboardingLayout>
  );
};

export default BasicIdentityScreen;