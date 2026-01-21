import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Calendar, MapPin, User, Briefcase, Heart, Users, Church, Vote, Wine, Cigarette, Dumbbell, Brain, Home, Target } from "lucide-react";
import { CandidatePhotoUpload } from "./CandidatePhotoUpload";

type Candidate = Tables<"candidates">;

interface CandidateProfileProps {
  candidate: Candidate;
  userId: string;
  onUpdate: (updates: Partial<Candidate>) => Promise<void>;
  showBasicOnly?: boolean;
  showDetailsOnly?: boolean;
}

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
  { value: "situationship", label: "Situationship" },
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Serious Relationship" },
  { value: "marriage", label: "Marriage" },
  { value: "unsure", label: "Unsure" },
];

const USER_GOAL_OPTIONS = [
  { value: "casual", label: "Casual / Fun" },
  { value: "situationship", label: "Situationship" },
  { value: "dating", label: "Dating / Getting to Know" },
  { value: "serious", label: "Serious Relationship" },
  { value: "marriage", label: "Long-term / Marriage" },
  { value: "unsure", label: "Still Figuring It Out" },
];

const RELATIONSHIP_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "recently_divorced", label: "Recently Divorced" },
  { value: "ethical_non_monogamy", label: "Ethical Non-Monogamy" },
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

const ZODIAC_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "aries", label: "Aries", emoji: "♈" },
  { value: "taurus", label: "Taurus", emoji: "♉" },
  { value: "gemini", label: "Gemini", emoji: "♊" },
  { value: "cancer", label: "Cancer", emoji: "♋" },
  { value: "leo", label: "Leo", emoji: "♌" },
  { value: "virgo", label: "Virgo", emoji: "♍" },
  { value: "libra", label: "Libra", emoji: "♎" },
  { value: "scorpio", label: "Scorpio", emoji: "♏" },
  { value: "sagittarius", label: "Sagittarius", emoji: "♐" },
  { value: "capricorn", label: "Capricorn", emoji: "♑" },
  { value: "aquarius", label: "Aquarius", emoji: "♒" },
  { value: "pisces", label: "Pisces", emoji: "♓" },
];

const THEIR_PARENT_STATUS_OPTIONS = [
  { value: "married_together", label: "Married Together" },
  { value: "unmarried_together", label: "Unmarried Together" },
  { value: "divorced", label: "Divorced" },
  { value: "separated", label: "Separated" },
  { value: "single_parent", label: "Single Parent" },
  { value: "adopted", label: "Adopted" },
  { value: "orphan_system", label: "Orphan/System" },
  { value: "other_guardians", label: "Other Guardians" },
  { value: "unknown", label: "Unknown" },
];

const THEIR_PARENT_PRESENCE_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "deceased", label: "Deceased" },
  { value: "unknown", label: "Unknown" },
];

const THEIR_PARENTS_OPTIONS = [
  { value: "together_healthy", label: "Together & Healthy" },
  { value: "together_unhealthy", label: "Together but Unhealthy" },
  { value: "divorced_amicable", label: "Divorced (Amicable)" },
  { value: "divorced_contentious", label: "Divorced (Contentious)" },
  { value: "single_parent", label: "Single Parent" },
  { value: "unknown", label: "Unknown" },
];

