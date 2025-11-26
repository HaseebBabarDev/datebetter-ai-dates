import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Plus, User, MapPin, Church, Heart, Briefcase, Sparkles } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_GENDER_KEY = "candidate_default_gender_identity";

interface AddCandidateFormProps {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const MET_VIA_OPTIONS = [
  { value: "dating_app", label: "Dating App" },
  { value: "friends", label: "Through Friends" },
  { value: "work", label: "Work/Professional" },
  { value: "school", label: "School/University" },
  { value: "social_event", label: "Social Event" },
  { value: "gym", label: "Gym/Fitness" },
  { value: "online_other", label: "Online (Other)" },
  { value: "in_person", label: "In Person (Random)" },
];

const DATING_APPS = [
  "Hinge", "Bumble", "Tinder", "Coffee Meets Bagel", "The League", "Feeld", "HER", "OkCupid", "Other",
];

const GENDER_OPTIONS: { value: Enums<"gender_identity">; label: string }[] = [
  { value: "woman_cis", label: "Woman" },
  { value: "woman_trans", label: "Woman (Trans)" },
  { value: "man_cis", label: "Man" },
  { value: "man_trans", label: "Man (Trans)" },
  { value: "non_binary", label: "Non-Binary" },
  { value: "gender_fluid", label: "Gender Fluid" },
  { value: "self_describe", label: "Self Describe" },
];

const PRONOUN_OPTIONS: { value: Enums<"pronouns">; label: string }[] = [
  { value: "she_her", label: "She/Her" },
  { value: "he_him", label: "He/Him" },
  { value: "they_them", label: "They/Them" },
  { value: "other", label: "Other" },
];

const RELIGION_OPTIONS: { value: Enums<"religion">; label: string }[] = [
  { value: "none", label: "None/Atheist" },
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

const POLITICS_OPTIONS: { value: Enums<"politics">; label: string }[] = [
  { value: "progressive", label: "Progressive" },
  { value: "liberal", label: "Liberal" },
  { value: "moderate", label: "Moderate" },
  { value: "conservative", label: "Conservative" },
  { value: "traditional", label: "Traditional" },
];

const RELATIONSHIP_GOAL_OPTIONS: { value: Enums<"relationship_goal">; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Serious Relationship" },
  { value: "marriage", label: "Marriage" },
  { value: "unsure", label: "Unsure" },
];

const KIDS_DESIRE_OPTIONS: { value: Enums<"kids_desire">; label: string }[] = [
  { value: "definitely_yes", label: "Wants Kids" },
  { value: "maybe", label: "Maybe/Open" },
  { value: "definitely_no", label: "Doesn't Want Kids" },
  { value: "already_have", label: "Already Has Kids" },
];

const KIDS_STATUS_OPTIONS: { value: Enums<"kids_status">; label: string }[] = [
  { value: "no_kids", label: "No Kids" },
  { value: "has_young_kids", label: "Has Young Kids" },
  { value: "has_adult_kids", label: "Has Adult Kids" },
];

const ATTACHMENT_STYLE_OPTIONS: { value: Enums<"attachment_style">; label: string }[] = [
  { value: "secure", label: "Secure" },
  { value: "anxious", label: "Anxious" },
  { value: "avoidant", label: "Avoidant" },
  { value: "disorganized", label: "Disorganized" },
];

const CAREER_STAGE_OPTIONS = [
  "Student", "Entry Level", "Mid-Career", "Senior/Executive", "Entrepreneur", "Freelance/Creative", "Between Jobs", "Retired",
];

export const AddCandidateForm: React.FC<AddCandidateFormProps> = ({
  onSuccess,
  trigger,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Basic Info
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [genderIdentity, setGenderIdentity] = useState<Enums<"gender_identity"> | "">("");
  const [pronouns, setPronouns] = useState<Enums<"pronouns"> | "">("");
  const [isDefaultGender, setIsDefaultGender] = useState(false);

  // Load default gender identity from localStorage
  useEffect(() => {
    const savedDefault = localStorage.getItem(DEFAULT_GENDER_KEY);
    if (savedDefault) {
      setGenderIdentity(savedDefault as Enums<"gender_identity">);
      setIsDefaultGender(true);
    }
  }, [open]);

  const handleSetDefaultGender = (checked: boolean) => {
    setIsDefaultGender(checked);
    if (checked && genderIdentity) {
      localStorage.setItem(DEFAULT_GENDER_KEY, genderIdentity);
      toast.success("Default gender identity saved");
    } else if (!checked) {
      localStorage.removeItem(DEFAULT_GENDER_KEY);
      toast.success("Default removed");
    }
  };

  const handleGenderChange = (value: Enums<"gender_identity">) => {
    setGenderIdentity(value);
    // If this is set as default, update localStorage
    if (isDefaultGender) {
      localStorage.setItem(DEFAULT_GENDER_KEY, value);
    }
  };

  // Where Met
  const [metVia, setMetVia] = useState("");
  const [metApp, setMetApp] = useState("");

  // Values & Beliefs
  const [religion, setReligion] = useState<Enums<"religion"> | "">("");
  const [politics, setPolitics] = useState<Enums<"politics"> | "">("");

  // Relationship Goals
  const [relationshipGoal, setRelationshipGoal] = useState<Enums<"relationship_goal"> | "">("");
  const [kidsDesire, setKidsDesire] = useState<Enums<"kids_desire"> | "">("");
  const [kidsStatus, setKidsStatus] = useState<Enums<"kids_status"> | "">("");

  // Career & Personality
  const [careerStage, setCareerStage] = useState("");
  const [attachmentStyle, setAttachmentStyle] = useState<Enums<"attachment_style"> | "">("");
  const [ambitionLevel, setAmbitionLevel] = useState(3);

  // Chemistry
  const [overallChemistry, setOverallChemistry] = useState(3);
  const [physicalAttraction, setPhysicalAttraction] = useState(3);
  const [intellectualConnection, setIntellectualConnection] = useState(3);
  const [humorCompatibility, setHumorCompatibility] = useState(3);
  const [energyMatch, setEnergyMatch] = useState(3);

  const resetForm = () => {
    setNickname("");
    setAge("");
    // Preserve default gender identity if set
    const savedDefault = localStorage.getItem(DEFAULT_GENDER_KEY);
    if (savedDefault) {
      setGenderIdentity(savedDefault as Enums<"gender_identity">);
      setIsDefaultGender(true);
    } else {
      setGenderIdentity("");
      setIsDefaultGender(false);
    }
    setPronouns("");
    setMetVia("");
    setMetApp("");
    setReligion("");
    setPolitics("");
    setRelationshipGoal("");
    setKidsDesire("");
    setKidsStatus("");
    setCareerStage("");
    setAttachmentStyle("");
    setAmbitionLevel(3);
    setOverallChemistry(3);
    setPhysicalAttraction(3);
    setIntellectualConnection(3);
    setHumorCompatibility(3);
    setEnergyMatch(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("candidates").insert({
        user_id: user.id,
        nickname: nickname.trim(),
        age: age ? parseInt(age) : null,
        gender_identity: genderIdentity || null,
        pronouns: pronouns || null,
        met_via: metVia || null,
        met_app: metVia === "dating_app" ? metApp : null,
        their_religion: religion || null,
        their_politics: politics || null,
        their_relationship_goal: relationshipGoal || null,
        their_kids_desire: kidsDesire || null,
        their_kids_status: kidsStatus || null,
        their_career_stage: careerStage || null,
        their_attachment_style: attachmentStyle || null,
        their_ambition_level: ambitionLevel,
        overall_chemistry: overallChemistry,
        physical_attraction: physicalAttraction,
        intellectual_connection: intellectualConnection,
        humor_compatibility: humorCompatibility,
        energy_match: energyMatch,
        first_contact_date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast.success(`${nickname} added to your candidates!`);
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding candidate:", error);
      toast.error("Failed to add candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add New Candidate</SheetTitle>
          <SheetDescription>
            Add someone you're talking to or dating. Fill in what you know!
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Basic Info - Always visible */}
          <div className="space-y-4 pb-4 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="w-4 h-4" />
              Basic Info
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="nickname">Nickname *</Label>
                <Input
                  id="nickname"
                  placeholder="Give them a memorable nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={18}
                  max={99}
                />
              </div>
              <div className="space-y-2">
                <Label>Pronouns</Label>
                <Select value={pronouns} onValueChange={(v) => setPronouns(v as Enums<"pronouns">)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PRONOUN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Gender Identity</Label>
                <Select value={genderIdentity} onValueChange={handleGenderChange}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="default-gender"
                    checked={isDefaultGender}
                    onCheckedChange={handleSetDefaultGender}
                    disabled={!genderIdentity}
                  />
                  <Label htmlFor="default-gender" className="text-xs text-muted-foreground cursor-pointer">
                    Set as default for new candidates
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["where-met", "chemistry"]} className="w-full">
            {/* Where Met */}
            <AccordionItem value="where-met">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Where You Met
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label>How did you meet?</Label>
                  <Select value={metVia} onValueChange={setMetVia}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {MET_VIA_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {metVia === "dating_app" && (
                  <div className="space-y-2">
                    <Label>Which app?</Label>
                    <Select value={metApp} onValueChange={setMetApp}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {DATING_APPS.map((app) => (
                          <SelectItem key={app} value={app}>{app}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Values & Beliefs */}
            <AccordionItem value="values">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Church className="w-4 h-4" />
                  Values & Beliefs
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Religion</Label>
                    <Select value={religion} onValueChange={(v) => setReligion(v as Enums<"religion">)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {RELIGION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Politics</Label>
                    <Select value={politics} onValueChange={(v) => setPolitics(v as Enums<"politics">)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {POLITICS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Relationship Goals */}
            <AccordionItem value="relationship">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Relationship Goals
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label>What are they looking for?</Label>
                  <Select value={relationshipGoal} onValueChange={(v) => setRelationshipGoal(v as Enums<"relationship_goal">)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_GOAL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Kids Desire</Label>
                    <Select value={kidsDesire} onValueChange={(v) => setKidsDesire(v as Enums<"kids_desire">)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {KIDS_DESIRE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kids Status</Label>
                    <Select value={kidsStatus} onValueChange={(v) => setKidsStatus(v as Enums<"kids_status">)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {KIDS_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Career & Personality */}
            <AccordionItem value="career">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Career & Personality
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Career Stage</Label>
                    <Select value={careerStage} onValueChange={setCareerStage}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {CAREER_STAGE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Attachment Style</Label>
                    <Select value={attachmentStyle} onValueChange={(v) => setAttachmentStyle(v as Enums<"attachment_style">)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {ATTACHMENT_STYLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SliderInput
                  label="Ambition Level"
                  value={ambitionLevel}
                  onChange={setAmbitionLevel}
                  leftLabel="Laid-back"
                  rightLabel="Very Driven"
                />
              </AccordionContent>
            </AccordionItem>

            {/* Chemistry Ratings */}
            <AccordionItem value="chemistry">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Chemistry Ratings
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Rate your initial impressions (you can update these later)
                </p>
                <SliderInput
                  label="Overall Chemistry"
                  value={overallChemistry}
                  onChange={setOverallChemistry}
                  leftLabel="Low"
                  rightLabel="Electric"
                />
                <SliderInput
                  label="Physical Attraction"
                  value={physicalAttraction}
                  onChange={setPhysicalAttraction}
                  leftLabel="Neutral"
                  rightLabel="Very Attracted"
                />
                <SliderInput
                  label="Intellectual Connection"
                  value={intellectualConnection}
                  onChange={setIntellectualConnection}
                  leftLabel="Surface"
                  rightLabel="Deep"
                />
                <SliderInput
                  label="Humor Compatibility"
                  value={humorCompatibility}
                  onChange={setHumorCompatibility}
                  leftLabel="Different"
                  rightLabel="Same Wavelength"
                />
                <SliderInput
                  label="Energy Match"
                  value={energyMatch}
                  onChange={setEnergyMatch}
                  leftLabel="Draining"
                  rightLabel="Energizing"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Candidate"}
          </Button>
          
          <div className="text-center pt-2">
            <Button
              type="button"
              variant="link"
              className="text-sm text-muted-foreground"
              onClick={() => {
                setOpen(false);
                window.location.href = '/add-candidate';
              }}
            >
              Add more detailed info instead
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
