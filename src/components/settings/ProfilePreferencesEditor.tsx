import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { SliderInput } from "@/components/onboarding/SliderInput";
import { 
  User, Heart, Users, Baby, Church, Vote, Briefcase, 
  MapPin, Sparkles, MessageCircle, Brain, Shield, Lock, Save,
  Target, Stethoscope, Ruler, TrendingDown, DollarSign, CheckCircle2, AlertCircle,
  Home
} from "lucide-react";
import { toast } from "sonner";
import { MultiSelectOption } from "@/components/onboarding/MultiSelectOption";
import { Progress } from "@/components/ui/progress";
import { DeviSettings } from "@/components/settings/DeviSettings";

type Profile = Tables<"profiles">;

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

const ORIENTATION_OPTIONS = [
  { value: "straight", label: "Straight" },
  { value: "lesbian", label: "Lesbian" },
  { value: "bisexual", label: "Bisexual" },
  { value: "pansexual", label: "Pansexual" },
  { value: "queer", label: "Queer" },
  { value: "asexual", label: "Asexual" },
  { value: "no_label", label: "Prefer not to label" },
  { value: "self_describe", label: "Self-describe" },
];

const RELATIONSHIP_GOAL_OPTIONS = [
  { value: "casual", label: "Casual dating" },
  { value: "situationship", label: "Situationship" },
  { value: "dating", label: "Dating, open to serious" },
  { value: "serious", label: "Serious relationship" },
  { value: "marriage", label: "Marriage" },
  { value: "unsure", label: "Still figuring it out" },
];

const RELATIONSHIP_STRUCTURE_OPTIONS = [
  { value: "monogamous", label: "Monogamous" },
  { value: "open", label: "Open relationship" },
  { value: "polyamorous", label: "Polyamorous" },
  { value: "unsure", label: "Exploring options" },
];

const RELATIONSHIP_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "recently_divorced", label: "Recently Divorced" },
  { value: "ethical_non_monogamy", label: "Ethical Non-Monogamy" },
];

const KIDS_STATUS_OPTIONS = [
  { value: "no_kids", label: "No kids" },
  { value: "has_young_kids", label: "Have young kids" },
  { value: "has_adult_kids", label: "Have adult kids" },
];

const KIDS_DESIRE_OPTIONS = [
  { value: "definitely_yes", label: "Definitely want kids" },
  { value: "maybe", label: "Open to kids" },
  { value: "definitely_no", label: "Don't want kids" },
  { value: "already_have", label: "Already have kids, done" },
];

const RELIGION_OPTIONS = [
  { value: "none", label: "Not religious" },
  { value: "spiritual", label: "Spiritual but not religious" },
  { value: "christian_catholic", label: "Christian - Catholic" },
  { value: "christian_protestant", label: "Christian - Protestant" },
  { value: "christian_other", label: "Christian - Other" },
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
];

const SOCIAL_STYLE_OPTIONS = [
  { value: "homebody", label: "Homebody" },
  { value: "social_butterfly", label: "Social butterfly" },
  { value: "balanced", label: "Balanced" },
  { value: "mood_dependent", label: "Depends on my mood" },
];

const COMMUNICATION_STYLE_OPTIONS = [
  { value: "direct", label: "Direct & straightforward" },
  { value: "diplomatic", label: "Diplomatic & tactful" },
  { value: "emotional", label: "Emotional & expressive" },
  { value: "logical", label: "Logical & analytical" },
  { value: "adaptable", label: "Adaptable" },
];

const ATTACHMENT_STYLE_OPTIONS = [
  { value: "secure", label: "Secure" },
  { value: "anxious", label: "Anxious" },
  { value: "avoidant", label: "Avoidant" },
  { value: "disorganized", label: "Disorganized/Fearful" },
];

const CYCLE_REGULARITY_OPTIONS = [
  { value: "very_regular", label: "Very regular" },
  { value: "somewhat_regular", label: "Somewhat regular" },
  { value: "irregular", label: "Irregular" },
  { value: "pcos_endo", label: "PCOS/Endometriosis" },
  { value: "perimenopause", label: "Perimenopause" },
  { value: "not_applicable", label: "Not applicable" },
];

const EDUCATION_LEVEL_OPTIONS = [
  { value: "high_school", label: "High School" },
  { value: "some_college", label: "Some College" },
  { value: "associates", label: "Associate's Degree" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "trade_school", label: "Trade/Vocational" },
  { value: "other", label: "Other" },
];

const CAREER_STAGE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "entry_level", label: "Entry Level" },
  { value: "mid_career", label: "Mid-Career" },
  { value: "senior", label: "Senior/Executive" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "freelance", label: "Freelance/Self-employed" },
  { value: "between_jobs", label: "Between Jobs" },
  { value: "retired", label: "Retired" },
];

const DISTANCE_PREFERENCE_OPTIONS = [
  { value: "within_10_miles", label: "Within 10 miles" },
  { value: "within_25_miles", label: "Within 25 miles" },
  { value: "within_50_miles", label: "Within 50 miles" },
  { value: "within_100_miles", label: "Within 100 miles" },
  { value: "same_city", label: "Same city" },
  { value: "same_state", label: "Same state/region" },
  { value: "same_country", label: "Same country" },
  { value: "anywhere", label: "Anywhere" },
];

const LONGEST_RELATIONSHIP_OPTIONS = [
  { value: "never", label: "Never been in one" },
  { value: "less_than_6_months", label: "Less than 6 months" },
  { value: "6_months_to_1_year", label: "6 months - 1 year" },
  { value: "1_to_2_years", label: "1-2 years" },
  { value: "2_to_5_years", label: "2-5 years" },
  { value: "5_to_10_years", label: "5-10 years" },
  { value: "more_than_10_years", label: "More than 10 years" },
];

const TIME_SINCE_LAST_OPTIONS = [
  { value: "currently_in", label: "Currently in a relationship" },
  { value: "less_than_3_months", label: "Less than 3 months" },
  { value: "3_to_6_months", label: "3-6 months" },
  { value: "6_months_to_1_year", label: "6 months - 1 year" },
  { value: "1_to_2_years", label: "1-2 years" },
  { value: "2_to_5_years", label: "2-5 years" },
  { value: "more_than_5_years", label: "More than 5 years" },
  { value: "never", label: "Never been in one" },
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

const DATING_MOTIVATION_OPTIONS = [
  { value: "find_partner", label: "Find a life partner" },
  { value: "explore", label: "Explore and have fun" },
  { value: "companionship", label: "Companionship" },
  { value: "casual", label: "Casual dating" },
  { value: "not_sure", label: "Not sure yet" },
];

const INTERESTED_IN_OPTIONS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "non_binary", label: "Non-binary people" },
  { value: "everyone", label: "Everyone" },
];