const THEIR_FELT_LOVED_OPTIONS = [
  { value: "yes_consistently", label: "Yes, Consistently" },
  { value: "sometimes", label: "Sometimes" },
  { value: "rarely", label: "Rarely" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];

const THEIR_FAMILY_STABILITY_OPTIONS = [
  { value: "very_stable", label: "Very Stable" },
  { value: "mostly_stable", label: "Mostly Stable" },
  { value: "some_instability", label: "Some Instability" },
  { value: "frequent_chaos", label: "Frequent Chaos" },
  { value: "unknown", label: "Unknown" },
];

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  candidate,
  userId,
  onUpdate,
  showBasicOnly = false,
  showDetailsOnly = false,
}) => {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState(candidate.photo_url);

  const formatLabel = (value: string | null | undefined, options: { value: string; label: string }[]) => {
    if (!value) return null;
    return options.find(o => o.value === value)?.label || value;
  };

  const chemistryAvg = Math.round(
    ((candidate.overall_chemistry || 3) + 
     (candidate.physical_attraction || 3) + 
     (candidate.intellectual_connection || 3) + 
     (candidate.humor_compatibility || 3) + 
     (candidate.energy_match || 3)) / 5
  );

  // Basic info section (photo + basic)
  const BasicSection = () => (
    <>
      {/* Photo & Edit Header */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="relative">
            <CandidatePhotoUpload
              candidateId={candidate.id}
              userId={userId}
              nickname={candidate.nickname}
              currentPhotoUrl={photoUrl}
              onPhotoUpdated={setPhotoUrl}
              large
            />
            <Button 
              variant="secondary" 
              size="icon"
              onClick={() => navigate(`/add-candidate?edit=${candidate.id}`)}
              className="absolute top-3 right-3 rounded-full shadow-lg"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4">
            <h2 className="text-xl font-semibold">{candidate.nickname}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
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
              {(candidate as any).zodiac_sign && (() => {
                const zodiac = ZODIAC_OPTIONS.find(z => z.value === (candidate as any).zodiac_sign);
                return zodiac ? (
                  <Badge variant="secondary" className="gap-1">
                    {zodiac.emoji} {zodiac.label}
                  </Badge>
                ) : null;
              })()}
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
            {candidate.notes && (
              <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">{candidate.notes}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chemistry Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Chemistry Score</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-6 rounded-full ${
                      i <= chemistryAvg ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-primary">{chemistryAvg}/5</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );

  // Detailed sections (values, goals, personality, chemistry)
  const DetailsSection = () => (
    <>
      {/* Values & Beliefs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Church className="w-5 h-5" />
            Values & Beliefs
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <p className="text-sm text-muted-foreground">No values info recorded</p>
            )}
          </div>
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
        <CardContent className="space-y-3">
          {/* Your goal for them */}
          {(candidate as any).user_goal_for_candidate && (
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Your goal for {candidate.nickname}</p>
              <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/20">
                <Target className="w-3 h-3" />
                {formatLabel((candidate as any).user_goal_for_candidate, USER_GOAL_OPTIONS)}
              </Badge>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {(candidate as any).their_relationship_status && (
              <Badge variant="outline" className="gap-1">
                <Users className="w-3 h-3" />
                {formatLabel((candidate as any).their_relationship_status, RELATIONSHIP_STATUS_OPTIONS)}
              </Badge>
            )}
            {candidate.their_relationship_goal && (
              <Badge variant="outline" className="gap-1">
                <Heart className="w-3 h-3" />
                They want: {formatLabel(candidate.their_relationship_goal, RELATIONSHIP_GOAL_OPTIONS)}
              </Badge>
            )}
            {candidate.their_kids_desire && (
              <Badge variant="outline" className="gap-1">
                <Users className="w-3 h-3" />
                {formatLabel(candidate.their_kids_desire, KIDS_DESIRE_OPTIONS)}
              </Badge>
            )}
            {candidate.their_kids_status && (
              <Badge variant="outline">
                {formatLabel(candidate.their_kids_status, KIDS_STATUS_OPTIONS)}
              </Badge>
            )}
            {!candidate.their_relationship_goal && !candidate.their_kids_desire && !(candidate as any).user_goal_for_candidate && (
              <p className="text-sm text-muted-foreground">No relationship goals recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personality & Career */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Personality & Career
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {candidate.their_attachment_style && (
              <Badge variant="outline">
                {formatLabel(candidate.their_attachment_style, ATTACHMENT_STYLE_OPTIONS)} Attachment
              </Badge>
            )}
            {(candidate as any).their_social_style && (
              <Badge variant="outline">
                {(candidate as any).their_social_style.replace("_", " ")}
              </Badge>
            )}
            {(candidate as any).their_education_level && (
              <Badge variant="outline">
                {(candidate as any).their_education_level.replace("_", " ")}
              </Badge>
            )}
            {candidate.their_career_stage && (
              <Badge variant="outline" className="gap-1">
                <Briefcase className="w-3 h-3" />
                {candidate.their_career_stage.replace("_", " ")}
              </Badge>
            )}
            {candidate.their_ambition_level && (
              <Badge variant="outline">
                Ambition: {candidate.their_ambition_level}/5
              </Badge>
            )}
            {!candidate.their_attachment_style && !candidate.their_career_stage && !(candidate as any).their_education_level && (
              <p className="text-sm text-muted-foreground">No personality info recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mental Health & Neurodivergence */}
      {((candidate as any).their_neurodivergent || (candidate as any).their_mental_health_awareness) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Mental Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(candidate as any).their_neurodivergent && (candidate as any).their_neurodivergent !== "unknown" && (
                <Badge variant="outline" className="gap-1">
                  <Brain className="w-3 h-3" />
                  Neurodivergent: {(candidate as any).their_neurodivergent === "yes" ? "Yes" : "No"}
                </Badge>
              )}
              {(candidate as any).their_mental_health_awareness && (candidate as any).their_mental_health_awareness !== "unknown" && (
                <Badge variant="outline">
                  MH Awareness: {(candidate as any).their_mental_health_awareness.replace("_", " ")}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifestyle */}
      {((candidate as any).their_drinking || (candidate as any).their_smoking || (candidate as any).their_exercise) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lifestyle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(candidate as any).their_drinking && (
                <Badge variant="outline" className="gap-1">
                  <Wine className="w-3 h-3" />
                  {(candidate as any).their_drinking}
                </Badge>
              )}
              {(candidate as any).their_smoking && (
                <Badge variant="outline" className="gap-1">
                  <Cigarette className="w-3 h-3" />
                  {(candidate as any).their_smoking}
                </Badge>
              )}
              {(candidate as any).their_exercise && (
                <Badge variant="outline" className="gap-1">
                  <Dumbbell className="w-3 h-3" />
                  {(candidate as any).their_exercise}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family & Upbringing */}
      {((candidate as any).their_parents_relationship || 
        (candidate as any).their_felt_loved_as_child || 
        (candidate as any).their_family_stability ||
        (candidate as any).their_healthy_relationship_models !== null ||
        (candidate as any).their_family_notes) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              Family & Upbringing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(candidate as any).their_parent_status && (candidate as any).their_parent_status !== "unknown" && (
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  {formatLabel((candidate as any).their_parent_status, THEIR_PARENT_STATUS_OPTIONS)}
                </Badge>
              )}
              {(candidate as any).their_mother_status && (candidate as any).their_mother_status !== "unknown" && (
                <Badge variant="outline">
                  Mother: {formatLabel((candidate as any).their_mother_status, THEIR_PARENT_PRESENCE_OPTIONS)}
                </Badge>
              )}
              {(candidate as any).their_father_status && (candidate as any).their_father_status !== "unknown" && (
                <Badge variant="outline">
                  Father: {formatLabel((candidate as any).their_father_status, THEIR_PARENT_PRESENCE_OPTIONS)}
                </Badge>
              )}
              {(candidate as any).their_siblings !== null && (candidate as any).their_siblings !== undefined && (
                <Badge variant="outline">
                  {(candidate as any).their_siblings} Sibling{(candidate as any).their_siblings !== 1 ? 's' : ''}
                </Badge>
              )}
              {(candidate as any).their_parents_relationship && (candidate as any).their_parents_relationship !== "unknown" && (
                <Badge variant="outline">
                  Parents Rel: {formatLabel((candidate as any).their_parents_relationship, THEIR_PARENTS_OPTIONS)}
                </Badge>
              )}
              {(candidate as any).their_felt_loved_as_child && (candidate as any).their_felt_loved_as_child !== "unknown" && (
                <Badge variant="outline">
                  Felt Loved: {formatLabel((candidate as any).their_felt_loved_as_child, THEIR_FELT_LOVED_OPTIONS)}
                </Badge>
              )}
              {(candidate as any).their_family_stability && (candidate as any).their_family_stability !== "unknown" && (
                <Badge variant="outline">
                  {formatLabel((candidate as any).their_family_stability, THEIR_FAMILY_STABILITY_OPTIONS)}
                </Badge>
              )}
              {(candidate as any).their_healthy_relationship_models !== null && (candidate as any).their_healthy_relationship_models !== undefined && (
                <Badge variant="outline">
                  Role Models: {(candidate as any).their_healthy_relationship_models ? "Yes" : "No"}
                </Badge>
              )}
            </div>
            {(candidate as any).their_family_notes && (
              <p className="text-sm text-muted-foreground p-2 bg-muted/30 rounded">
                {(candidate as any).their_family_notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );

  if (showBasicOnly) {
    return <div className="space-y-4"><BasicSection /></div>;
  }

  if (showDetailsOnly) {
    return <div className="space-y-4"><DetailsSection /></div>;
  }

  return (
    <div className="space-y-4">
      <BasicSection />
      <DetailsSection />
    </div>
  );
};
