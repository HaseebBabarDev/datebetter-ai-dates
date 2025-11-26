import React, { useState, useEffect } from "react";
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
import { SliderInput } from "@/components/onboarding/SliderInput";
import { 
  User, Heart, Users, Baby, Church, Vote, Briefcase, 
  MapPin, Sparkles, MessageCircle, Brain, Shield, Lock, Save
} from "lucide-react";
import { toast } from "sonner";

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

export const ProfilePreferencesEditor: React.FC = () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["relationship"]} className="space-y-2">

        {/* Relationship Goals */}
        <AccordionItem value="relationship" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Relationship Goals</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Kids & Family */}
        <AccordionItem value="kids" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Baby className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Kids & Family</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Faith & Values */}
        <AccordionItem value="faith" className="border rounded-lg px-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Politics */}
        <AccordionItem value="politics" className="border rounded-lg px-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Career */}
        <AccordionItem value="career" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-500" />
              <span className="font-medium">Career & Education</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Education Level</Label>
                <Input
                  value={formData.education_level || ""}
                  onChange={(e) => updateField("education_level", e.target.value)}
                  placeholder="e.g., Bachelor's"
                />
              </div>
              <div className="space-y-2">
                <Label>Career Stage</Label>
                <Input
                  value={formData.career_stage || ""}
                  onChange={(e) => updateField("career_stage", e.target.value)}
                  placeholder="e.g., Mid-career"
                />
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
          </AccordionContent>
        </AccordionItem>

        {/* Lifestyle */}
        <AccordionItem value="lifestyle" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="font-medium">Lifestyle</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Input
                  value={formData.distance_preference || ""}
                  onChange={(e) => updateField("distance_preference", e.target.value)}
                  placeholder="e.g., Within 25 miles"
                />
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
          </AccordionContent>
        </AccordionItem>

        {/* Physical Preferences */}
        <AccordionItem value="physical" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Physical Preferences</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Age Min</Label>
                <Input
                  type="number"
                  value={formData.preferred_age_min || ""}
                  onChange={(e) => updateField("preferred_age_min", parseInt(e.target.value) || null)}
                  min={18}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Age Max</Label>
                <Input
                  type="number"
                  value={formData.preferred_age_max || ""}
                  onChange={(e) => updateField("preferred_age_max", parseInt(e.target.value) || null)}
                  min={18}
                />
              </div>
            </div>
            <SliderInput
              label="Physical Attraction Importance"
              value={formData.attraction_importance || 3}
              onChange={(v) => updateField("attraction_importance", v)}
              leftLabel="Not important"
              rightLabel="Very important"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Communication */}
        <AccordionItem value="communication" className="border rounded-lg px-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Attachment & Patterns */}
        <AccordionItem value="attachment" className="border rounded-lg px-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Longest Relationship</Label>
                <Input
                  value={formData.longest_relationship || ""}
                  onChange={(e) => updateField("longest_relationship", e.target.value)}
                  placeholder="e.g., 3 years"
                />
              </div>
              <div className="space-y-2">
                <Label>Time Since Last</Label>
                <Input
                  value={formData.time_since_last_relationship || ""}
                  onChange={(e) => updateField("time_since_last_relationship", e.target.value)}
                  placeholder="e.g., 6 months"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Boundaries */}
        <AccordionItem value="boundaries" className="border rounded-lg px-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Cycle Tracking */}
        <AccordionItem value="cycle" className="border rounded-lg px-4">
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
