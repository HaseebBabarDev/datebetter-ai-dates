import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Target, Stethoscope, Ruler, TrendingDown, DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { MultiSelectOption } from "@/components/onboarding/MultiSelectOption";

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

  const SECTION_ORDER = ["motivation", "relationship", "partner_prefs", "kids", "faith", "politics", "career", "income", "lifestyle", "physical", "communication", "mental_health", "attachment", "boundaries", "cycle"];
  
  const [openSections, setOpenSections] = useState<string[]>(defaultSection ? [defaultSection] : ["relationship"]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-2">

        {/* Dating Motivation */}
        <AccordionItem value="motivation" data-value="motivation" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">Dating Motivation</span>
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
        <AccordionItem value="relationship" data-value="relationship" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Relationship Goals</span>
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
        <AccordionItem value="partner_prefs" data-value="partner_prefs" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-500" />
              <span className="font-medium">Who I'm Looking For</span>
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
        <AccordionItem value="kids" data-value="kids" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Baby className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Kids & Family</span>
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
            <div className="flex items-center justify-between">
              <Label>Marriage before kids?</Label>
              <Switch
                checked={formData.marriage_before_kids || false}
                onCheckedChange={(v) => updateField("marriage_before_kids", v)}
              />
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("kids", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Faith & Values */}
        <AccordionItem value="faith" data-value="faith" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Church className="w-4 h-4 text-amber-500" />
              <span className="font-medium">Faith & Values</span>
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
        <AccordionItem value="politics" data-value="politics" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Politics</span>
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
        <AccordionItem value="career" data-value="career" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-500" />
              <span className="font-medium">Career & Education</span>
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
        <AccordionItem value="income" data-value="income" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">Income Preferences</span>
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
        <AccordionItem value="lifestyle" data-value="lifestyle" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Lifestyle</span>
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
        <AccordionItem value="physical" data-value="physical" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Physical Preferences</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Preferred Age Range</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.preferred_age_min || 18} - {formData.preferred_age_max || 65}
                </span>
              </div>
              <div className="px-1">
                <Slider
                  value={[formData.preferred_age_min || 18, formData.preferred_age_max || 65]}
                  min={18}
                  max={99}
                  step={1}
                  onValueChange={(values) => {
                    updateField("preferred_age_min", Math.max(18, values[0]));
                    updateField("preferred_age_max", Math.max(18, values[1]));
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>18</span>
                <span>99</span>
              </div>
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
        <AccordionItem value="communication" data-value="communication" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-cyan-500" />
              <span className="font-medium">Communication Style</span>
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
            <SliderInput
              label="Response Time Preference"
              value={formData.response_time_preference || 5}
              onChange={(v) => updateField("response_time_preference", v)}
              leftLabel="Quick replies"
              rightLabel="Take your time"
            />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("communication", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Mental Health */}
        <AccordionItem value="mental_health" data-value="mental_health" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-500" />
              <span className="font-medium">Mental Health</span>
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

        {/* Attachment & Patterns */}
        <AccordionItem value="attachment" data-value="attachment" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">Attachment & Patterns</span>
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
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={(e) => goToNextSection("attachment", e)}>
              Next
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Boundaries */}
        <AccordionItem value="boundaries" data-value="boundaries" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="font-medium">Boundaries & Safety</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
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

        {/* Cycle Tracking */}
        <AccordionItem value="cycle" data-value="cycle" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Hormone Cycle</span>
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
