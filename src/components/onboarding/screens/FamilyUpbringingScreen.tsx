import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OptionCard } from "../OptionCard";
import { MultiSelectOption } from "../MultiSelectOption";
import { Heart, AlertTriangle, Shield, Users, PenLine } from "lucide-react";
import { detectCrisisContent } from "@/lib/crisisDetection";
import { CrisisAlertDialog } from "@/components/devi/CrisisAlertDialog";

const parentStatusOptions = [
  { value: "married_together", label: "Married Together", description: "Parents married and living together" },
  { value: "unmarried_together", label: "Unmarried Together", description: "Parents together but not married" },
  { value: "divorced", label: "Divorced", description: "Parents divorced" },
  { value: "separated", label: "Separated", description: "Parents separated but not divorced" },
  { value: "single_parent", label: "Single Parent", description: "Raised by one parent" },
  { value: "adopted", label: "Adopted", description: "Raised by adoptive parents" },
  { value: "orphan_system", label: "Orphan/System", description: "Raised in foster care or group home" },
  { value: "other_guardians", label: "Other Guardians", description: "Raised by grandparents, relatives, etc." },
];

const parentPresenceOptions = [
  { value: "present", label: "Present", description: "Active in your life" },
  { value: "absent", label: "Absent", description: "Not present in your life" },
  { value: "deceased", label: "Deceased", description: "Passed away" },
  { value: "unknown", label: "Unknown/N/A", description: "Unknown or not applicable" },
];

const parentsRelationshipOptions = [
  { value: "healthy_loving", label: "Healthy & Loving", description: "Respectful, supportive partnership" },
  { value: "functional", label: "Functional", description: "Got along but not affectionate" },
  { value: "high_conflict", label: "High Conflict", description: "Frequent arguments or tension" },
  { value: "divorced_amicable", label: "Divorced (Amicable)", description: "Separated but civil" },
  { value: "divorced_contentious", label: "Divorced (Contentious)", description: "Difficult separation" },
  { value: "single_parent", label: "Single Parent", description: "Raised by one parent" },
  { value: "absent_parent", label: "Absent Parent(s)", description: "One or both parents absent" },
  { value: "other_caregivers", label: "Other Caregivers", description: "Raised by grandparents, foster, etc." },
];

const feltLovedOptions = [
  { value: "always", label: "Always felt loved", description: "Consistent love and support" },
  { value: "mostly", label: "Mostly felt loved", description: "Generally secure with some gaps" },
  { value: "inconsistent", label: "Inconsistent", description: "Love felt conditional or unpredictable" },
  { value: "rarely", label: "Rarely felt loved", description: "Often felt unloved or neglected" },
  { value: "never", label: "Never felt loved", description: "Did not experience parental love" },
];

const parentWoundTypes = [
  "Abandonment (physical or emotional)",
  "Enmeshment (no boundaries)",
  "Criticism/perfectionism",
  "Emotional unavailability",
  "Parentification (had to parent your parent)",
  "Comparison to siblings",
  "Conditional love (love based on performance)",
  "Neglect",
  "Control/helicopter parenting",
  "None of these apply",
];

const childhoodTraumaTypes = [
  "Witnessed domestic violence",
  "Experienced emotional abuse",
  "Experienced physical abuse",
  "Experienced sexual abuse",
  "Substance abuse in home",
  "Mental illness in family",
  "Incarceration of parent",
  "Death of parent/caregiver",
  "Chronic illness (self or family)",
  "Prefer not to say",
  "None of these apply",
];

const socioeconomicOptions = [
  { value: "poverty", label: "Poverty", description: "Basic needs often unmet" },
  { value: "working_class", label: "Working Class", description: "Paycheck to paycheck" },
  { value: "middle_class", label: "Middle Class", description: "Comfortable but careful" },
  { value: "upper_middle", label: "Upper Middle Class", description: "Financially secure" },
  { value: "wealthy", label: "Wealthy", description: "Abundance and privilege" },
  { value: "unstable", label: "Unstable/Variable", description: "Fluctuated significantly" },
];

const familyStabilityOptions = [
  { value: "very_stable", label: "Very Stable", description: "Consistent home, routines, safety" },
  { value: "mostly_stable", label: "Mostly Stable", description: "Generally predictable with some disruption" },
  { value: "unstable", label: "Unstable", description: "Frequent moves, changes, chaos" },
  { value: "chaotic", label: "Chaotic", description: "Unpredictable, crisis-driven" },
];

