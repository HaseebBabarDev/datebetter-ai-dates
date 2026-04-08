import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Profile = Tables<"profiles">;

interface InlineProfileEditorProps {
  open: boolean;
  sectionId: string | null;
  profile: Profile | null;
  userId: string;
  onClose: () => void;
  onSaved: (updatedProfile: Profile) => void;
}

const GENDER_OPTIONS = [
  { value: "woman_cis", label: "Woman" },
  { value: "woman_trans", label: "Woman (transgender)" },
  { value: "man_cis", label: "Man" },
  { value: "man_trans", label: "Man (transgender)" },
  { value: "non_binary", label: "Non-binary" },
  { value: "gender_fluid", label: "Gender fluid" },
  { value: "self_describe", label: "Prefer to self-describe" },
];

const PRONOUN_OPTIONS = [
  { value: "she_her", label: "She/Her" },
  { value: "he_him", label: "He/Him" },
  { value: "they_them", label: "They/Them" },
  { value: "other", label: "Other" },
];

const HEIGHT_OPTIONS = [
  { value: "under_5ft", label: "Under 5'0\"" },
  { value: "5ft_5ft3", label: "5'0\" - 5'3\"" },
  { value: "5ft4_5ft6", label: "5'4\" - 5'6\"" },
  { value: "5ft7_5ft9", label: "5'7\" - 5'9\"" },
  { value: "5ft10_6ft", label: "5'10\" - 6'0\"" },
  { value: "over_6ft", label: "Over 6'0\"" },
];

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "MX", label: "Mexico" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
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
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const KIDS_DESIRE_OPTIONS = [
  { value: "definitely_yes", label: "Definitely want kids" },
  { value: "maybe", label: "Open to kids" },
  { value: "definitely_no", label: "Don't want kids" },
  { value: "already_have", label: "Already have kids, done" },
  { value: "unsure", label: "Not sure yet" },
];

const KIDS_STATUS_OPTIONS = [
  { value: "no_kids", label: "No children" },
  { value: "has_young_kids", label: "Yes, young children" },
  { value: "has_adult_kids", label: "Yes, adult children" },
];

const COMMUNICATION_STYLE_OPTIONS = [
  { value: "direct", label: "Direct" },
  { value: "diplomatic", label: "Diplomatic" },
  { value: "passive", label: "Passive" },
  { value: "analytical", label: "Analytical" },
  { value: "expressive", label: "Expressive" },
];

const CONFLICT_STYLE_OPTIONS = [
  { value: "confrontational", label: "Address it head-on" },
  { value: "avoidant", label: "Tend to avoid conflict" },
  { value: "collaborative", label: "Work through it together" },
  { value: "compromiser", label: "Seek compromise" },
  { value: "accommodating", label: "Go with the flow" },
];

const ATTACHMENT_STYLE_OPTIONS = [
  { value: "secure", label: "Secure" },
  { value: "anxious", label: "Anxious" },
  { value: "avoidant", label: "Avoidant" },
  { value: "fearful_avoidant", label: "Fearful-Avoidant" },
  { value: "unsure", label: "Not sure" },
];

const CAREER_STAGE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "early_career", label: "Early career" },
  { value: "mid_career", label: "Mid career" },
  { value: "senior", label: "Senior/Executive" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "freelance", label: "Freelance" },
  { value: "career_change", label: "Career change" },
  { value: "retired", label: "Retired" },
];

