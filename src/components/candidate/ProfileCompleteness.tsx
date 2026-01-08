import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<"candidates">;

interface ProfileCompletenessProps {
  candidate: Candidate;
}

const PROFILE_FIELDS = [
  // Basic info
  { key: "age", label: "Age", weight: 2, section: "basic" },
  { key: "gender_identity", label: "Gender", weight: 1, section: "basic" },
  { key: "pronouns", label: "Pronouns", weight: 1, section: "basic" },
  { key: "height", label: "Height", weight: 1, section: "basic" },
  { key: "country", label: "Country", weight: 1, section: "location" },
  { key: "city", label: "City", weight: 1, section: "location" },
  { key: "distance_approximation", label: "Distance", weight: 1, section: "location" },
  { key: "their_schedule_flexibility", label: "Schedule", weight: 1, section: "lifestyle" },
  // Values
  { key: "their_religion", label: "Religion", weight: 2, section: "values" },
  { key: "their_politics", label: "Politics", weight: 2, section: "values" },
  { key: "their_relationship_status", label: "Relationship Status", weight: 2, section: "relationship" },
  { key: "their_relationship_goal", label: "Relationship Goal", weight: 2, section: "relationship" },
  { key: "their_kids_desire", label: "Kids Desire", weight: 2, section: "family" },
  { key: "their_kids_status", label: "Kids Status", weight: 1, section: "family" },
  { key: "their_attachment_style", label: "Attachment Style", weight: 2, section: "values" },
  // Career/Lifestyle
  { key: "their_career_stage", label: "Career", weight: 1, section: "lifestyle" },
  { key: "their_education_level", label: "Education", weight: 1, section: "lifestyle" },
  { key: "their_social_style", label: "Social Style", weight: 1, section: "lifestyle" },
  { key: "their_drinking", label: "Drinking", weight: 1, section: "lifestyle" },
  { key: "their_smoking", label: "Smoking", weight: 1, section: "lifestyle" },
  { key: "their_exercise", label: "Exercise", weight: 1, section: "lifestyle" },
];

const SECTION_LABELS: Record<string, string> = {
  basic: "Basic Info",
  location: "Location",
  values: "Values & Beliefs",
  relationship: "Relationship",
  family: "Family",
  lifestyle: "Lifestyle",
};

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ candidate }) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const calculateCompleteness = () => {
    let filledWeight = 0;
    let totalWeight = 0;
    const missingFields: { key: string; label: string; section: string; weight: number }[] = [];

    PROFILE_FIELDS.forEach(field => {
      totalWeight += field.weight;
      const value = (candidate as any)[field.key];
      if (value !== null && value !== undefined && value !== "" && value !== "unknown") {
        filledWeight += field.weight;
      } else {
        missingFields.push(field);
      }
    });

    // Group missing fields by section
    const groupedMissing = missingFields.reduce((acc, field) => {
      if (!acc[field.section]) {
        acc[field.section] = [];
      }
      acc[field.section].push(field);
      return acc;
    }, {} as Record<string, typeof missingFields>);

    return {
      percentage: Math.round((filledWeight / totalWeight) * 100),
      missingFields,
      groupedMissing,
    };
  };

  const { percentage, missingFields, groupedMissing } = calculateCompleteness();

  const getProgressColor = () => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getMessage = () => {
    if (percentage === 100) return "Perfect! Profile is complete";
    if (percentage >= 80) return "Almost there! Add a few more details";
    if (percentage >= 50) return "Add more details for better insights";
    return "Profile needs more info for accurate scoring";
  };

  const handleNavigateToSection = (section: string) => {
    navigate(`/add-candidate?edit=${candidate.id}&section=${section}`);
  };

  const handleCompleteAll = () => {
    // Navigate to the first section with missing fields
    const firstSection = Object.keys(groupedMissing)[0];
    if (firstSection) {
      handleNavigateToSection(firstSection);
    }
  };

  if (percentage === 100) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Profile Complete</span>
          </div>
          <span className="text-sm font-semibold text-green-500">100%</span>
        </div>
        <Progress value={100} className="h-2" indicatorClassName="bg-green-500" />
        <p className="text-xs text-muted-foreground">Perfect! All details are filled in</p>
      </div>
    );
  }

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

      {missingFields.length > 0 && (
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {missingFields.length} field{missingFields.length > 1 ? "s" : ""} remaining
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-primary"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show all
                </>
              )}
            </Button>
          </div>

          {showAll && (
            <div className="space-y-2">
              {Object.entries(groupedMissing).map(([section, fields]) => (
                <div key={section} className="bg-muted/50 rounded-md p-2">
                  <button
                    onClick={() => handleNavigateToSection(section)}
                    className="w-full flex items-center justify-between group hover:bg-muted/80 rounded p-1 -m-1 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-foreground">
                        {SECTION_LABELS[section] || section}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fields.map(f => f.label).join(", ")}
                      </p>
                    </div>
                    <Edit className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="default"
            size="sm"
            className="w-full h-8 text-xs gap-1"
            onClick={handleCompleteAll}
          >
            <Edit className="w-3 h-3" />
            Complete Profile
          </Button>
        </div>
      )}
    </div>
  );
};