const INCOME_RANGE_OPTIONS = [
  { value: "no_preference", label: "Prefer not to say" },
  { value: "under_25k", label: "Under $25k" },
  { value: "25k_50k", label: "$25k - $50k" },
  { value: "50k_75k", label: "$50k - $75k" },
  { value: "75k_100k", label: "$75k - $100k" },
  { value: "100k_150k", label: "$100k - $150k" },
  { value: "150k_250k", label: "$150k - $250k" },
  { value: "250k_plus", label: "$250k+" },
];

const HEIGHT_PREFERENCE_OPTIONS = [
  { value: "no_preference", label: "No preference" },
  { value: "taller_than_me", label: "Taller than me" },
  { value: "shorter_than_me", label: "Shorter than me" },
  { value: "similar_height", label: "Similar height to me" },
];

const CHEMISTRY_OPTIONS = ["Humor", "Intelligence", "Confidence", "Kindness", "Ambition", "Creativity"];

const MENTAL_HEALTH_OPENNESS_OPTIONS = [
  { value: "very_open", label: "Very open to discussing" },
  { value: "somewhat_open", label: "Somewhat open" },
  { value: "private", label: "Prefer to keep private" },
  { value: "in_therapy", label: "Currently in therapy" },
];

const INTIMACY_COMFORT_OPTIONS = [
  { value: "exclusive", label: "Only in exclusive relationships" },
  { value: "emotional", label: "After emotional connection forms" },
  { value: "feels_right", label: "When it feels right" },
  { value: "casual_safe", label: "Casual is fine with safety" },
];

const POST_INTIMACY_OPTIONS = [
  { value: "closer", label: "I feel closer to my partner" },
  { value: "anxious", label: "I can feel anxious or insecure" },
  { value: "distant", label: "I sometimes need space" },
  { value: "normal", label: "It doesn't change much for me" },
];

const NEURODIVERGENT_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
  { value: "exploring", label: "Exploring/unsure" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const NEURODIVERGENCE_TYPE_OPTIONS = [
  "ADHD", "Autism/ASD", "Dyslexia", "Anxiety", "Depression", "OCD", "PTSD", "Bipolar", "Other"
];

// Additional options from full onboarding
const HEIGHT_OPTIONS = [
  { value: "under_5ft", label: "Under 5'0\"" },
  { value: "5ft_5ft3", label: "5'0\" - 5'3\"" },
  { value: "5ft4_5ft6", label: "5'4\" - 5'6\"" },
  { value: "5ft7_5ft9", label: "5'7\" - 5'9\"" },
  { value: "5ft10_6ft", label: "5'10\" - 6'0\"" },
  { value: "over_6ft", label: "Over 6'0\"" },
];

const BODY_TYPE_OPTIONS = [
  { value: "petite", label: "Petite" },
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "average", label: "Average" },
  { value: "curvy", label: "Curvy" },
  { value: "plus_size", label: "Plus size" },
];

const TRANSITION_STAGE_OPTIONS = [
  { value: "pre", label: "Pre-transition" },
  { value: "early", label: "Early transition (0-2 years)" },
  { value: "established", label: "Established (2+ years)" },
  { value: "not_medical", label: "Not medically transitioning" },
];

const HORMONE_PROFILE_OPTIONS = [
  { value: "estrogen", label: "Estrogen-dominant" },
  { value: "testosterone", label: "Testosterone-dominant" },
  { value: "mixed", label: "Mixed/changing" },
  { value: "no_hrt", label: "No HRT" },
];

const RELIGION_PRACTICE_LEVEL_OPTIONS = [
  { value: "not_practicing", label: "Not practicing" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" },
  { value: "devout", label: "Very devout" },
];

const KIDS_TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1_2_years", label: "1-2 years" },
  { value: "3_5_years", label: "3-5 years" },
  { value: "5_plus_years", label: "5+ years" },
  { value: "not_sure", label: "Not sure yet" },
];

const LIVING_SITUATION_OPTIONS = [
  { value: "alone", label: "Living alone" },
  { value: "roommates", label: "With roommates" },
  { value: "family", label: "With family" },
  { value: "partner", label: "With partner" },
];

const WORK_SCHEDULE_OPTIONS = [
  { value: "9_to_5", label: "9-5 / Traditional" },
  { value: "flexible", label: "Flexible hours" },
  { value: "shift_work", label: "Shift work" },
  { value: "remote", label: "Remote / WFH" },
  { value: "freelance", label: "Freelance / Variable" },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Lightly active" },
  { value: "moderate", label: "Moderately active" },
  { value: "very_active", label: "Very active" },
  { value: "athlete", label: "Athletic" },
];

const CONFLICT_STYLE_OPTIONS = [
  { value: "discuss_immediately", label: "Discuss immediately" },
  { value: "cool_off_first", label: "Cool off then talk" },
  { value: "avoid_conflict", label: "Tend to avoid conflict" },
  { value: "need_time", label: "Need time to process" },
];

const LOVE_LANGUAGE_OPTIONS = [
  "Words of Affirmation",
  "Quality Time", 
  "Physical Touch",
  "Acts of Service",
  "Receiving Gifts",
];

const DEALBREAKER_OPTIONS = [
  "Dishonesty/lying",
  "Infidelity/cheating",
  "Active addiction",
  "Anger issues",
  "Emotional unavailability",
  "Financial irresponsibility",
  "Disrespect",
  "Laziness/no ambition",
  "Poor hygiene",
  "Rudeness to service workers",
];

const SAFETY_PRIORITY_OPTIONS = [
  "Meet in public first",
  "Tell someone where I am",
  "Video call before meeting",
  "Share location with friend",
  "Take my own transportation",
  "Set time limits for first dates",
];

const PATTERN_RECOGNITION_OPTIONS = [
  "Attracted to unavailable people",
  "Rushing into relationships",
  "Ignoring red flags",
  "Fear of commitment",
  "Becoming too dependent",
  "Losing myself in relationships",
  "Choosing the wrong type",
  "Difficulty with vulnerability",
];

