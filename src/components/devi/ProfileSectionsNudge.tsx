import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, Users, ArrowRight, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface ProfileSectionsNudgeProps {
  profile: Profile | null;
  onDismiss?: () => void;
}

// Check if family upbringing section is complete
const isFamilyComplete = (profile: Profile | null): boolean => {
  if (!profile) return false;
  // Core required fields from FamilyUpbringingScreen
  return !!(profile.parents_relationship_dynamic && profile.felt_loved_as_child);
};

// Check if relationship trauma section has any data
const isRelationshipTraumaComplete = (profile: Profile | null): boolean => {
  if (!profile) return false;
  // Check if user has added any past relationships or notes
  const traumas = profile.past_relationship_traumas as unknown[];
  return (Array.isArray(traumas) && traumas.length > 0) || 
         !!(profile.relationship_trauma_notes && profile.relationship_trauma_notes.trim().length > 0);
};

export const ProfileSectionsNudge: React.FC<ProfileSectionsNudgeProps> = ({ 
  profile, 
  onDismiss 
}) => {
  const navigate = useNavigate();
  
  const familyComplete = isFamilyComplete(profile);
  const relationshipComplete = isRelationshipTraumaComplete(profile);
  
  // Don't show if both sections are complete
  if (familyComplete && relationshipComplete) {
    return null;
  }

  const missingSections: string[] = [];
  if (!familyComplete) missingSections.push("Family & Upbringing");
  if (!relationshipComplete) missingSections.push("Past Relationships");

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 space-y-3 relative">
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
      
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold text-sm">Get More Personalized Advice</span>
      </div>
      
      <p className="text-sm text-muted-foreground pr-6">
        D.E.V.I. can give you deeper insights when she understands your background. 
        Complete your {missingSections.join(" and ")} section{missingSections.length > 1 ? "s" : ""} for more personalized guidance.
      </p>

      <div className="flex flex-col gap-2">
        {!familyComplete && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 justify-between bg-background/50 hover:bg-background"
            onClick={() => navigate("/settings?tab=preferences&section=family")}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Family & Upbringing
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
        {!relationshipComplete && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 justify-between bg-background/50 hover:bg-background"
            onClick={() => navigate("/settings?tab=preferences&section=past_relationships")}
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Past Relationships
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
