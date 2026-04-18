import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Loader2, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Candidate = Tables<"candidates">;

interface InlineCandidateEditorProps {
  open: boolean;
  sectionId: string | null;
  candidate: Candidate | null;
  userId: string;
  onClose: () => void;
  onSaved: (updatedCandidate: Candidate) => void;
}

const SECTION_CONFIG: Record<string, { title: string; emoji: string }> = {
  basics: { title: "Basics", emoji: "👤" },
  dating_context: { title: "How You Met", emoji: "💘" },
  relationship_intent: { title: "Their Goals", emoji: "🎯" },
  personality: { title: "Personality & Style", emoji: "✨" },
  values: { title: "Values & Faith", emoji: "🙏" },
  kids_family: { title: "Kids & Family", emoji: "👶" },
  career_lifestyle: { title: "Career & Lifestyle", emoji: "💼" },
  family_background: { title: "Family Background", emoji: "🏠" },
  past_relationships: { title: "Past Relationships", emoji: "💔" },
  mental_health: { title: "Mental Health", emoji: "🧠" },
  chemistry: { title: "Chemistry & Attraction", emoji: "🔥" },
};

const LEGACY_KIDS_DESIRE_MAP: Record<string, string> = {
  wants_kids: "definitely_yes",
  open_to_kids: "maybe",
  doesnt_want: "definitely_no",
  has_and_wants_more: "definitely_yes",
  has_and_done: "already_have",
};

const LEGACY_KIDS_STATUS_MAP: Record<string, string> = {
  has_kids_full_time: "has_young_kids",
  has_kids_part_time: "has_young_kids",
  expecting: "has_young_kids",
};

const normalizeKidsDesire = (value: unknown) => {
  if (typeof value !== "string") return value;
  return LEGACY_KIDS_DESIRE_MAP[value] ?? value;
};

const normalizeKidsStatus = (value: unknown) => {
  if (typeof value !== "string") return value;
  return LEGACY_KIDS_STATUS_MAP[value] ?? value;
};

const GENDER_OPTIONS = [
  { value: "woman_cis", label: "Woman" },
  { value: "woman_trans", label: "Woman (trans)" },
  { value: "man_cis", label: "Man" },
  { value: "man_trans", label: "Man (trans)" },
  { value: "non_binary", label: "Non-binary" },
  { value: "gender_fluid", label: "Gender fluid" },
];

const PRONOUN_OPTIONS = [
  { value: "she_her", label: "She/Her" },
  { value: "he_him", label: "He/Him" },
  { value: "they_them", label: "They/Them" },
  { value: "other", label: "Other" },
];

const MET_VIA_OPTIONS = [
  { value: "dating_app", label: "Dating App" },
  { value: "mutual_friends", label: "Mutual Friends" },
  { value: "work", label: "Work" },
  { value: "school", label: "School" },
  { value: "social_event", label: "Social Event" },
  { value: "gym", label: "Gym" },
  { value: "online", label: "Online (non-dating)" },
  { value: "other", label: "Other" },
];

const RELATIONSHIP_GOAL_OPTIONS = [
  { value: "casual", label: "Casual dating" },
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Serious relationship" },
  { value: "marriage", label: "Marriage" },
  { value: "unsure", label: "Figuring it out" },
  { value: "situationship", label: "Situationship" },
];

const ATTACHMENT_STYLE_OPTIONS = [
  { value: "secure", label: "Secure" },
  { value: "anxious", label: "Anxious" },
  { value: "avoidant", label: "Avoidant" },
  { value: "fearful_avoidant", label: "Fearful-Avoidant" },
  { value: "unsure", label: "Not sure" },
];

const RELIGION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "spiritual", label: "Spiritual" },
  { value: "christian_catholic", label: "Christian (Catholic)" },
  { value: "christian_protestant", label: "Christian (Protestant)" },
  { value: "christian_other", label: "Christian (Other)" },
  { value: "jewish", label: "Jewish" },
  { value: "muslim", label: "Muslim" },
  { value: "hindu", label: "Hindu" },
  { value: "buddhist", label: "Buddhist" },
  { value: "other", label: "Other" },
];