// Family & Upbringing options
const PARENT_STATUS_OPTIONS = [
  { value: "married_together", label: "Married Together" },
  { value: "unmarried_together", label: "Unmarried Together" },
  { value: "divorced", label: "Divorced" },
  { value: "separated", label: "Separated" },
  { value: "single_parent", label: "Single Parent" },
  { value: "adopted", label: "Adopted" },
  { value: "orphan_system", label: "Orphan/System" },
  { value: "other_guardians", label: "Other Guardians" },
];

const PARENT_PRESENCE_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "deceased", label: "Deceased" },
  { value: "unknown", label: "Unknown/N/A" },
];

const PARENTS_RELATIONSHIP_OPTIONS = [
  { value: "healthy_loving", label: "Healthy & Loving" },
  { value: "functional", label: "Functional" },
  { value: "high_conflict", label: "High Conflict" },
  { value: "divorced_amicable", label: "Divorced (Amicable)" },
  { value: "divorced_contentious", label: "Divorced (Contentious)" },
  { value: "single_parent", label: "Single Parent" },
  { value: "absent_parent", label: "Absent Parent(s)" },
  { value: "other_caregivers", label: "Other Caregivers" },
];

const FELT_LOVED_OPTIONS = [
  { value: "always", label: "Always felt loved" },
  { value: "mostly", label: "Mostly felt loved" },
  { value: "inconsistent", label: "Inconsistent" },
  { value: "rarely", label: "Rarely felt loved" },
  { value: "never", label: "Never felt loved" },
];

const SOCIOECONOMIC_OPTIONS = [
  { value: "poverty", label: "Poverty" },
  { value: "working_class", label: "Working Class" },
  { value: "middle_class", label: "Middle Class" },
  { value: "upper_middle", label: "Upper Middle Class" },
  { value: "wealthy", label: "Wealthy" },
  { value: "unstable", label: "Unstable/Variable" },
];

const FAMILY_STABILITY_OPTIONS = [
  { value: "very_stable", label: "Very Stable" },
  { value: "mostly_stable", label: "Mostly Stable" },
  { value: "unstable", label: "Unstable" },
  { value: "chaotic", label: "Chaotic" },
];

