import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<"candidates">;

interface ProfileCompletenessProps {
  candidate: Candidate;
}

const PROFILE_FIELDS = [
  // Basic info
  { key: "age", label: "Age", weight: 2 },
  { key: "gender_identity", label: "Gender", weight: 1 },
  { key: "pronouns", label: "Pronouns", weight: 1 },
  { key: "height", label: "Height", weight: 1 },
  { key: "country", label: "Country", weight: 1 },
  { key: "city", label: "City", weight: 1 },
  { key: "distance_approximation", label: "Distance", weight: 1 },
  { key: "their_schedule_flexibility", label: "Schedule", weight: 1 },
  // Values
  { key: "their_religion", label: "Religion", weight: 2 },
  { key: "their_politics", label: "Politics", weight: 2 },
  { key: "their_relationship_status", label: "Relationship Status", weight: 2 },
  { key: "their_relationship_goal", label: "Relationship Goal", weight: 2 },
  { key: "their_kids_desire", label: "Kids Desire", weight: 2 },
  { key: "their_kids_status", label: "Kids Status", weight: 1 },
  { key: "their_attachment_style", label: "Attachment Style", weight: 2 },
  // Career/Lifestyle
  { key: "their_career_stage", label: "Career", weight: 1 },
  { key: "their_education_level", label: "Education", weight: 1 },
  { key: "their_social_style", label: "Social Style", weight: 1 },
  { key: "their_drinking", label: "Drinking", weight: 1 },
  { key: "their_smoking", label: "Smoking", weight: 1 },
  { key: "their_exercise", label: "Exercise", weight: 1 },
];

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ candidate }) => {
  const navigate = useNavigate();

  const calculateCompleteness = () => {
    let filledWeight = 0;
    let totalWeight = 0;
    const missingFields: string[] = [];

    PROFILE_FIELDS.forEach(field => {
      totalWeight += field.weight;
      const value = (candidate as any)[field.key];
      if (value !== null && value !== undefined && value !== "") {
        filledWeight += field.weight;
      } else if (field.weight >= 2) {
        missingFields.push(field.label);
      }
    });

    return {
      percentage: Math.round((filledWeight / totalWeight) * 100),
      missingFields: missingFields.slice(0, 3),
    };
  };

  const { percentage, missingFields } = calculateCompleteness();

  const getProgressColor = () => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getMessage = () => {
    if (percentage >= 80) return "Great! Profile is well detailed";
    if (percentage >= 50) return "Add more details for better insights";
    return "Profile needs more info for accurate scoring";
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {percentage >= 80 ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
          )}
          <span className="text-sm font-medium">Profile Completeness</span>
        </div>
        <span className={`text-sm font-semibold ${
          percentage >= 80 ? "text-green-500" : 
          percentage >= 50 ? "text-yellow-500" : "text-orange-500"
        }`}>
          {percentage}%
        </span>
      </div>

      <Progress 
        value={percentage} 
        className="h-2"
        indicatorClassName={getProgressColor()}
      />

      <p className="text-xs text-muted-foreground">{getMessage()}</p>

      {percentage < 80 && missingFields.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Missing: {missingFields.join(", ")}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => navigate(`/add-candidate?edit=${candidate.id}`)}
          >
            <Edit className="w-3 h-3" />
            Update
          </Button>
        </div>
      )}
    </div>
  );
};
