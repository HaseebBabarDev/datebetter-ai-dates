import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Calendar, MapPin, User, Briefcase, Heart, Users, Church, Vote } from "lucide-react";
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
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {candidate.their_relationship_goal && (
              <Badge variant="outline" className="gap-1">
                <Heart className="w-3 h-3" />
                {formatLabel(candidate.their_relationship_goal, RELATIONSHIP_GOAL_OPTIONS)}
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
            {!candidate.their_relationship_goal && !candidate.their_kids_desire && (
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

      {/* Lifestyle */}
      {((candidate as any).their_drinking || (candidate as any).their_smoking || (candidate as any).their_exercise) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lifestyle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(candidate as any).their_drinking && (
                <Badge variant="outline">
                  🍷 {(candidate as any).their_drinking}
                </Badge>
              )}
              {(candidate as any).their_smoking && (
                <Badge variant="outline">
                  🚬 {(candidate as any).their_smoking}
                </Badge>
              )}
              {(candidate as any).their_exercise && (
                <Badge variant="outline">
                  💪 {(candidate as any).their_exercise}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chemistry Ratings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Chemistry Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Overall Chemistry", value: candidate.overall_chemistry || 3 },
              { label: "Physical Attraction", value: candidate.physical_attraction || 3 },
              { label: "Intellectual Connection", value: candidate.intellectual_connection || 3 },
              { label: "Humor Compatibility", value: candidate.humor_compatibility || 3 },
              { label: "Energy Match", value: candidate.energy_match || 3 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-4 rounded-full ${
                          i <= value ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-sm w-6">{value}/5</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