const EDUCATION_OPTIONS = [
  { value: "high_school", label: "High school" },
  { value: "some_college", label: "Some college" },
  { value: "associates", label: "Associate's degree" },
  { value: "bachelors", label: "Bachelor's degree" },
  { value: "masters", label: "Master's degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "trade_school", label: "Trade/Vocational" },
];

const POLITICS_OPTIONS = [
  { value: "liberal", label: "Liberal" },
  { value: "moderate", label: "Moderate" },
  { value: "conservative", label: "Conservative" },
  { value: "libertarian", label: "Libertarian" },
  { value: "apolitical", label: "Apolitical" },
  { value: "other", label: "Other" },
];

const SOCIAL_STYLE_OPTIONS = [
  { value: "homebody", label: "Homebody" },
  { value: "social_butterfly", label: "Social butterfly" },
  { value: "balanced", label: "Balanced" },
  { value: "mood_dependent", label: "Depends on my mood" },
];

const SECTION_CONFIG: Record<string, { title: string; emoji: string; subtitle: string }> = {
  identity: { title: "Basic Identity", emoji: "👤", subtitle: "Tell us about yourself" },
  dating_prefs: { title: "Dating Preferences", emoji: "💘", subtitle: "Who are you looking for?" },
  goals: { title: "Relationship Goals", emoji: "🎯", subtitle: "What are you looking for?" },
  values: { title: "Faith & Values", emoji: "🙏", subtitle: "Your beliefs and values" },
  kids_family: { title: "Kids & Family", emoji: "👶", subtitle: "Family planning" },
  career: { title: "Career & Lifestyle", emoji: "💼", subtitle: "Work and life balance" },
  communication: { title: "Communication Style", emoji: "💬", subtitle: "How you connect" },
  past_patterns: { title: "Past Patterns", emoji: "🔄", subtitle: "Your relationship history" },
  family_upbringing: { title: "Family Background", emoji: "🏠", subtitle: "Where you come from" },
  boundaries: { title: "Boundaries & Safety", emoji: "🛡️", subtitle: "Your dealbreakers and limits" },
  mental_health: { title: "Mental Health", emoji: "🧠", subtitle: "Therapy and self-awareness" },
  relationship_trauma: { title: "Past Relationships", emoji: "💔", subtitle: "What you've been through" },
  healing: { title: "Healing & Growth", emoji: "🌱", subtitle: "Where you are in your journey" },
  dating_style: { title: "Dating Style", emoji: "✨", subtitle: "How you show up in dating" },
};

const PARENTS_RELATIONSHIP_OPTIONS = [
  { value: "healthy", label: "Healthy / Loving" },
  { value: "complicated", label: "Complicated" },
  { value: "conflictual", label: "High conflict" },
  { value: "divorced", label: "Divorced / Separated" },
  { value: "absent_parent", label: "Absent parent" },
  { value: "codependent", label: "Codependent" },
];

const FELT_LOVED_OPTIONS = [
  { value: "yes", label: "Yes, consistently" },
  { value: "sometimes", label: "Sometimes" },
  { value: "rarely", label: "Rarely" },
  { value: "no", label: "No" },
];

export const InlineProfileEditor: React.FC<InlineProfileEditorProps> = ({
  open,
  sectionId,
  profile,
  userId,
  onClose,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize form data from profile when opening
  useEffect(() => {
    if (open && profile && sectionId) {
      const data: Record<string, any> = {};
      switch (sectionId) {
        case "identity":
          data.name = profile.name || "";
          data.gender_identity = profile.gender_identity || "";
          data.pronouns = profile.pronouns || "";
          data.birth_date = profile.birth_date || "";
          data.height = profile.height || "";
          data.body_type = profile.body_type || "";
          data.country = profile.country || "";
          data.city = profile.city || "";
          data.state = profile.state || "";
          // Parse birth date
          if (profile.birth_date) {
            const parts = profile.birth_date.split("-");
            data.birth_month = parts[1] || "";
            data.birth_day = parts[2] || "";
            data.birth_year = parts[0] || "";
          }
          break;
        case "dating_prefs":
          data.interested_in = profile.interested_in || [];
          data.preferred_age_min = profile.preferred_age_min || "";
          data.preferred_age_max = profile.preferred_age_max || "";
          data.height_preference = profile.height_preference || "";
          data.distance_preference = profile.distance_preference || "";
          data.attraction_importance = profile.attraction_importance || 5;
          break;
        case "goals":
          data.relationship_goal = profile.relationship_goal || "";
          data.relationship_structure = profile.relationship_structure || "";
          data.relationship_motivation = profile.relationship_motivation || "";
          break;
        case "values":
          data.religion = profile.religion || "";
          data.faith_importance = profile.faith_importance || 3;
          data.religion_practice_level = profile.religion_practice_level || "";
          data.politics = profile.politics || "";
          data.politics_importance = profile.politics_importance || 3;
          break;
        case "kids_family":
          data.kids_status = profile.kids_status || "";
          data.kids_desire = profile.kids_desire || "";
          data.kids_timeline = profile.kids_timeline || "";
          data.marriage_before_kids = profile.marriage_before_kids || false;
          break;
        case "career":
          data.career_stage = profile.career_stage || "";
          data.education_level = profile.education_level || "";
          data.ambition_level = profile.ambition_level || 5;
          data.work_schedule_type = profile.work_schedule_type || "";
          data.social_style = profile.social_style || "";
          break;
        case "communication":
          data.communication_style = profile.communication_style || "";
          data.conflict_style = profile.conflict_style || "";
          data.response_time_preference = profile.response_time_preference || 5;
          break;
        case "past_patterns":
          data.attachment_style = profile.attachment_style || "";
          data.typical_partner_type = profile.typical_partner_type || "";
          data.longest_relationship = profile.longest_relationship || "";
          data.time_since_last_relationship = profile.time_since_last_relationship || "";
          break;
        case "family_upbringing":
          data.parents_relationship_dynamic = profile.parents_relationship_dynamic || "";
          data.felt_loved_as_child = profile.felt_loved_as_child || "";
          data.parent_status = profile.parent_status || "";
          data.family_stability = profile.family_stability || "";
          data.healthy_relationship_models = profile.healthy_relationship_models ?? null;
          break;
        case "boundaries":
          data.boundary_strength = profile.boundary_strength || 5;
          data.intimacy_comfort = profile.intimacy_comfort || "";
          data.red_flag_sensitivity = profile.red_flag_sensitivity || 5;
          break;
        case "mental_health":
          data.is_neurodivergent = (profile as any).is_neurodivergent || "";
          data.mental_health_openness = profile.mental_health_openness || "";
          data.mental_health_importance = profile.mental_health_importance || 5;
          data.in_therapy = profile.in_therapy ?? null;
          break;
        case "relationship_trauma":
          data.relationship_trauma_notes = profile.relationship_trauma_notes || "";
          data.ex_contact_status = profile.ex_contact_status || "";
          data.typical_partner_type = profile.typical_partner_type || "";
          break;
        case "healing":
          data.over_ex_level = profile.over_ex_level || 5;
          data.attachment_to_past = profile.attachment_to_past || 5;
          data.ex_contact_status = profile.ex_contact_status || "";
          break;
        case "dating_style":
          data.dating_honesty_intent = profile.dating_honesty_intent || "";
          data.dating_history_text = profile.dating_history_text || "";
          break;
      }
      setFormData(data);
    }
  }, [open, profile, sectionId]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!sectionId) return;
    setSaving(true);

    try {
      const updates: Record<string, any> = {};

      switch (sectionId) {
        case "identity":
          updates.name = formData.name || null;
          updates.gender_identity = formData.gender_identity || null;
          updates.pronouns = formData.pronouns || null;
          updates.height = formData.height || null;
          updates.body_type = formData.body_type || null;
          updates.country = formData.country || null;
          updates.city = formData.city || null;
          updates.state = formData.state || null;
          if (formData.birth_month && formData.birth_day && formData.birth_year?.length === 4) {
            updates.birth_date = `${formData.birth_year}-${String(formData.birth_month).padStart(2, "0")}-${String(formData.birth_day).padStart(2, "0")}`;
          }
          break;
        case "dating_prefs":
          updates.interested_in = formData.interested_in?.length ? formData.interested_in : null;
          updates.preferred_age_min = formData.preferred_age_min ? Number(formData.preferred_age_min) : null;
          updates.preferred_age_max = formData.preferred_age_max ? Number(formData.preferred_age_max) : null;
          updates.height_preference = formData.height_preference || null;
          updates.distance_preference = formData.distance_preference || null;
          updates.attraction_importance = formData.attraction_importance;
          break;
        case "goals":
          updates.relationship_goal = formData.relationship_goal || null;
          updates.relationship_structure = formData.relationship_structure || null;
          updates.relationship_motivation = formData.relationship_motivation || null;
          break;
        case "values":
          updates.religion = formData.religion || null;
          updates.faith_importance = formData.faith_importance;
          updates.religion_practice_level = formData.religion_practice_level || null;
          updates.politics = formData.politics || null;
          updates.politics_importance = formData.politics_importance;
          break;
        case "kids_family":
          updates.kids_status = formData.kids_status || null;
          updates.kids_desire = formData.kids_desire || null;
          updates.kids_timeline = formData.kids_timeline || null;
          updates.marriage_before_kids = formData.marriage_before_kids;
          break;
        case "career":
          updates.career_stage = formData.career_stage || null;
          updates.education_level = formData.education_level || null;
          updates.ambition_level = formData.ambition_level;
          updates.work_schedule_type = formData.work_schedule_type || null;
          updates.social_style = formData.social_style || null;
          break;
        case "communication":
          updates.communication_style = formData.communication_style || null;
          updates.conflict_style = formData.conflict_style || null;
          updates.response_time_preference = formData.response_time_preference;
          break;
        case "past_patterns":
          updates.attachment_style = formData.attachment_style || null;
          updates.typical_partner_type = formData.typical_partner_type || null;
          updates.longest_relationship = formData.longest_relationship || null;
          updates.time_since_last_relationship = formData.time_since_last_relationship || null;
          break;
        case "family_upbringing":
          updates.parents_relationship_dynamic = formData.parents_relationship_dynamic || null;
          updates.felt_loved_as_child = formData.felt_loved_as_child || null;
          updates.parent_status = formData.parent_status || null;
          updates.family_stability = formData.family_stability || null;
          updates.healthy_relationship_models = formData.healthy_relationship_models;
          break;
        case "boundaries":
          updates.boundary_strength = formData.boundary_strength;
          updates.intimacy_comfort = formData.intimacy_comfort || null;
          updates.red_flag_sensitivity = formData.red_flag_sensitivity;
          break;
        case "mental_health":
          updates.is_neurodivergent = formData.is_neurodivergent || null;
          updates.mental_health_openness = formData.mental_health_openness || null;
          updates.mental_health_importance = formData.mental_health_importance;
          updates.in_therapy = formData.in_therapy;
          break;
        case "relationship_trauma":
          updates.relationship_trauma_notes = formData.relationship_trauma_notes || null;
          updates.ex_contact_status = formData.ex_contact_status || null;
          updates.typical_partner_type = formData.typical_partner_type || null;
          break;
        case "healing":
          updates.over_ex_level = formData.over_ex_level;
          updates.attachment_to_past = formData.attachment_to_past;
          updates.ex_contact_status = formData.ex_contact_status || null;
          break;
        case "dating_style":
          updates.dating_honesty_intent = formData.dating_honesty_intent || null;
          updates.dating_history_text = formData.dating_history_text || null;
          break;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      toast.success("Profile updated!");
      onSaved(data as Profile);
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const config = sectionId ? SECTION_CONFIG[sectionId] : null;
  if (!config) return null;

  const renderSection = () => {
    switch (sectionId) {
      case "identity":
        return (
          <div className="space-y-4">
            <Field label="Your Name">
              <Input value={formData.name || ""} onChange={e => updateField("name", e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Date of Birth">
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="MM" value={formData.birth_month || ""} onChange={e => updateField("birth_month", e.target.value)} className="text-center" min={1} max={12} />
                <Input type="number" placeholder="DD" value={formData.birth_day || ""} onChange={e => updateField("birth_day", e.target.value)} className="text-center" min={1} max={31} />
                <Input type="number" placeholder="YYYY" value={formData.birth_year || ""} onChange={e => updateField("birth_year", e.target.value)} className="text-center" min={1900} max={new Date().getFullYear()} />
              </div>
            </Field>
            <Field label="Gender Identity">
              <SelectField value={formData.gender_identity} onChange={v => updateField("gender_identity", v)} options={GENDER_OPTIONS} placeholder="Select gender" />
            </Field>
            <Field label="Pronouns">
              <SelectField value={formData.pronouns} onChange={v => updateField("pronouns", v)} options={PRONOUN_OPTIONS} placeholder="Select pronouns" />
            </Field>
            <Field label="Country">
              <SelectField value={formData.country} onChange={v => updateField("country", v)} options={COUNTRY_OPTIONS} placeholder="Select country" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <Input value={formData.city || ""} onChange={e => updateField("city", e.target.value)} placeholder="City" />
              </Field>
              <Field label="State">
                <Input value={formData.state || ""} onChange={e => updateField("state", e.target.value)} placeholder="State" />
              </Field>
            </div>
            <Field label="Height">
              <SelectField value={formData.height} onChange={v => updateField("height", v)} options={HEIGHT_OPTIONS} placeholder="Select height" />
            </Field>
          </div>
        );

      case "dating_prefs":
        return (
          <div className="space-y-4">
            <Field label="Interested In">
              <div className="flex flex-wrap gap-2">
                {["men", "women", "non-binary", "everyone"].map(opt => {
                  const selected = (formData.interested_in || []).includes(opt);
                  return (
                    <button key={opt} type="button" onClick={() => {
                      const current = formData.interested_in || [];
                      updateField("interested_in", selected ? current.filter((i: string) => i !== opt) : [...current, opt]);
                    }} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"}`}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Preferred Age Range">
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Min age" value={formData.preferred_age_min || ""} onChange={e => updateField("preferred_age_min", e.target.value)} min={18} max={99} />
                <Input type="number" placeholder="Max age" value={formData.preferred_age_max || ""} onChange={e => updateField("preferred_age_max", e.target.value)} min={18} max={99} />
              </div>
            </Field>
            <Field label="Height Preference">
              <SelectField value={formData.height_preference} onChange={v => updateField("height_preference", v)} options={[
                { value: "shorter", label: "Shorter than me" },
                { value: "same_height", label: "Same height" },
                { value: "taller", label: "Taller than me" },
                { value: "no_preference", label: "No preference" },
              ]} placeholder="Select preference" />
            </Field>
            <Field label="Distance Preference">
              <SelectField value={formData.distance_preference} onChange={v => updateField("distance_preference", v)} options={[
                { value: "same_city", label: "Same city" },
                { value: "same_state", label: "Same state/region" },
                { value: "same_country", label: "Same country" },
                { value: "open_to_ldr", label: "Open to long-distance" },
              ]} placeholder="Select distance" />
            </Field>
            <Field label={`Physical Attraction Importance: ${formData.attraction_importance || 5}/10`}>
              <input type="range" min={1} max={10} value={formData.attraction_importance || 5} onChange={e => updateField("attraction_importance", Number(e.target.value))} className="w-full accent-primary" />
            </Field>
          </div>
        );

      case "goals":
        return (
          <div className="space-y-4">
            <Field label="Relationship Goal">
              <SelectField value={formData.relationship_goal} onChange={v => updateField("relationship_goal", v)} options={RELATIONSHIP_GOAL_OPTIONS} placeholder="What are you looking for?" />
            </Field>
            <Field label="Relationship Structure">
              <SelectField value={formData.relationship_structure} onChange={v => updateField("relationship_structure", v)} options={[
                { value: "monogamous", label: "Monogamous" },
                { value: "open", label: "Open relationship" },
                { value: "polyamorous", label: "Polyamorous" },
                { value: "flexible", label: "Flexible" },
              ]} placeholder="Select structure" />
            </Field>
            <Field label="What motivates you to date?">
              <Input value={formData.relationship_motivation || ""} onChange={e => updateField("relationship_motivation", e.target.value)} placeholder="e.g., companionship, growth, love..." />
            </Field>
          </div>
        );

      case "values":
        return (
          <div className="space-y-4">
            <Field label="Religion / Spirituality">
              <SelectField value={formData.religion} onChange={v => updateField("religion", v)} options={RELIGION_OPTIONS} placeholder="Select religion" />
            </Field>
            <Field label={`Faith Importance: ${formData.faith_importance || 3}/10`}>
              <input type="range" min={1} max={10} value={formData.faith_importance || 3} onChange={e => updateField("faith_importance", Number(e.target.value))} className="w-full accent-primary" />
            </Field>
            <Field label="Practice Level">
              <SelectField value={formData.religion_practice_level} onChange={v => updateField("religion_practice_level", v)} options={[
                { value: "devout", label: "Devout / Very active" },
                { value: "practicing", label: "Practicing" },
                { value: "cultural", label: "Cultural only" },
                { value: "casual", label: "Casual" },
              ]} placeholder="How actively?" />
            </Field>
            <Field label="Political Leaning">
              <SelectField value={formData.politics} onChange={v => updateField("politics", v)} options={POLITICS_OPTIONS} placeholder="Select politics" />
            </Field>
            <Field label={`Politics Importance: ${formData.politics_importance || 3}/10`}>
              <input type="range" min={1} max={10} value={formData.politics_importance || 3} onChange={e => updateField("politics_importance", Number(e.target.value))} className="w-full accent-primary" />
            </Field>
          </div>
        );

      case "kids_family":
        return (
          <div className="space-y-4">
            <Field label="Current Kids Status">
              <SelectField value={formData.kids_status} onChange={v => updateField("kids_status", v)} options={KIDS_STATUS_OPTIONS} placeholder="Your situation" />
            </Field>
            <Field label="Do You Want Kids?">
              <SelectField value={formData.kids_desire} onChange={v => updateField("kids_desire", v)} options={KIDS_DESIRE_OPTIONS} placeholder="Your preference" />
            </Field>
            <Field label="Kids Timeline">
              <SelectField value={formData.kids_timeline} onChange={v => updateField("kids_timeline", v)} options={[
                { value: "asap", label: "As soon as possible" },
                { value: "1_2_years", label: "1-2 years" },
                { value: "3_5_years", label: "3-5 years" },
                { value: "someday", label: "Someday, not sure when" },
                { value: "never", label: "Never" },
              ]} placeholder="When?" />
            </Field>
            <Field label="Marriage before kids?">
              <div className="flex gap-3">
                {[true, false].map(val => (
                  <button key={String(val)} type="button" onClick={() => updateField("marriage_before_kids", val)} className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${formData.marriage_before_kids === val ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        );

      case "career":
        return (
          <div className="space-y-4">
            <Field label="Career Stage">
              <SelectField value={formData.career_stage} onChange={v => updateField("career_stage", v)} options={CAREER_STAGE_OPTIONS} placeholder="Select stage" />
            </Field>
            <Field label="Education Level">
              <SelectField value={formData.education_level} onChange={v => updateField("education_level", v)} options={EDUCATION_OPTIONS} placeholder="Select education" />
            </Field>
            <Field label={`Ambition Level: ${formData.ambition_level || 5}/10`}>
              <input type="range" min={1} max={10} value={formData.ambition_level || 5} onChange={e => updateField("ambition_level", Number(e.target.value))} className="w-full accent-primary" />
            </Field>
            <Field label="Social Style">
              <SelectField value={formData.social_style} onChange={v => updateField("social_style", v)} options={SOCIAL_STYLE_OPTIONS} placeholder="How social?" />
            </Field>
            <Field label="Work Schedule">
              <SelectField value={formData.work_schedule_type} onChange={v => updateField("work_schedule_type", v)} options={[
                { value: "9_to_5", label: "9-5 / Standard" },
                { value: "flexible", label: "Flexible" },
                { value: "shift_work", label: "Shift work" },
                { value: "remote", label: "Remote" },
                { value: "freelance", label: "Freelance / Variable" },
              ]} placeholder="Select schedule" />
            </Field>
          </div>
        );

      case "communication":
        return (
          <div className="space-y-4">
            <Field label="Communication Style">
              <SelectField value={formData.communication_style} onChange={v => updateField("communication_style", v)} options={COMMUNICATION_STYLE_OPTIONS} placeholder="How do you communicate?" />
            </Field>
            <Field label="Conflict Style">
              <SelectField value={formData.conflict_style} onChange={v => updateField("conflict_style", v)} options={CONFLICT_STYLE_OPTIONS} placeholder="How do you handle conflict?" />
            </Field>
            <Field label={`Response Time Preference: ${formData.response_time_preference || 5}/10`}>
              <input type="range" min={1} max={10} value={formData.response_time_preference || 5} onChange={e => updateField("response_time_preference", Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Patient</span>
                <span>Need quick replies</span>
              </div>
            </Field>
          </div>
        );

      case "past_patterns":
        return (
          <div className="space-y-4">
            <Field label="Attachment Style">
              <SelectField value={formData.attachment_style} onChange={v => updateField("attachment_style", v)} options={ATTACHMENT_STYLE_OPTIONS} placeholder="Select attachment style" />
            </Field>
            <Field label="Typical Partner Type">
              <Input value={formData.typical_partner_type || ""} onChange={e => updateField("typical_partner_type", e.target.value)} placeholder="e.g., ambitious, creative, nurturing..." />
            </Field>
            <Field label="Longest Relationship">
              <SelectField value={formData.longest_relationship} onChange={v => updateField("longest_relationship", v)} options={[
                { value: "never", label: "Never been in one" },
                { value: "under_6months", label: "Under 6 months" },
                { value: "6months_1year", label: "6 months - 1 year" },
                { value: "1_3years", label: "1-3 years" },
                { value: "3_5years", label: "3-5 years" },
                { value: "5plus", label: "5+ years" },
              ]} placeholder="Select duration" />
            </Field>
            <Field label="Time Since Last Relationship">
              <SelectField value={formData.time_since_last_relationship} onChange={v => updateField("time_since_last_relationship", v)} options={[
                { value: "currently_in", label: "Currently in one" },
                { value: "under_3months", label: "Under 3 months" },
                { value: "3_6months", label: "3-6 months" },
                { value: "6months_1year", label: "6 months - 1 year" },
                { value: "1_2years", label: "1-2 years" },
                { value: "2plus", label: "2+ years" },
                { value: "never", label: "Never been in one" },
              ]} placeholder="How long ago?" />
            </Field>
          </div>
        );

      case "family_upbringing":
        return (
          <div className="space-y-4">
            <Field label="Parents' Relationship">
              <SelectField value={formData.parents_relationship_dynamic} onChange={v => updateField("parents_relationship_dynamic", v)} options={PARENTS_RELATIONSHIP_OPTIONS} placeholder="Describe their dynamic" />
            </Field>
            <Field label="Did you feel loved as a child?">
              <SelectField value={formData.felt_loved_as_child} onChange={v => updateField("felt_loved_as_child", v)} options={FELT_LOVED_OPTIONS} placeholder="Select" />
            </Field>
            <Field label="Family Stability Growing Up">
              <SelectField value={formData.family_stability} onChange={v => updateField("family_stability", v)} options={[
                { value: "very_stable", label: "Very stable" },
                { value: "mostly_stable", label: "Mostly stable" },
                { value: "somewhat_unstable", label: "Somewhat unstable" },
                { value: "unstable", label: "Unstable" },
              ]} placeholder="Select stability" />
            </Field>
            <Field label="Healthy relationship role models?">
              <div className="flex gap-3">
                {[{ val: true, label: "Yes" }, { val: false, label: "No" }].map(({ val, label }) => (
                  <button key={label} type="button" onClick={() => updateField("healthy_relationship_models", val)} className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${formData.healthy_relationship_models === val ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        );

      case "boundaries":
        return (
          <div className="space-y-4">
            <Field label={`Boundary Strength: ${formData.boundary_strength || 5}/10`}>
              <input type="range" min={1} max={10} value={formData.boundary_strength || 5} onChange={e => updateField("boundary_strength", Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Flexible</span>
                <span>Very firm</span>
              </div>
            </Field>
            <Field label={`Red Flag Sensitivity: ${formData.red_flag_sensitivity || 5}/10`}>
              <input type="range" min={1} max={10} value={formData.red_flag_sensitivity || 5} onChange={e => updateField("red_flag_sensitivity", Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Lenient</span>
                <span>Zero tolerance</span>
              </div>
            </Field>
            <Field label="Intimacy Comfort">
              <SelectField value={formData.intimacy_comfort} onChange={v => updateField("intimacy_comfort", v)} options={[
                { value: "very_comfortable", label: "Very comfortable" },
                { value: "comfortable", label: "Comfortable" },
                { value: "takes_time", label: "Takes time" },
                { value: "cautious", label: "Cautious" },
                { value: "uncomfortable", label: "Not comfortable yet" },
              ]} placeholder="How comfortable?" />
            </Field>
          </div>
        );

      case "mental_health":
        return (
          <div className="space-y-4">
            <Field label="Are you neurodivergent?">
              <SelectField value={formData.is_neurodivergent} onChange={v => updateField("is_neurodivergent", v)} options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "suspect", label: "I suspect so" },
                { value: "prefer_not_say", label: "Prefer not to say" },
              ]} placeholder="Select" />
            </Field>
            <Field label="Mental Health Openness">
              <SelectField value={formData.mental_health_openness} onChange={v => updateField("mental_health_openness", v)} options={[
                { value: "very_open", label: "Very open about it" },
                { value: "somewhat_open", label: "Somewhat open" },
                { value: "private", label: "Keep it private" },
                { value: "uncomfortable", label: "Uncomfortable discussing" },
              ]} placeholder="How open are you?" />
            </Field>
            <Field label="Currently in therapy?">
              <div className="flex gap-3">
                {[{ val: true, label: "Yes" }, { val: false, label: "No" }].map(({ val, label }) => (
                  <button key={label} type="button" onClick={() => updateField("in_therapy", val)} className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${formData.in_therapy === val ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`Mental Health Importance in Partner: ${formData.mental_health_importance || 5}/10`}>
              <input type="range" min={1} max={10} value={formData.mental_health_importance || 5} onChange={e => updateField("mental_health_importance", Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Not important</span>
                <span>Very important</span>
              </div>
            </Field>
          </div>
        );

      case "relationship_trauma":
        return (
          <div className="space-y-4">
            <Field label="Contact with your ex?">
              <SelectField value={formData.ex_contact_status} onChange={v => updateField("ex_contact_status", v)} options={[
                { value: "no_contact", label: "No contact" },
                { value: "minimal", label: "Minimal / Occasional" },
                { value: "friendly", label: "Friendly" },
                { value: "coparenting", label: "Co-parenting" },
                { value: "complicated", label: "It's complicated" },
                { value: "no_ex", label: "No ex to speak of" },
              ]} placeholder="Select" />
            </Field>
            <Field label="Type of partners you typically attract">
              <Input value={formData.typical_partner_type || ""} onChange={e => updateField("typical_partner_type", e.target.value)} placeholder="e.g., emotionally unavailable, love bombers..." />
            </Field>
            <Field label="Notes about past relationships">
              <textarea
                value={formData.relationship_trauma_notes || ""}
                onChange={e => updateField("relationship_trauma_notes", e.target.value)}
                placeholder="Anything D.E.V.I. should know about your past relationships — patterns, trauma, lessons learned..."
                className="w-full min-h-[100px] rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </Field>
          </div>
        );

      case "healing":
        return (
          <div className="space-y-4">
            <Field label="Contact with your ex?">
              <SelectField value={formData.ex_contact_status} onChange={v => updateField("ex_contact_status", v)} options={[
                { value: "no_contact", label: "No contact" },
                { value: "minimal", label: "Minimal / Occasional" },
                { value: "friendly", label: "Friendly" },
                { value: "coparenting", label: "Co-parenting" },
                { value: "complicated", label: "It's complicated" },
                { value: "no_ex", label: "No ex to speak of" },
              ]} placeholder="Select" />
            </Field>
            <Field label={`How over your ex are you? ${formData.over_ex_level || 5}/10`}>
              <input type="range" min={1} max={10} value={formData.over_ex_level || 5} onChange={e => updateField("over_ex_level", Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Not at all</span>
                <span>Completely over it</span>
              </div>
            </Field>
            <Field label={`Attachment to the past: ${formData.attachment_to_past || 5}/10`}>
              <input type="range" min={1} max={10} value={formData.attachment_to_past || 5} onChange={e => updateField("attachment_to_past", Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Moved on</span>
                <span>Still attached</span>
              </div>
            </Field>
          </div>
        );

      case "dating_style":
        return (
          <div className="space-y-4">
            <Field label="How honest are you when dating?">
              <SelectField value={formData.dating_honesty_intent} onChange={v => updateField("dating_honesty_intent", v)} options={[
                { value: "fully_honest", label: "Fully honest / transparent" },
                { value: "mostly_honest", label: "Mostly honest" },
                { value: "white_lies", label: "Small white lies sometimes" },
                { value: "strategic", label: "Strategic about what I share" },
              ]} placeholder="Select" />
            </Field>
            <Field label="Describe your dating history">
              <textarea
                value={formData.dating_history_text || ""}
                onChange={e => updateField("dating_history_text", e.target.value)}
                placeholder="Tell D.E.V.I. about your dating journey — how many relationships, what worked, what didn't..."
                className="w-full min-h-[100px] rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </Field>
          </div>
        );

      default:
        return <p className="text-muted-foreground text-sm">Section not found</p>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()} modal={false}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 z-[60]">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-5 pb-3 border-b border-border/50 bg-gradient-to-br from-primary/10 to-background">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
                <span className="text-lg">{config.emoji}</span>
              </div>
              <div>
                <SheetTitle className="text-lg font-bold">{config.title}</SheetTitle>
                <p className="text-sm text-muted-foreground">{config.subtitle}</p>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-5 py-4">
            {renderSection()}
          </ScrollArea>

          <div className="p-5 pt-3 border-t border-border/50 bg-muted/30">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 rounded-xl bg-[image:var(--gradient-hero)] hover:opacity-90 font-semibold text-base"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Helper components
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);

const SelectField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}> = ({ value, onChange, options, placeholder }) => (
  <Select value={value || undefined} onValueChange={onChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map(opt => (
        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);