const POLITICS_OPTIONS = [
  { value: "progressive", label: "Progressive" },
  { value: "liberal", label: "Liberal" },
  { value: "moderate", label: "Moderate" },
  { value: "conservative", label: "Conservative" },
  { value: "traditional", label: "Traditional" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const KIDS_DESIRE_OPTIONS = [
  { value: "definitely_yes", label: "Definitely wants kids" },
  { value: "maybe", label: "Open to kids" },
  { value: "definitely_no", label: "Doesn't want kids" },
  { value: "already_have", label: "Already has kids, done" },
  { value: "unsure", label: "Not sure" },
];

const KIDS_STATUS_OPTIONS = [
  { value: "no_kids", label: "No kids" },
  { value: "has_young_kids", label: "Has young kids" },
  { value: "has_adult_kids", label: "Has adult kids" },
];

const SOCIAL_STYLE_OPTIONS = [
  { value: "introvert", label: "Introvert" },
  { value: "extrovert", label: "Extrovert" },
  { value: "ambivert", label: "Ambivert" },
];

const CAREER_STAGE_OPTIONS = [
  { value: "Student", label: "Student" },
  { value: "Entry Level", label: "Entry Level" },
  { value: "Mid-Career", label: "Mid-Career" },
  { value: "Senior/Executive", label: "Senior/Executive" },
  { value: "Entrepreneur", label: "Entrepreneur" },
  { value: "Freelance/Creative", label: "Freelance/Creative" },
  { value: "Between Jobs", label: "Between Jobs" },
  { value: "Retired", label: "Retired" },
];

const EDUCATION_LEVEL_OPTIONS = [
  { value: "High School", label: "High School" },
  { value: "Some College", label: "Some College" },
  { value: "Bachelor's", label: "Bachelor's" },
  { value: "Master's", label: "Master's" },
  { value: "Doctorate", label: "Doctorate" },
  { value: "Trade/Technical", label: "Trade/Technical" },
  { value: "Self-taught", label: "Self-taught" },
];

const SCHEDULE_OPTIONS = [
  { value: "remote_flexible", label: "Remote/Flexible" },
  { value: "hybrid", label: "Hybrid" },
  { value: "office_9_5", label: "Office 9-5" },
  { value: "shift_work", label: "Shift Work" },
  { value: "on_call", label: "On-Call" },
  { value: "overnight", label: "Overnight" },
];

const FAMILY_STABILITY_OPTIONS = [
  { value: "very_stable", label: "Very stable" },
  { value: "mostly_stable", label: "Mostly stable" },
  { value: "some_issues", label: "Some issues" },
  { value: "unstable", label: "Unstable" },
  { value: "unknown", label: "Don't know yet" },
];

const PARENTS_RELATIONSHIP_OPTIONS = [
  { value: "together", label: "Parents together" },
  { value: "together_happy", label: "Together & happy" },
  { value: "together_unhappy", label: "Together but unhappy" },
  { value: "divorced_amicable", label: "Divorced (amicable)" },
  { value: "divorced_contentious", label: "Divorced (contentious)" },
  { value: "single_parent", label: "Single parent household" },
  { value: "separated", label: "Separated" },
  { value: "deceased_parent", label: "Parent(s) deceased" },
  { value: "unknown", label: "Don't know yet" },
];

const THERAPY_OPTIONS = [
  { value: "yes_currently", label: "Yes, currently" },
  { value: "yes_previously", label: "Yes, in the past" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Don't know" },
];

const MENTAL_HEALTH_OPTIONS = [
  { value: "very_aware", label: "Very aware" },
  { value: "somewhat_aware", label: "Somewhat aware" },
  { value: "not_very_aware", label: "Not very aware" },
  { value: "unknown", label: "Don't know yet" },
];

export const InlineCandidateEditor: React.FC<InlineCandidateEditorProps> = ({
  open,
  sectionId,
  candidate,
  userId,
  onClose,
  onSaved,
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const config = sectionId ? SECTION_CONFIG[sectionId] : null;

  useEffect(() => {
    if (!candidate || !sectionId) return;
    const init: Record<string, unknown> = {};

    switch (sectionId) {
      case "basics":
        init.age = candidate.age || "";
        init.gender_identity = candidate.gender_identity || "";
        init.pronouns = candidate.pronouns || "";
        init.height = candidate.height || "";
        init.zodiac_sign = candidate.zodiac_sign || "";
        init.city = candidate.city || "";
        break;
      case "dating_context":
        init.met_via = candidate.met_via || "";
        init.met_app = candidate.met_app || "";
        init.first_contact_date = candidate.first_contact_date || "";
        init.notes = candidate.notes || "";
        break;
      case "relationship_intent":
        init.their_relationship_goal = candidate.their_relationship_goal || "";
        init.relationship_intention = candidate.relationship_intention || "";
        init.their_relationship_status = candidate.their_relationship_status || "";
        init.user_goal_for_candidate = candidate.user_goal_for_candidate || "";
        break;
      case "personality":
        init.their_attachment_style = candidate.their_attachment_style || "";
        init.their_social_style = candidate.their_social_style || "";
        break;
      case "values":
        init.their_religion = candidate.their_religion || "";
        init.their_politics = candidate.their_politics || "";
        break;
      case "kids_family":
        init.their_kids_desire = normalizeKidsDesire(candidate.their_kids_desire || "");
        init.their_kids_status = normalizeKidsStatus(candidate.their_kids_status || "");
        break;
      case "career_lifestyle":
        init.their_career_stage = candidate.their_career_stage || "";
        init.their_education_level = candidate.their_education_level || "";
        init.their_schedule_flexibility = candidate.their_schedule_flexibility || "";
        init.their_ambition_level = candidate.their_ambition_level || 5;
        break;
      case "family_background":
        init.their_parents_relationship = candidate.their_parents_relationship || "";
        init.their_family_stability = candidate.their_family_stability || "";
        init.their_family_notes = candidate.their_family_notes || "";
        break;
      case "past_relationships":
        init.their_past_relationships = candidate.their_past_relationships || [];
        init.their_relationship_notes = candidate.their_relationship_notes || "";
        break;
      case "mental_health":
        init.their_in_therapy = candidate.their_in_therapy || "";
        init.their_mental_health_awareness = candidate.their_mental_health_awareness || "";
        break;
      case "chemistry":
        init.physical_attraction = candidate.physical_attraction || 5;
        init.overall_chemistry = candidate.overall_chemistry || 5;
        init.intellectual_connection = candidate.intellectual_connection || 5;
        init.humor_compatibility = candidate.humor_compatibility || 5;
        init.energy_match = candidate.energy_match || 5;
        break;
    }

    setFormData(init);
    setSaved(false);
  }, [candidate, sectionId]);

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!candidate || !sectionId) return;
    setSaving(true);

    try {
      const updateData: Record<string, unknown> = {};

      switch (sectionId) {
        case "basics":
          if (formData.age) updateData.age = Number(formData.age);
          if (formData.gender_identity && formData.gender_identity !== "") updateData.gender_identity = formData.gender_identity;
          if (formData.pronouns && formData.pronouns !== "") updateData.pronouns = formData.pronouns;
          if (formData.height) updateData.height = formData.height as string;
          if (formData.zodiac_sign) updateData.zodiac_sign = formData.zodiac_sign as string;
          if (formData.city) updateData.city = formData.city as string;
          break;
        case "dating_context":
          if (formData.met_via) updateData.met_via = formData.met_via as string;
          if (formData.met_app) updateData.met_app = formData.met_app as string;
          if (formData.first_contact_date) updateData.first_contact_date = formData.first_contact_date as string;
          if (formData.notes) updateData.notes = formData.notes as string;
          break;
        case "relationship_intent":
          if (formData.their_relationship_goal) updateData.their_relationship_goal = formData.their_relationship_goal;
          if (formData.relationship_intention) updateData.relationship_intention = formData.relationship_intention as string;
          if (formData.their_relationship_status) updateData.their_relationship_status = formData.their_relationship_status;
          if (formData.user_goal_for_candidate) updateData.user_goal_for_candidate = formData.user_goal_for_candidate as string;
          break;
        case "personality":
          if (formData.their_attachment_style) updateData.their_attachment_style = formData.their_attachment_style;
          if (formData.their_social_style) updateData.their_social_style = formData.their_social_style as string;
          break;
        case "values":
          if (formData.their_religion) updateData.their_religion = formData.their_religion;
          if (formData.their_politics) updateData.their_politics = formData.their_politics;
          break;
        case "kids_family": {
          const normalizedKidsDesire = normalizeKidsDesire(formData.their_kids_desire);
          const normalizedKidsStatus = normalizeKidsStatus(formData.their_kids_status);
          if (normalizedKidsDesire) updateData.their_kids_desire = normalizedKidsDesire;
          if (normalizedKidsStatus) updateData.their_kids_status = normalizedKidsStatus;
          break;
        }
        case "career_lifestyle":
          if (formData.their_career_stage) updateData.their_career_stage = formData.their_career_stage as string;
          if (formData.their_education_level) updateData.their_education_level = formData.their_education_level as string;
          if (formData.their_schedule_flexibility) updateData.their_schedule_flexibility = formData.their_schedule_flexibility as string;
          updateData.their_ambition_level = Number(formData.their_ambition_level) || 5;
          break;
        case "family_background":
          if (formData.their_parents_relationship) updateData.their_parents_relationship = formData.their_parents_relationship as string;
          if (formData.their_family_stability) updateData.their_family_stability = formData.their_family_stability as string;
          if (formData.their_family_notes) updateData.their_family_notes = formData.their_family_notes as string;
          break;
        case "past_relationships":
          updateData.their_past_relationships = formData.their_past_relationships;
          if (formData.their_relationship_notes) updateData.their_relationship_notes = formData.their_relationship_notes as string;
          break;
        case "mental_health":
          if (formData.their_in_therapy) updateData.their_in_therapy = formData.their_in_therapy as string;
          if (formData.their_mental_health_awareness) updateData.their_mental_health_awareness = formData.their_mental_health_awareness as string;
          break;
        case "chemistry":
          updateData.physical_attraction = Number(formData.physical_attraction) || 5;
          updateData.overall_chemistry = Number(formData.overall_chemistry) || 5;
          updateData.intellectual_connection = Number(formData.intellectual_connection) || 5;
          updateData.humor_compatibility = Number(formData.humor_compatibility) || 5;
          updateData.energy_match = Number(formData.energy_match) || 5;
          break;
      }

      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      const { data, error } = await supabase
        .from("candidates")
        .update(updateData)
        .eq("id", candidate.id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      setSaved(true);
      toast.success(`${config?.title || "Section"} updated!`);

      if (data) {
        onSaved(data as Candidate);
      }

      setTimeout(() => onClose(), 600);
    } catch (err) {
      console.error("Error saving candidate section:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderSelectField = (
    key: string,
    label: string,
    options: { value: string; label: string }[],
    placeholder?: string
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Select value={formData[key] as string || ""} onValueChange={(v) => updateField(key, v)}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderSliderField = (key: string, label: string) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground">{formData[key] as number || 5}/10</span>
      </div>
      <Slider
        value={[Number(formData[key]) || 5]}
        onValueChange={([v]) => updateField(key, v)}
        min={1}
        max={10}
        step={1}
        className="py-2"
      />
    </div>
  );

  const renderSection = () => {
    switch (sectionId) {
      case "basics":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Age</Label>
              <Input
                type="number"
                placeholder="e.g. 28"
                value={formData.age as string || ""}
                onChange={(e) => updateField("age", e.target.value)}
              />
            </div>
            {renderSelectField("gender_identity", "Gender", GENDER_OPTIONS)}
            {renderSelectField("pronouns", "Pronouns", PRONOUN_OPTIONS)}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Height</Label>
              <Input
                placeholder={'e.g. 5\'10"'}
                value={formData.height as string || ""}
                onChange={(e) => updateField("height", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">City</Label>
              <Input
                placeholder="e.g. Los Angeles"
                value={formData.city as string || ""}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Zodiac Sign</Label>
              <Input
                placeholder="e.g. Scorpio"
                value={formData.zodiac_sign as string || ""}
                onChange={(e) => updateField("zodiac_sign", e.target.value)}
              />
            </div>
          </div>
        );
      case "dating_context":
        return (
          <div className="space-y-4">
            {renderSelectField("met_via", "How did you meet?", MET_VIA_OPTIONS)}
            {(formData.met_via === "dating_app") && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Which app?</Label>
                <Input
                  placeholder="e.g. Hinge, Bumble"
                  value={formData.met_app as string || ""}
                  onChange={(e) => updateField("met_app", e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">First contact date</Label>
              <Input
                type="date"
                value={formData.first_contact_date as string || ""}
                onChange={(e) => updateField("first_contact_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes</Label>
              <Textarea
                placeholder="Anything you want to remember about how things started..."
                value={formData.notes as string || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );
      case "relationship_intent":
        return (
          <div className="space-y-4">
            {renderSelectField("their_relationship_goal", "What are they looking for?", RELATIONSHIP_GOAL_OPTIONS)}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Their stated intention</Label>
              <Textarea
                placeholder="What have they told you about what they want?"
                value={formData.relationship_intention as string || ""}
                onChange={(e) => updateField("relationship_intention", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Your goal for this person</Label>
              <Textarea
                placeholder="What do you hope this becomes?"
                value={formData.user_goal_for_candidate as string || ""}
                onChange={(e) => updateField("user_goal_for_candidate", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        );
      case "personality":
        return (
          <div className="space-y-4">
            {renderSelectField("their_attachment_style", "Attachment Style", ATTACHMENT_STYLE_OPTIONS)}
            {renderSelectField("their_social_style", "Social Style", SOCIAL_STYLE_OPTIONS)}
          </div>
        );
      case "values":
        return (
          <div className="space-y-4">
            {renderSelectField("their_religion", "Religion / Spirituality", RELIGION_OPTIONS)}
            {renderSelectField("their_politics", "Political Leaning", POLITICS_OPTIONS)}
          </div>
        );
      case "kids_family":
        return (
          <div className="space-y-4">
            {renderSelectField("their_kids_desire", "Do they want kids?", KIDS_DESIRE_OPTIONS)}
            {renderSelectField("their_kids_status", "Current kid status", KIDS_STATUS_OPTIONS)}
          </div>
        );
      case "career_lifestyle":
        return (
          <div className="space-y-4">
            {renderSelectField("their_career_stage", "Career Stage", CAREER_STAGE_OPTIONS)}
            {renderSelectField("their_education_level", "Education Level", EDUCATION_LEVEL_OPTIONS)}
            {renderSelectField("their_schedule_flexibility", "Schedule Flexibility", SCHEDULE_OPTIONS)}
            {renderSliderField("their_ambition_level", "Ambition Level")}
          </div>
        );
      case "family_background":
        return (
          <div className="space-y-4">
            {renderSelectField("their_parents_relationship", "Parents' Relationship", PARENTS_RELATIONSHIP_OPTIONS)}
            {renderSelectField("their_family_stability", "Family Stability", FAMILY_STABILITY_OPTIONS)}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Family Notes</Label>
              <Textarea
                placeholder="Anything you've noticed about their family dynamics..."
                value={formData.their_family_notes as string || ""}
                onChange={(e) => updateField("their_family_notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );
      case "past_relationships": {
        const exList = (formData.their_past_relationships as Array<{ name: string; duration: string; endReason: string }>) || [];
        const addEx = () => {
          updateField("their_past_relationships", [...exList, { name: "", duration: "", endReason: "" }]);
        };
        const removeEx = (idx: number) => {
          updateField("their_past_relationships", exList.filter((_, i) => i !== idx));
        };
        const updateEx = (idx: number, field: string, value: string) => {
          const updated = exList.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex);
          updateField("their_past_relationships", updated);
        };
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Add their significant past relationships to help D.E.V.I. understand their patterns.</p>
            {exList.map((ex, idx) => (
              <div key={idx} className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Ex #{idx + 1}</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive text-xs" onClick={() => removeEx(idx)}>Remove</Button>
                </div>
                <Input placeholder="Name or nickname" value={ex.name} onChange={(e) => updateEx(idx, "name", e.target.value)} />
                <Input placeholder="Duration (e.g. 2 years)" value={ex.duration} onChange={(e) => updateEx(idx, "duration", e.target.value)} />
                <Input placeholder="How it ended" value={ex.endReason} onChange={(e) => updateEx(idx, "endReason", e.target.value)} />
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full gap-2" onClick={addEx}>
              + Add an Ex
            </Button>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">General notes on their past relationships</Label>
              <Textarea
                placeholder="Patterns you've noticed, what they've shared about exes, red/green flags..."
                value={formData.their_relationship_notes as string || ""}
                onChange={(e) => updateField("their_relationship_notes", e.target.value)}
                rows={4}
              />
            </div>
          </div>
        );
      }
      case "mental_health":
        return (
          <div className="space-y-4">
            {renderSelectField("their_in_therapy", "In therapy?", THERAPY_OPTIONS)}
            {renderSelectField("their_mental_health_awareness", "Mental health awareness", MENTAL_HEALTH_OPTIONS)}
          </div>
        );
      case "chemistry":
        return (
          <div className="space-y-4">
            {renderSliderField("physical_attraction", "Physical Attraction")}
            {renderSliderField("overall_chemistry", "Overall Chemistry")}
            {renderSliderField("intellectual_connection", "Intellectual Connection")}
            {renderSliderField("humor_compatibility", "Humor Compatibility")}
            {renderSliderField("energy_match", "Energy Match")}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} modal={false}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 z-[60]" hideOverlay onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col h-full">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-base">
              <span className="text-lg">{config?.emoji}</span>
              {config?.title || "Update Candidate"}
              {candidate && (
                <span className="text-muted-foreground font-normal">— {candidate.nickname}</span>
              )}
            </SheetTitle>
            <p className="text-xs text-muted-foreground">
              Fill in what you know — you can always update later
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {renderSection()}
          </div>

          <div className="px-5 py-4 border-t border-border bg-background safe-area-bottom space-y-2">
            <Button
              className="w-full h-11 font-semibold gap-2"
              onClick={handleSave}
              disabled={saving || saved}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Save & Continue
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full h-9 text-muted-foreground text-sm"
              onClick={onClose}
              disabled={saving}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