const generationalPatterns = [
  "Codependency",
  "Addiction",
  "Infidelity",
  "Divorce",
  "Emotional suppression",
  "Financial instability",
  "Workaholism",
  "Anger/rage issues",
  "Anxiety/depression",
  "Avoidant attachment",
  "People-pleasing",
  "None I'm aware of",
];

const FamilyUpbringingScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  
  // Crisis detection state
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<"moderate" | "severe">("moderate");
  const [crisisCategory, setCrisisCategory] = useState<"crisis" | "harmful_content" | "emergency">("crisis");

  const handleFamilyNotesChange = (notes: string) => {
    // Check for crisis/harmful content
    const crisisResult = detectCrisisContent(notes);
    if (crisisResult.detected) {
      setCrisisSeverity(crisisResult.severity);
      setCrisisCategory(crisisResult.category || "crisis");
      setShowCrisisAlert(true);
      
      // For harmful content, don't allow the update
      if (crisisResult.category === "harmful_content") {
        return;
      }
    }
    
    updateData({ familyUpbringingNotes: notes });
  };
  const toggleParentWound = (wound: string) => {
    const current = data.parentWoundTypes || [];
    if (wound === "None of these apply") {
      updateData({ parentWoundTypes: current.includes(wound) ? [] : [wound] });
    } else {
      const filtered = current.filter((w: string) => w !== "None of these apply");
      updateData({
        parentWoundTypes: filtered.includes(wound)
          ? filtered.filter((w: string) => w !== wound)
          : [...filtered, wound],
      });
    }
  };

  const toggleTrauma = (trauma: string) => {
    const current = data.childhoodTraumaTypes || [];
    if (trauma === "None of these apply" || trauma === "Prefer not to say") {
      updateData({ childhoodTraumaTypes: current.includes(trauma) ? [] : [trauma] });
    } else {
      const filtered = current.filter((t: string) => t !== "None of these apply" && t !== "Prefer not to say");
      updateData({
        childhoodTraumaTypes: filtered.includes(trauma)
          ? filtered.filter((t: string) => t !== trauma)
          : [...filtered, trauma],
      });
    }
  };

  const togglePattern = (pattern: string) => {
    const current = data.generationalPatterns || [];
    if (pattern === "None I'm aware of") {
      updateData({ generationalPatterns: current.includes(pattern) ? [] : [pattern] });
    } else {
      const filtered = current.filter((p: string) => p !== "None I'm aware of");
      updateData({
        generationalPatterns: filtered.includes(pattern)
          ? filtered.filter((p: string) => p !== pattern)
          : [...filtered, pattern],
      });
    }
  };

  const isValid = data.parentsRelationshipDynamic && data.feltLovedAsChild;

  return (
    <OnboardingLayout
      title="Family & Upbringing"
      subtitle="Your early experiences shape relationship patterns"
      emoji="🏡"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Privacy Notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
          <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            This information helps D.E.V.I. understand your relationship patterns and provide personalized guidance. 
            Skip any questions that feel too personal. Your data is private and encrypted.
          </p>
        </div>

        {/* Parent Status */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            What was your parent/guardian situation growing up?
          </Label>
          <div className="space-y-1.5">
            {parentStatusOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.parentStatus === option.value}
                onClick={() => updateData({ parentStatus: option.value })}
                title={option.label}
                description={option.description}
                compact
              />
            ))}
          </div>
        </div>

        {/* Mother Status */}
        <div className="space-y-2">
          <Label className="text-sm">Mother/Primary Female Caregiver Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {parentPresenceOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={data.motherStatus === option.value ? "default" : "outline"}
                className="h-auto py-2 flex-col"
                onClick={() => updateData({ motherStatus: option.value })}
              >
                <span className="text-sm">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Father Status */}
        <div className="space-y-2">
          <Label className="text-sm">Father/Primary Male Caregiver Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {parentPresenceOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={data.fatherStatus === option.value ? "default" : "outline"}
                className="h-auto py-2 flex-col"
                onClick={() => updateData({ fatherStatus: option.value })}
              >
                <span className="text-sm">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Siblings */}
        <div className="space-y-3">
          <Label className="text-sm">Siblings</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Full Siblings</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={data.fullSiblings ?? ""}
                onChange={(e) => updateData({ fullSiblings: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Half Siblings</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={data.halfSiblings ?? ""}
                onChange={(e) => updateData({ halfSiblings: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Parents' Relationship */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4" />
            How would you describe your parents'/caregivers' relationship?
          </Label>
          <div className="space-y-1.5">
            {parentsRelationshipOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.parentsRelationshipDynamic === option.value}
                onClick={() => updateData({ parentsRelationshipDynamic: option.value })}
                title={option.label}
                description={option.description}
                compact
              />
            ))}
          </div>
        </div>

        {/* Felt Loved */}
        <div className="space-y-2">
          <Label className="text-sm">Growing up, did you feel loved?</Label>
          <div className="space-y-1.5">
            {feltLovedOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.feltLovedAsChild === option.value}
                onClick={() => updateData({ feltLovedAsChild: option.value })}
                title={option.label}
                description={option.description}
                compact
              />
            ))}
          </div>
        </div>

        {/* Healthy Relationship Models */}
        <div className="space-y-2">
          <Label className="text-sm">Did you have healthy relationship role models growing up?</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={data.healthyRelationshipModels === true ? "default" : "outline"}
              className="flex-1"
              onClick={() => updateData({ healthyRelationshipModels: true })}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={data.healthyRelationshipModels === false ? "default" : "outline"}
              className="flex-1"
              onClick={() => updateData({ healthyRelationshipModels: false })}
            >
              No
            </Button>
          </div>
        </div>

        {/* Socioeconomic Background */}
        <div className="space-y-2">
          <Label className="text-sm">What was your socioeconomic background growing up?</Label>
          <div className="space-y-1.5">
            {socioeconomicOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.socioeconomicBackground === option.value}
                onClick={() => updateData({ socioeconomicBackground: option.value })}
                title={option.label}
                description={option.description}
                compact
              />
            ))}
          </div>
        </div>

        {/* Family Stability */}
        <div className="space-y-2">
          <Label className="text-sm">How stable was your home environment?</Label>
          <div className="space-y-1.5">
            {familyStabilityOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={data.familyStability === option.value}
                onClick={() => updateData({ familyStability: option.value })}
                title={option.label}
                description={option.description}
                compact
              />
            ))}
          </div>
        </div>

        {/* Parent Wounds */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Parent wounds you may carry (select all that apply):
          </Label>
          <div className="space-y-1.5">
            {parentWoundTypes.map((wound) => (
              <MultiSelectOption
                key={wound}
                selected={data.parentWoundTypes?.includes(wound) || false}
                onClick={() => toggleParentWound(wound)}
                label={wound}
              />
            ))}
          </div>
        </div>

        {/* Childhood Trauma */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Adverse childhood experiences (ACEs) - optional:
          </Label>
          <div className="space-y-1.5">
            {childhoodTraumaTypes.map((trauma) => (
              <MultiSelectOption
                key={trauma}
                selected={data.childhoodTraumaTypes?.includes(trauma) || false}
                onClick={() => toggleTrauma(trauma)}
                label={trauma}
              />
            ))}
          </div>
        </div>

        {/* Generational Patterns */}
        <div className="space-y-2">
          <Label className="text-sm">Generational patterns in your family (select all that apply):</Label>
          <div className="space-y-1.5">
            {generationalPatterns.map((pattern) => (
              <MultiSelectOption
                key={pattern}
                selected={data.generationalPatterns?.includes(pattern) || false}
                onClick={() => togglePattern(pattern)}
                label={pattern}
              />
            ))}
          </div>
        </div>

        {/* Free-form notes about family experience */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            Anything else about your family or upbringing? (optional)
          </Label>
          <Textarea
            value={data.familyUpbringingNotes || ""}
            onChange={(e) => handleFamilyNotesChange(e.target.value)}
            placeholder="Share any context about your childhood, family dynamics, or experiences that shape how you approach relationships today..."
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This helps D.E.V.I. understand your unique story and provide more personalized guidance.
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={nextStep} 
            className="flex-1" 
            size="lg"
          >
            Skip for now
          </Button>
          <Button onClick={nextStep} disabled={!isValid} className="flex-1" size="lg">
            Continue
          </Button>
        </div>
      </div>

      {/* Crisis Alert Dialog */}
      <CrisisAlertDialog
        open={showCrisisAlert}
        onClose={() => setShowCrisisAlert(false)}
        severity={crisisSeverity}
        category={crisisCategory}
      />
    </OnboardingLayout>
  );
};

export default FamilyUpbringingScreen;
