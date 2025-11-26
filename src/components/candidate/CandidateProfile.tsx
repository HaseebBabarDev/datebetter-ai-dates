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
}

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

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  candidate,
  userId,
  onUpdate,
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

  return (
    <div className="space-y-4">
      {/* Photo & Edit Header */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <CandidatePhotoUpload
              candidateId={candidate.id}
              userId={userId}
              nickname={candidate.nickname}
              currentPhotoUrl={photoUrl}
              onPhotoUpdated={setPhotoUrl}
            />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(`/add-candidate?edit=${candidate.id}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Info
          </CardTitle>
        </CardHeader>
        <CardContent>
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
          {candidate.notes && <p className="text-sm text-muted-foreground mt-3">{candidate.notes}</p>}
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
            {candidate.their_career_stage && (
              <Badge variant="outline" className="gap-1">
                <Briefcase className="w-3 h-3" />
                {candidate.their_career_stage}
              </Badge>
            )}
            {candidate.their_ambition_level && (
              <Badge variant="outline">
                Ambition: {candidate.their_ambition_level}/5
              </Badge>
            )}
            {!candidate.their_attachment_style && !candidate.their_career_stage && (
              <p className="text-sm text-muted-foreground">No personality info recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chemistry Ratings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Chemistry Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Chemistry</span>
              <span className="font-medium">{candidate.overall_chemistry || 3}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Physical Attraction</span>
              <span className="font-medium">{candidate.physical_attraction || 3}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Intellectual Connection</span>
              <span className="font-medium">{candidate.intellectual_connection || 3}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Humor Compatibility</span>
              <span className="font-medium">{candidate.humor_compatibility || 3}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Energy Match</span>
              <span className="font-medium">{candidate.energy_match || 3}/5</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="font-medium">Average Chemistry</span>
              <span className="font-semibold text-primary">{chemistryAvg}/5</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
