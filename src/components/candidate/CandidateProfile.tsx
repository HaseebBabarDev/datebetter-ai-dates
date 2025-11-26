import React, { useState } from "react";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SliderInput } from "@/components/onboarding/SliderInput";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Calendar, MapPin, User, Briefcase, Heart, Users, Church, Vote } from "lucide-react";
import { toast } from "sonner";

type Candidate = Tables<"candidates">;

interface CandidateProfileProps {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => Promise<void>;
}

const STATUS_OPTIONS: { value: Enums<"candidate_status">; label: string }[] = [
  { value: "just_matched", label: "Just Matched" },
  { value: "texting", label: "Texting" },
  { value: "planning_date", label: "Planning Date" },
  { value: "dating", label: "Dating" },
  { value: "getting_serious", label: "Getting Serious" },
  { value: "no_contact", label: "No Contact" },
  { value: "archived", label: "Archived" },
];

const GENDER_OPTIONS: { value: Enums<"gender_identity">; label: string }[] = [
  { value: "woman_cis", label: "Woman (Cis)" },
  { value: "woman_trans", label: "Woman (Trans)" },
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
  "Student",
  "Entry Level",
  "Mid-Career",
  "Senior/Executive",
  "Entrepreneur",
  "Freelance/Creative",
  "Between Jobs",
  "Retired",
];

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  candidate,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Basic info
  const [nickname, setNickname] = useState(candidate.nickname);
  const [age, setAge] = useState(candidate.age?.toString() || "");
  const [status, setStatus] = useState<Enums<"candidate_status">>(candidate.status || "just_matched");
  const [notes, setNotes] = useState(candidate.notes || "");
  const [genderIdentity, setGenderIdentity] = useState<Enums<"gender_identity"> | "">(candidate.gender_identity || "");
  const [pronouns, setPronouns] = useState<Enums<"pronouns"> | "">(candidate.pronouns || "");

  // Values & beliefs
  const [religion, setReligion] = useState<Enums<"religion"> | "">(candidate.their_religion || "");
  const [politics, setPolitics] = useState<Enums<"politics"> | "">(candidate.their_politics || "");

  // Relationship goals
  const [relationshipGoal, setRelationshipGoal] = useState<Enums<"relationship_goal"> | "">(candidate.their_relationship_goal || "");
  const [kidsDesire, setKidsDesire] = useState<Enums<"kids_desire"> | "">(candidate.their_kids_desire || "");
  const [kidsStatus, setKidsStatus] = useState<Enums<"kids_status"> | "">(candidate.their_kids_status || "");

  // Personality
  const [attachmentStyle, setAttachmentStyle] = useState<Enums<"attachment_style"> | "">(candidate.their_attachment_style || "");
  const [careerStage, setCareerStage] = useState(candidate.their_career_stage || "");
  const [ambitionLevel, setAmbitionLevel] = useState(candidate.their_ambition_level || 3);

  // Chemistry
  const [overallChemistry, setOverallChemistry] = useState(candidate.overall_chemistry || 3);
  const [physicalAttraction, setPhysicalAttraction] = useState(candidate.physical_attraction || 3);
  const [intellectualConnection, setIntellectualConnection] = useState(candidate.intellectual_connection || 3);
  const [humorCompatibility, setHumorCompatibility] = useState(candidate.humor_compatibility || 3);
  const [energyMatch, setEnergyMatch] = useState(candidate.energy_match || 3);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        nickname,
        age: age ? parseInt(age) : null,
        status,
        notes: notes || null,
        gender_identity: genderIdentity || null,
        pronouns: pronouns || null,
        their_religion: religion || null,
        their_politics: politics || null,
        their_relationship_goal: relationshipGoal || null,
        their_kids_desire: kidsDesire || null,
        their_kids_status: kidsStatus || null,
        their_attachment_style: attachmentStyle || null,
        their_career_stage: careerStage || null,
        their_ambition_level: ambitionLevel,
        overall_chemistry: overallChemistry,
        physical_attraction: physicalAttraction,
        intellectual_connection: intellectualConnection,
        humor_compatibility: humorCompatibility,
        energy_match: energyMatch,
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNickname(candidate.nickname);
    setAge(candidate.age?.toString() || "");
    setStatus(candidate.status || "just_matched");
    setNotes(candidate.notes || "");
    setGenderIdentity(candidate.gender_identity || "");
    setPronouns(candidate.pronouns || "");
    setReligion(candidate.their_religion || "");
    setPolitics(candidate.their_politics || "");
    setRelationshipGoal(candidate.their_relationship_goal || "");
    setKidsDesire(candidate.their_kids_desire || "");
    setKidsStatus(candidate.their_kids_status || "");
    setAttachmentStyle(candidate.their_attachment_style || "");
    setCareerStage(candidate.their_career_stage || "");
    setAmbitionLevel(candidate.their_ambition_level || 3);
    setOverallChemistry(candidate.overall_chemistry || 3);
    setPhysicalAttraction(candidate.physical_attraction || 3);
    setIntellectualConnection(candidate.intellectual_connection || 3);
    setHumorCompatibility(candidate.humor_compatibility || 3);
    setEnergyMatch(candidate.energy_match || 3);
    setEditing(false);
  };

  const chemistryAvg = Math.round(
    (overallChemistry + physicalAttraction + intellectualConnection + humorCompatibility + energyMatch) / 5
  );

  const formatLabel = (value: string | null | undefined, options: { value: string; label: string }[]) => {
    if (!value) return null;
    return options.find(o => o.value === value)?.label || value;
  };

  return (
    <div className="space-y-4">
      {/* Edit Toggle */}
      <div className="flex justify-end">
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4 mr-1" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              Save All
            </Button>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nickname</Label>
                  <Input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={50} />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} min={18} max={99} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender Identity</Label>
                  <Select value={genderIdentity} onValueChange={(v) => setGenderIdentity(v as Enums<"gender_identity">)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Enums<"candidate_status">)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Personal notes..." rows={3} />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {candidate.age && (
                  <Badge variant="secondary" className="gap-1">
                    <User className="w-3 h-3" />
                    {candidate.age} years old
                  </Badge>
                )}
                {candidate.gender_identity && (
                  <Badge variant="secondary">{formatLabel(candidate.gender_identity, GENDER_OPTIONS)}</Badge>
                )}
                {candidate.pronouns && (
                  <Badge variant="secondary">{formatLabel(candidate.pronouns, PRONOUN_OPTIONS)}</Badge>
                )}
                {candidate.met_via && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {candidate.met_app || candidate.met_via.replace("_", " ")}
                  </Badge>
                )}
                {candidate.first_contact_date && (
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    Since {new Date(candidate.first_contact_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>
              {candidate.notes && <p className="text-sm text-muted-foreground">{candidate.notes}</p>}
            </>
          )}
        </CardContent>
      </Card>

      {/* Values & Beliefs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Church className="w-5 h-5" />
            Values & Beliefs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
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
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidate.their_religion && (
                <Badge variant="outline" className="gap-1">
                  <Church className="w-3 h-3" />
                  {formatLabel(candidate.their_religion, RELIGION_OPTIONS)}
                </Badge>
              )}
              {candidate.their_politics && (
                <Badge variant="outline" className="gap-1">
                  <Vote className="w-3 h-3" />
                  {formatLabel(candidate.their_politics, POLITICS_OPTIONS)}
                </Badge>
              )}
              {!candidate.their_religion && !candidate.their_politics && (
                <p className="text-sm text-muted-foreground">No values info yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relationship Goals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Relationship Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
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
              <div className="grid grid-cols-2 gap-4">
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
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidate.their_relationship_goal && (
                <Badge variant="outline">{formatLabel(candidate.their_relationship_goal, RELATIONSHIP_GOAL_OPTIONS)}</Badge>
              )}
              {candidate.their_kids_desire && (
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  {formatLabel(candidate.their_kids_desire, KIDS_DESIRE_OPTIONS)}
                </Badge>
              )}
              {candidate.their_kids_status && candidate.their_kids_status !== "no_kids" && (
                <Badge variant="outline">{formatLabel(candidate.their_kids_status, KIDS_STATUS_OPTIONS)}</Badge>
              )}
              {!candidate.their_relationship_goal && !candidate.their_kids_desire && (
                <p className="text-sm text-muted-foreground">No relationship goals info yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Career & Personality */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Career & Personality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
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
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {candidate.their_career_stage && (
                  <Badge variant="outline" className="gap-1">
                    <Briefcase className="w-3 h-3" />
                    {candidate.their_career_stage}
                  </Badge>
                )}
                {candidate.their_attachment_style && (
                  <Badge variant="outline">{formatLabel(candidate.their_attachment_style, ATTACHMENT_STYLE_OPTIONS)} Attachment</Badge>
                )}
              </div>
              {candidate.their_ambition_level && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ambition Level</span>
                    <span className="font-medium">{candidate.their_ambition_level}/5</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(candidate.their_ambition_level / 5) * 100}%` }} />
                  </div>
                </div>
              )}
              {!candidate.their_career_stage && !candidate.their_attachment_style && !candidate.their_ambition_level && (
                <p className="text-sm text-muted-foreground">No career/personality info yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chemistry Ratings */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chemistry Ratings</CardTitle>
            <Badge variant="outline" className="text-lg font-semibold">{chemistryAvg}/5</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <SliderInput label="Overall Chemistry" value={overallChemistry} onChange={setOverallChemistry} leftLabel="Low" rightLabel="Electric" />
              <SliderInput label="Physical Attraction" value={physicalAttraction} onChange={setPhysicalAttraction} leftLabel="Neutral" rightLabel="Very Attracted" />
              <SliderInput label="Intellectual Connection" value={intellectualConnection} onChange={setIntellectualConnection} leftLabel="Surface" rightLabel="Deep" />
              <SliderInput label="Humor Compatibility" value={humorCompatibility} onChange={setHumorCompatibility} leftLabel="Different" rightLabel="Same Wavelength" />
              <SliderInput label="Energy Match" value={energyMatch} onChange={setEnergyMatch} leftLabel="Draining" rightLabel="Energizing" />
            </>
          ) : (
            <div className="space-y-3">
              <ChemistryBar label="Overall Chemistry" value={candidate.overall_chemistry || 3} />
              <ChemistryBar label="Physical Attraction" value={candidate.physical_attraction || 3} />
              <ChemistryBar label="Intellectual Connection" value={candidate.intellectual_connection || 3} />
              <ChemistryBar label="Humor Compatibility" value={candidate.humor_compatibility || 3} />
              <ChemistryBar label="Energy Match" value={candidate.energy_match || 3} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ChemistryBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}/5</span>
    </div>
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(value / 5) * 100}%` }} />
    </div>
  </div>
);