const PARENT_WOUND_OPTIONS = [
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

const GENERATIONAL_PATTERN_OPTIONS = [
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

// Height stats: ~14.5% of US men are 6ft+
const getHeightPoolImpact = () => ({ percent: 14.5, shrink: 85.5 });

// Income pool data
const getIncomePoolPercent = (incomeRange: string | undefined) => {
  switch (incomeRange) {
    case "250k_plus": return 1;
    case "150k_250k": return 6;
    case "100k_150k": return 15;
    case "75k_100k": return 30;
    default: return 100;
  }
};

// Combined probability
const getCombinedPool = (heightPercent: number, incomePercent: number) => {
  return (heightPercent / 100) * (incomePercent / 100) * 100;
};

interface ProfilePreferencesEditorProps {
  defaultSection?: string | null;
}

export const ProfilePreferencesEditor: React.FC<ProfilePreferencesEditorProps> = ({ defaultSection }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state organized by section
  const [formData, setFormData] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof Profile>(field: K, value: Profile[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("user_id", user!.id);

      if (error) throw error;
      toast.success("Preferences saved!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const SECTION_ORDER = ["identity", "motivation", "relationship", "partner_prefs", "kids", "faith", "politics", "career", "income", "lifestyle", "physical", "communication", "mental_health", "neurodivergence", "attachment", "family", "boundaries", "intimacy", "devi", "cycle"];
  
  const SECTION_CONFIG: Record<string, { 
    label: string; 
    icon: React.ReactNode; 
    requiredFields: (keyof Profile)[];
  }> = {
    identity: { label: "Basic Identity", icon: <User className="w-3.5 h-3.5" />, requiredFields: ["name", "gender_identity", "birth_date"] },
    motivation: { label: "Dating Motivation", icon: <Target className="w-3.5 h-3.5" />, requiredFields: ["dating_motivation"] },
    relationship: { label: "Relationship Goals", icon: <Heart className="w-3.5 h-3.5" />, requiredFields: ["relationship_goal", "relationship_structure"] },
    partner_prefs: { label: "Partner Preferences", icon: <Users className="w-3.5 h-3.5" />, requiredFields: ["interested_in", "height_preference"] },
    kids: { label: "Kids & Family", icon: <Baby className="w-3.5 h-3.5" />, requiredFields: ["kids_status", "kids_desire"] },
    faith: { label: "Faith & Values", icon: <Church className="w-3.5 h-3.5" />, requiredFields: ["religion"] },
    politics: { label: "Politics", icon: <Vote className="w-3.5 h-3.5" />, requiredFields: ["politics"] },
    career: { label: "Career", icon: <Briefcase className="w-3.5 h-3.5" />, requiredFields: ["education_level", "career_stage"] },
    income: { label: "Income", icon: <DollarSign className="w-3.5 h-3.5" />, requiredFields: ["income_range"] },
    lifestyle: { label: "Lifestyle", icon: <MapPin className="w-3.5 h-3.5" />, requiredFields: ["country", "social_style"] },
    physical: { label: "Physical", icon: <Sparkles className="w-3.5 h-3.5" />, requiredFields: ["preferred_age_min", "preferred_age_max"] },
    communication: { label: "Communication", icon: <MessageCircle className="w-3.5 h-3.5" />, requiredFields: ["communication_style"] },
    mental_health: { label: "Mental Health", icon: <Stethoscope className="w-3.5 h-3.5" />, requiredFields: ["mental_health_openness"] },
    neurodivergence: { label: "Neurodivergence", icon: <Brain className="w-3.5 h-3.5" />, requiredFields: [] },
    attachment: { label: "Attachment & Patterns", icon: <Brain className="w-3.5 h-3.5" />, requiredFields: ["attachment_style"] },
    family: { label: "Family & Upbringing", icon: <Home className="w-3.5 h-3.5" />, requiredFields: [] },
    boundaries: { label: "Boundaries & Dealbreakers", icon: <Shield className="w-3.5 h-3.5" />, requiredFields: ["boundary_strength"] },
    intimacy: { label: "Intimacy & Safety", icon: <Lock className="w-3.5 h-3.5" />, requiredFields: [] },
    devi: { label: "D.E.V.I. Settings", icon: <Sparkles className="w-3.5 h-3.5" />, requiredFields: [] },
    cycle: { label: "Hormone Cycle", icon: <Lock className="w-3.5 h-3.5" />, requiredFields: [] },
  };

  const isSectionComplete = useCallback((sectionKey: string): boolean => {
    const config = SECTION_CONFIG[sectionKey];
    if (!config || config.requiredFields.length === 0) return true;
    
    return config.requiredFields.every(field => {
      const value = formData[field];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== "";
    });
  }, [formData]);

  const completedSections = SECTION_ORDER.filter(s => isSectionComplete(s));
  const incompleteSections = SECTION_ORDER.filter(s => !isSectionComplete(s));
  const completionPercent = Math.round((completedSections.length / SECTION_ORDER.length) * 100);
  
  const [openSections, setOpenSections] = useState<string[]>(
    defaultSection ? [defaultSection] : incompleteSections.length > 0 ? [incompleteSections[0]] : ["relationship"]
  );

  const goToNextSection = useCallback((currentSection: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentIndex = SECTION_ORDER.indexOf(currentSection);
    if (currentIndex < SECTION_ORDER.length - 1) {
      const nextSection = SECTION_ORDER[currentIndex + 1];
      setOpenSections(prev => {
        const withoutCurrent = prev.filter(s => s !== currentSection);
        return [...withoutCurrent, nextSection];
      });
      // Scroll to next section after a small delay
      setTimeout(() => {
        document.querySelector(`[data-value="${nextSection}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  const jumpToSection = (sectionKey: string) => {
    setOpenSections([sectionKey]);
    setTimeout(() => {
      document.querySelector(`[data-value="${sectionKey}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Completeness Indicator */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {completionPercent === 100 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <span className="font-semibold text-sm">
                {completionPercent === 100 ? "Profile Complete!" : "Profile Completeness"}
              </span>
            </div>
            <span className="text-sm font-bold text-primary">{completionPercent}%</span>
          </div>
          
          <Progress value={completionPercent} className="h-2" />
          
          <div className="text-xs text-muted-foreground">
            {completedSections.length} of {SECTION_ORDER.length} sections completed
          </div>
          
          {incompleteSections.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Incomplete sections:</p>
              <div className="flex flex-wrap gap-1.5">
                {incompleteSections.map(sectionKey => {
                  const config = SECTION_CONFIG[sectionKey];
                  return (
                    <button
                      key={sectionKey}
                      onClick={() => jumpToSection(sectionKey)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-500/10 text-amber-700 rounded-full hover:bg-amber-500/20 transition-colors"
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-2">

        {/* Basic Identity */}
        <AccordionItem value="identity" data-value="identity" className={`border rounded-lg px-4 ${isSectionComplete("identity") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <User className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Basic Identity</span>
              {isSectionComplete("identity") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.birth_date || ""}
                onChange={(e) => updateField("birth_date", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Gender Identity</Label>
                <Select
                  value={formData.gender_identity || ""}
                  onValueChange={(v) => updateField("gender_identity", v as Enums<"gender_identity">)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pronouns</Label>
                <Select
                  value={formData.pronouns || ""}
                  onValueChange={(v) => updateField("pronouns", v as Enums<"pronouns">)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PRONOUN_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.pronouns === "other" && (
              <div className="space-y-2">
                <Label>Custom Pronouns</Label>
                <Input
                  value={formData.custom_pronouns || ""}
                  onChange={(e) => updateField("custom_pronouns", e.target.value)}
                  placeholder="Enter your pronouns"
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Height</Label>
                <Select
                  value={formData.height || ""}
                  onValueChange={(v) => updateField("height", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {HEIGHT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Body Type</Label>
                <Select
                  value={formData.body_type || ""}
                  onValueChange={(v) => updateField("body_type", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {BODY_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Sexual Orientation</Label>
                <Select
                  value={formData.sexual_orientation || ""}
                  onValueChange={(v) => updateField("sexual_orientation", v as Enums<"sexual_orientation">)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {ORIENTATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.sexual_orientation === "self_describe" && (
                <div className="space-y-2">
                  <Label>Describe</Label>
                  <Input
                    value={formData.orientation_custom || ""}
                    onChange={(e) => updateField("orientation_custom", e.target.value)}
                    placeholder="Describe your orientation"
                  />
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("identity", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Dating Motivation */}
        <AccordionItem value="motivation" data-value="motivation" className={`border rounded-lg px-4 ${isSectionComplete("motivation") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Target className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">Dating Motivation</span>
              {isSectionComplete("motivation") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>What brings you to dating right now?</Label>
              <div className="grid grid-cols-1 gap-2">
                {DATING_MOTIVATION_OPTIONS.map((opt) => (
                  <MultiSelectOption
                    key={opt.value}
                    selected={(formData.dating_motivation as string[] || []).includes(opt.value)}
                    onClick={() => {
                      const current = (formData.dating_motivation as string[] || []);
                      const updated = current.includes(opt.value)
                        ? current.filter(v => v !== opt.value)
                        : [...current, opt.value];
                      updateField("dating_motivation", updated);
                    }}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("motivation", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Relationship Goals */}
        <AccordionItem value="relationship" data-value="relationship" className={`border rounded-lg px-4 ${isSectionComplete("relationship") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Relationship Goals</span>
              {isSectionComplete("relationship") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Current Relationship Status</Label>
              <Select
                value={(formData as any).relationship_status || ""}
                onValueChange={(v) => updateField("relationship_status" as any, v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Looking For</Label>
                <Select
                  value={formData.relationship_goal || ""}
                  onValueChange={(v) => updateField("relationship_goal", v as Enums<"relationship_goal">)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_GOAL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Relationship Structure</Label>
                <Select
                  value={formData.relationship_structure || ""}
                  onValueChange={(v) => updateField("relationship_structure", v as Enums<"relationship_structure">)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_STRUCTURE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Monogamy required?</Label>
              <Switch
                checked={formData.monogamy_required || false}
                onCheckedChange={(v) => updateField("monogamy_required", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Exclusivity before intimacy?</Label>
              <Switch
                checked={formData.exclusivity_before_intimacy || false}
                onCheckedChange={(v) => updateField("exclusivity_before_intimacy", v)}
              />
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("relationship", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Partner Preferences */}
        <AccordionItem value="partner_prefs" data-value="partner_prefs" className={`border rounded-lg px-4 ${isSectionComplete("partner_prefs") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Users className="w-4 h-4 text-rose-500" />
              <span className="font-medium">Who I'm Looking For</span>
              {isSectionComplete("partner_prefs") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Interested in</Label>
              <div className="grid grid-cols-2 gap-2">
                {INTERESTED_IN_OPTIONS.map((opt) => (
                  <MultiSelectOption
                    key={opt.value}
                    selected={(formData.interested_in as string[] || []).includes(opt.value)}
                    onClick={() => {
                      const current = (formData.interested_in as string[] || []);
                      const updated = current.includes(opt.value)
                        ? current.filter(v => v !== opt.value)
                        : [...current, opt.value];
                      updateField("interested_in", updated);
                    }}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Height Preference</Label>
              <Select
                value={formData.height_preference || ""}
                onValueChange={(v) => updateField("height_preference", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {HEIGHT_PREFERENCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Height Pool Impact Visual */}
              {formData.height_preference === "taller_than_me" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-fade-in space-y-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Dating Pool Impact</span>
                  </div>
                  <div className="relative h-8 bg-muted/50 rounded-full overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-1.5 h-4 rounded-full transition-all duration-500 ${
                              i < Math.ceil(20 * (14.5 / 100)) 
                                ? 'bg-primary' 
                                : 'bg-muted-foreground/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      <span className="font-bold text-foreground">14.5%</span> of men are 6ft+
                    </span>
                    <span className="text-amber-600 font-medium">Top 15%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    This filters out 85% of potential matches.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>What creates chemistry for you?</Label>
              <div className="grid grid-cols-2 gap-2">
                {CHEMISTRY_OPTIONS.map((opt) => (
                  <MultiSelectOption
                    key={opt}
                    selected={((formData.chemistry_factors as string[] | null) || []).includes(opt)}
                    onClick={() => {
                      const current = ((formData.chemistry_factors as string[] | null) || []);
                      const updated = current.includes(opt)
                        ? current.filter(v => v !== opt)
                        : [...current, opt];
                      updateField("chemistry_factors", updated);
                    }}
                    label={opt}
                  />
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("partner_prefs", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Kids & Family */}
        <AccordionItem value="kids" data-value="kids" className={`border rounded-lg px-4 ${isSectionComplete("kids") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Baby className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Kids & Family</span>
              {isSectionComplete("kids") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <Select
                  value={formData.kids_status || ""}
                  onValueChange={(v) => updateField("kids_status", v as Enums<"kids_status">)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {KIDS_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Want Kids?</Label>
                <Select
                  value={formData.kids_desire || ""}
                  onValueChange={(v) => updateField("kids_desire", v as Enums<"kids_desire">)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {KIDS_DESIRE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(formData.kids_desire === "definitely_yes" || formData.kids_desire === "maybe") && (
              <div className="space-y-2">
                <Label>Kids Timeline</Label>
                <Select
                  value={formData.kids_timeline || ""}
                  onValueChange={(v) => updateField("kids_timeline", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {KIDS_TIMELINE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Marriage before kids?</Label>
              <Switch
                checked={formData.marriage_before_kids || false}
                onCheckedChange={(v) => updateField("marriage_before_kids", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Open to single parenthood?</Label>
              <Switch
                checked={formData.open_to_single_parenthood || false}
                onCheckedChange={(v) => updateField("open_to_single_parenthood", v)}
              />
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("kids", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Faith & Values */}
        <AccordionItem value="faith" data-value="faith" className={`border rounded-lg px-4 ${isSectionComplete("faith") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Church className="w-4 h-4 text-amber-500" />
              <span className="font-medium">Faith & Values</span>
              {isSectionComplete("faith") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Religion</Label>
              <Select
                value={formData.religion || ""}
                onValueChange={(v) => updateField("religion", v as Enums<"religion">)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {RELIGION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Practice Level</Label>
              <Select
                value={formData.religion_practice_level || ""}
                onValueChange={(v) => updateField("religion_practice_level", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {RELIGION_PRACTICE_LEVEL_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SliderInput
              label="Faith Importance"
              value={formData.faith_importance || 3}
              onChange={(v) => updateField("faith_importance", v)}
              leftLabel="Not important"
              rightLabel="Very important"
            />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("faith", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Politics */}
        <AccordionItem value="politics" data-value="politics" className={`border rounded-lg px-4 ${isSectionComplete("politics") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Vote className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Politics</span>
              {isSectionComplete("politics") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Political Views</Label>
              <Select
                value={formData.politics || ""}
                onValueChange={(v) => updateField("politics", v as Enums<"politics">)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {POLITICS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SliderInput
              label="Politics Importance"
              value={formData.politics_importance || 3}
              onChange={(v) => updateField("politics_importance", v)}
              leftLabel="Not important"
              rightLabel="Very important"
            />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("politics", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Career */}
        <AccordionItem value="career" data-value="career" className={`border rounded-lg px-4 ${isSectionComplete("career") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Briefcase className="w-4 h-4 text-green-500" />
              <span className="font-medium">Career & Education</span>
              {isSectionComplete("career") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Education Level</Label>
                <Select
                  value={formData.education_level || ""}
                  onValueChange={(v) => updateField("education_level", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVEL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Career Stage</Label>
                <Select
                  value={formData.career_stage || ""}
                  onValueChange={(v) => updateField("career_stage", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CAREER_STAGE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SliderInput
              label="Ambition Level"
              value={formData.ambition_level || 3}
              onChange={(v) => updateField("ambition_level", v)}
              leftLabel="Relaxed"
              rightLabel="Highly driven"
            />
            <SliderInput
              label="Financial Importance"
              value={formData.financial_importance || 3}
              onChange={(v) => updateField("financial_importance", v)}
              leftLabel="Not important"
              rightLabel="Very important"
            />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("career", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Income Preferences */}
        <AccordionItem value="income" data-value="income" className={`border rounded-lg px-4 ${isSectionComplete("income") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">Income Preferences</span>
              {isSectionComplete("income") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Your Income Range</Label>
              <Select
                value={formData.income_range || ""}
                onValueChange={(v) => updateField("income_range", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {INCOME_RANGE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred Partner Income</Label>
              <Select
                value={formData.preferred_income_range || ""}
                onValueChange={(v) => updateField("preferred_income_range", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {INCOME_RANGE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Income Pool Impact Visual */}
              {formData.preferred_income_range && !["no_preference", "under_25k", "25k_50k", "50k_75k"].includes(formData.preferred_income_range) && (() => {
                const incomePercent = getIncomePoolPercent(formData.preferred_income_range);
                const heightImpact = formData.height_preference === "taller_than_me" ? getHeightPoolImpact() : null;
                const combinedPool = heightImpact ? getCombinedPool(heightImpact.percent, incomePercent) : null;
                
                return (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-fade-in space-y-3 mt-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700">Dating Pool Impact</span>
                    </div>
                    <div className="relative h-8 bg-muted/50 rounded-full overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 20 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-1.5 h-4 rounded-full transition-all duration-500 ${
                                i < Math.ceil(20 * (incomePercent / 100)) 
                                  ? 'bg-primary' 
                                  : 'bg-muted-foreground/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        <span className="font-bold text-foreground">{incomePercent}%</span> of men earn this
                      </span>
                      <span className="text-amber-600 font-medium">Top {incomePercent}%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      This filters out {100 - incomePercent}% of potential matches.
                    </p>
                    
                    {/* Combined impact with height */}
                    {combinedPool !== null && (
                      <div className="mt-2 pt-2 border-t border-amber-500/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-red-600">Combined with Height Preference</span>
                        </div>
                        <div className="relative h-6 bg-muted/50 rounded-full overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 20 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`w-1 h-3 rounded-full transition-all duration-500 ${
                                    i < Math.max(1, Math.ceil(20 * (combinedPool / 100))) 
                                      ? 'bg-red-500' 
                                      : 'bg-muted-foreground/20'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-red-600 font-medium">
                          Only {combinedPool.toFixed(1)}% of men are both 6ft+ AND earn {formData.preferred_income_range?.replace(/_/g, "-").replace("plus", "+")}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("income", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Lifestyle */}
        <AccordionItem value="lifestyle" data-value="lifestyle" className={`border rounded-lg px-4 ${isSectionComplete("lifestyle") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Lifestyle</span>
              {isSectionComplete("lifestyle") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={formData.country || ""}
                  onValueChange={(v) => updateField("country", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Enter your city"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Social Style</Label>
                <Select
                  value={formData.social_style || ""}
                  onValueChange={(v) => updateField("social_style", v as Enums<"social_style">)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {SOCIAL_STYLE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Distance Preference</Label>
                <Select
                  value={formData.distance_preference || ""}
                  onValueChange={(v) => updateField("distance_preference", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {DISTANCE_PREFERENCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>State/Province</Label>
                <Input
                  value={formData.state || ""}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="Enter your state"
                />
              </div>
              <div className="space-y-2">
                <Label>Living Situation</Label>
                <Select
                  value={formData.living_situation || ""}
                  onValueChange={(v) => updateField("living_situation", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {LIVING_SITUATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Work Schedule</Label>
                <Select
                  value={formData.work_schedule_type || ""}
                  onValueChange={(v) => updateField("work_schedule_type", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {WORK_SCHEDULE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select
                  value={formData.activity_level || ""}
                  onValueChange={(v) => updateField("activity_level", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_LEVEL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Open to moving?</Label>
              <Switch
                checked={formData.open_to_moving || false}
                onCheckedChange={(v) => updateField("open_to_moving", v)}
              />
            </div>
            <SliderInput
              label="Schedule Flexibility"
              value={formData.flexibility_rating || 3}
              onChange={(v) => updateField("flexibility_rating", v)}
              leftLabel="Rigid"
              rightLabel="Very flexible"
            />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("lifestyle", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Physical Preferences */}
        <AccordionItem value="physical" data-value="physical" className={`border rounded-lg px-4 ${isSectionComplete("physical") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Physical Preferences</span>
              {isSectionComplete("physical") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Preferred Age Range</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Min (18+)"
                    value={formData.preferred_age_min ?? ''}
                    onChange={(e) => {
                      const rawVal = e.target.value.replace(/\D/g, '');
                      if (rawVal === '') {
                        updateField("preferred_age_min", null);
                      } else {
                        const num = parseInt(rawVal, 10);
                        if (num <= 100) {
                          updateField("preferred_age_min", num);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = formData.preferred_age_min;
                      if (val !== null && val !== undefined) {
                        if (val < 18) updateField("preferred_age_min", 18);
                        else if (val > 100) updateField("preferred_age_min", 100);
                      }
                    }}
                    className="text-center"
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Max"
                    value={formData.preferred_age_max ?? ''}
                    onChange={(e) => {
                      const rawVal = e.target.value.replace(/\D/g, '');
                      if (rawVal === '') {
                        updateField("preferred_age_max", null);
                      } else {
                        const num = parseInt(rawVal, 10);
                        if (num <= 100) {
                          updateField("preferred_age_max", num);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = formData.preferred_age_max;
                      if (val !== null && val !== undefined) {
                        if (val < 18) updateField("preferred_age_max", 18);
                        else if (val > 100) updateField("preferred_age_max", 100);
                      }
                    }}
                    className="text-center"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Leave blank for no preference</p>
            </div>
            <SliderInput
              label="Physical Attraction Importance"
              value={formData.attraction_importance || 3}
              onChange={(v) => updateField("attraction_importance", v)}
              leftLabel="Not important"
              rightLabel="Very important"
            />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("physical", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Communication */}
        <AccordionItem value="communication" data-value="communication" className={`border rounded-lg px-4 ${isSectionComplete("communication") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <MessageCircle className="w-4 h-4 text-cyan-500" />
              <span className="font-medium">Communication Style</span>
              {isSectionComplete("communication") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Communication Style</Label>
              <Select
                value={formData.communication_style || ""}
                onValueChange={(v) => updateField("communication_style", v as Enums<"communication_style">)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {COMMUNICATION_STYLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conflict Style</Label>
              <Select
                value={formData.conflict_style || ""}
                onValueChange={(v) => updateField("conflict_style", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {CONFLICT_STYLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SliderInput
              label="Response Time Preference"
              value={formData.response_time_preference || 5}
              onChange={(v) => updateField("response_time_preference", v)}
              leftLabel="Quick replies"
              rightLabel="Take your time"
            />
            <div className="space-y-2">
              <Label>Love Languages</Label>
              <div className="flex flex-wrap gap-2">
                {LOVE_LANGUAGE_OPTIONS.map(lang => {
                  const currentLangs = (formData.love_languages as string[] | null) || [];
                  const isSelected = currentLangs.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? currentLangs.filter(l => l !== lang)
                          : [...currentLangs, lang];
                        updateField("love_languages", updated as any);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("communication", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Mental Health */}
        <AccordionItem value="mental_health" data-value="mental_health" className={`border rounded-lg px-4 ${isSectionComplete("mental_health") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Stethoscope className="w-4 h-4 text-teal-500" />
              <span className="font-medium">Mental Health</span>
              {isSectionComplete("mental_health") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Openness to discussing mental health</Label>
              <Select
                value={formData.mental_health_openness || ""}
                onValueChange={(v) => updateField("mental_health_openness", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {MENTAL_HEALTH_OPENNESS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Currently in therapy?</Label>
              <Switch
                checked={formData.in_therapy || false}
                onCheckedChange={(v) => updateField("in_therapy", v)}
              />
            </div>
            <SliderInput
              label="How important is partner's mental health awareness?"
              value={formData.mental_health_importance || 3}
              onChange={(v) => updateField("mental_health_importance", v)}
              leftLabel="Not important"
              rightLabel="Very important"
            />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("mental_health", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Neurodivergence */}
        <AccordionItem value="neurodivergence" data-value="neurodivergence" className={`border rounded-lg px-4 ${isSectionComplete("neurodivergence") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Brain className="w-4 h-4 text-violet-500" />
              <span className="font-medium">Neurodivergence</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Are you neurodivergent?</Label>
              <Select
                value={formData.is_neurodivergent || ""}
                onValueChange={(v) => updateField("is_neurodivergent", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {NEURODIVERGENT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formData.is_neurodivergent === "yes" || formData.is_neurodivergent === "exploring") && (
              <div className="space-y-2">
                <Label>Types (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {NEURODIVERGENCE_TYPE_OPTIONS.map(type => {
                    const currentTypes = (formData.neurodivergence_types as string[] | null) || [];
                    const isSelected = currentTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? currentTypes.filter(t => t !== type)
                            : [...currentTypes, type];
                          updateField("neurodivergence_types", updated as any);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("neurodivergence", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Attachment & Patterns */}
        <AccordionItem value="attachment" data-value="attachment" className={`border rounded-lg px-4 ${isSectionComplete("attachment") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Brain className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">Attachment & Patterns</span>
              {isSectionComplete("attachment") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Attachment Style</Label>
              <Select
                value={formData.attachment_style || ""}
                onValueChange={(v) => updateField("attachment_style", v as Enums<"attachment_style">)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {ATTACHMENT_STYLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Longest Relationship</Label>
                <Select
                  value={formData.longest_relationship || ""}
                  onValueChange={(v) => updateField("longest_relationship", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {LONGEST_RELATIONSHIP_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Since Last</Label>
                <Select
                  value={formData.time_since_last_relationship || ""}
                  onValueChange={(v) => updateField("time_since_last_relationship", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {TIME_SINCE_LAST_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dating Patterns You've Noticed</Label>
              <div className="flex flex-wrap gap-2">
                {PATTERN_RECOGNITION_OPTIONS.map(pattern => {
                  const currentPatterns = (formData.pattern_recognition as string[] | null) || [];
                  const isSelected = currentPatterns.includes(pattern);
                  return (
                    <button
                      key={pattern}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? currentPatterns.filter(p => p !== pattern)
                          : [...currentPatterns, pattern];
                        updateField("pattern_recognition", updated as any);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {pattern}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("attachment", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Family & Upbringing */}
        <AccordionItem value="family" data-value="family" className={`border rounded-lg px-4 ${isSectionComplete("family") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Home className="w-4 h-4 text-amber-500" />
              <span className="font-medium">Family & Upbringing</span>
              {isSectionComplete("family") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-primary inline mr-1" />
              This helps D.E.V.I. understand how your childhood experiences may influence your relationship patterns. Skip anything too personal.
            </div>
            
            <div className="space-y-2">
              <Label>Parent/Guardian Situation</Label>
              <Select
                value={(formData as any).parent_status || ""}
                onValueChange={(v) => updateField("parent_status" as any, v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {PARENT_STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mother/Female Caregiver</Label>
                <Select
                  value={(formData as any).mother_status || ""}
                  onValueChange={(v) => updateField("mother_status" as any, v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PARENT_PRESENCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Father/Male Caregiver</Label>
                <Select
                  value={(formData as any).father_status || ""}
                  onValueChange={(v) => updateField("father_status" as any, v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PARENT_PRESENCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Full Siblings</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={(formData as any).full_siblings ?? ""}
                  onChange={(e) => updateField("full_siblings" as any, e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Half Siblings</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={(formData as any).half_siblings ?? ""}
                  onChange={(e) => updateField("half_siblings" as any, e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Parents'/Caregivers' Relationship</Label>
              <Select
                value={(formData as any).parents_relationship_dynamic || ""}
                onValueChange={(v) => updateField("parents_relationship_dynamic" as any, v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {PARENTS_RELATIONSHIP_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Did you feel loved growing up?</Label>
              <Select
                value={(formData as any).felt_loved_as_child || ""}
                onValueChange={(v) => updateField("felt_loved_as_child" as any, v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {FELT_LOVED_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Healthy relationship role models?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={(formData as any).healthy_relationship_models === true ? "default" : "outline"}
                  onClick={() => updateField("healthy_relationship_models" as any, true)}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={(formData as any).healthy_relationship_models === false ? "default" : "outline"}
                  onClick={() => updateField("healthy_relationship_models" as any, false)}
                >
                  No
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Socioeconomic Background</Label>
                <Select
                  value={(formData as any).socioeconomic_background || ""}
                  onValueChange={(v) => updateField("socioeconomic_background" as any, v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {SOCIOECONOMIC_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Family Stability</Label>
                <Select
                  value={(formData as any).family_stability || ""}
                  onValueChange={(v) => updateField("family_stability" as any, v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {FAMILY_STABILITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Parent Wounds (select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {PARENT_WOUND_OPTIONS.map(wound => {
                  const currentWounds = ((formData as any).parent_wound_types as string[] | null) || [];
                  const isSelected = currentWounds.includes(wound);
                  return (
                    <button
                      key={wound}
                      type="button"
                      onClick={() => {
                        let updated: string[];
                        if (wound === "None of these apply") {
                          updated = isSelected ? [] : [wound];
                        } else {
                          const filtered = currentWounds.filter(w => w !== "None of these apply");
                          updated = isSelected
                            ? filtered.filter(w => w !== wound)
                            : [...filtered, wound];
                        }
                        updateField("parent_wound_types" as any, updated);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isSelected 
                          ? "bg-amber-500 text-white border-amber-500" 
                          : "bg-muted/50 text-muted-foreground border-border hover:border-amber-500/50"
                      }`}
                    >
                      {wound}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Generational Patterns in Family (select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {GENERATIONAL_PATTERN_OPTIONS.map(pattern => {
                  const currentPatterns = ((formData as any).generational_patterns as string[] | null) || [];
                  const isSelected = currentPatterns.includes(pattern);
                  return (
                    <button
                      key={pattern}
                      type="button"
                      onClick={() => {
                        let updated: string[];
                        if (pattern === "None I'm aware of") {
                          updated = isSelected ? [] : [pattern];
                        } else {
                          const filtered = currentPatterns.filter(p => p !== "None I'm aware of");
                          updated = isSelected
                            ? filtered.filter(p => p !== pattern)
                            : [...filtered, pattern];
                        }
                        updateField("generational_patterns" as any, updated);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {pattern}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Free-form notes about family experience */}
            <div className="space-y-2">
              <Label>Anything else about your family or upbringing? (optional)</Label>
              <Textarea
                value={(formData as any).family_upbringing_notes || ""}
                onChange={(e) => updateField("family_upbringing_notes" as any, e.target.value)}
                placeholder="Share any context about your childhood, family dynamics, or experiences that shape how you approach relationships today..."
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This helps D.E.V.I. understand your unique story and provide more personalized guidance.
              </p>
            </div>
            
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("family", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Boundaries */}
        <AccordionItem value="boundaries" data-value="boundaries" className={`border rounded-lg px-4 ${isSectionComplete("boundaries") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="font-medium">Boundaries & Safety</span>
              {isSectionComplete("boundaries") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Absolute Dealbreakers</Label>
              <div className="flex flex-wrap gap-2">
                {DEALBREAKER_OPTIONS.map(db => {
                  const currentDealbreakers = (formData.dealbreakers as string[] | null) || [];
                  const isSelected = currentDealbreakers.includes(db);
                  return (
                    <button
                      key={db}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? currentDealbreakers.filter(d => d !== db)
                          : [...currentDealbreakers, db];
                        updateField("dealbreakers", updated as any);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isSelected 
                          ? "bg-red-500 text-white border-red-500" 
                          : "bg-muted/50 text-muted-foreground border-border hover:border-red-500/50"
                      }`}
                    >
                      {db}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Safety Priorities</Label>
              <div className="flex flex-wrap gap-2">
                {SAFETY_PRIORITY_OPTIONS.map(sp => {
                  const currentPriorities = (formData.safety_priorities as string[] | null) || [];
                  const isSelected = currentPriorities.includes(sp);
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? currentPriorities.filter(p => p !== sp)
                          : [...currentPriorities, sp];
                        updateField("safety_priorities", updated as any);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {sp}
                    </button>
                  );
                })}
              </div>
            </div>
            <SliderInput
              label="Boundary Strength"
              value={formData.boundary_strength || 3}
              onChange={(v) => updateField("boundary_strength", v)}
              leftLabel="Flexible"
              rightLabel="Firm"
            />
            <SliderInput
              label="Red Flag Sensitivity"
              value={formData.red_flag_sensitivity || 5}
              onChange={(v) => updateField("red_flag_sensitivity", v)}
              leftLabel="Relaxed"
              rightLabel="Highly alert"
            />
            <SliderInput
              label="Love Bombing Sensitivity"
              value={formData.love_bombing_sensitivity || 5}
              onChange={(v) => updateField("love_bombing_sensitivity", v)}
              leftLabel="Not concerned"
              rightLabel="Very cautious"
            />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("boundaries", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Intimacy & Safety */}
        <AccordionItem value="intimacy" data-value="intimacy" className={`border rounded-lg px-4 ${isSectionComplete("intimacy") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Lock className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Intimacy & Safety</span>
              {isSectionComplete("intimacy") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>I'm comfortable with intimacy:</Label>
              <Select
                value={formData.intimacy_comfort || ""}
                onValueChange={(v) => updateField("intimacy_comfort", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {INTIMACY_COMFORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Require exclusivity before intimacy?</Label>
              <Switch
                checked={formData.exclusivity_before_intimacy || false}
                onCheckedChange={(v) => updateField("exclusivity_before_intimacy", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>After intimacy, I typically feel:</Label>
              <Select
                value={formData.post_intimacy_tendency || ""}
                onValueChange={(v) => updateField("post_intimacy_tendency", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {POST_INTIMACY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("intimacy", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* D.E.V.I. Settings */}
        <AccordionItem value="devi" data-value="devi" className={`border rounded-lg px-4 ${isSectionComplete("devi") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium">D.E.V.I. Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {user && <DeviSettings userId={user.id} />}
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("devi", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Cycle Tracking */}
        <AccordionItem value="cycle" data-value="cycle" className={`border rounded-lg px-4 ${isSectionComplete("cycle") ? "border-green-500/30 bg-green-500/5" : ""}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Lock className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Hormone Cycle</span>
              {isSectionComplete("cycle") && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <Label>Track my cycle</Label>
              <Switch
                checked={formData.track_cycle || false}
                onCheckedChange={(v) => updateField("track_cycle", v)}
              />
            </div>
            {formData.track_cycle && (
              <>
                <div className="space-y-2">
                  <Label>Last Period Start</Label>
                  <Input
                    type="date"
                    value={formData.last_period_date || ""}
                    onChange={(e) => updateField("last_period_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cycle Length (days)</Label>
                  <Input
                    type="number"
                    value={formData.cycle_length || 28}
                    onChange={(e) => updateField("cycle_length", parseInt(e.target.value) || 28)}
                    min={21}
                    max={40}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cycle Regularity</Label>
                  <Select
                    value={formData.cycle_regularity || ""}
                    onValueChange={(v) => updateField("cycle_regularity", v as Enums<"cycle_regularity">)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {CYCLE_REGULARITY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save All Preferences"}
      </Button>
    </div>
  );
};
