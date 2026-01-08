import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Sparkles, User, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Candidate = Tables<"candidates">;

interface ProfileCompletenessNudgeProps {
  candidate: Candidate;
}

// Core field that determines if onboarding is complete
const USER_PROFILE_FIELDS = [
  { key: "onboarding_completed", weight: 10 },
];

const CANDIDATE_PROFILE_FIELDS = [
  { key: "age", weight: 2 },
  { key: "their_religion", weight: 2 },
  { key: "their_politics", weight: 2 },
  { key: "their_relationship_goal", weight: 2 },
  { key: "their_kids_desire", weight: 2 },
  { key: "their_attachment_style", weight: 2 },
  { key: "gender_identity", weight: 1 },
  { key: "country", weight: 1 },
  { key: "city", weight: 1 },
  { key: "their_schedule_flexibility", weight: 1 },
  { key: "their_career_stage", weight: 1 },
  { key: "their_education_level", weight: 1 },
  { key: "their_social_style", weight: 1 },
];

const calculateCompleteness = (data: Record<string, unknown>, fields: { key: string; weight: number }[]) => {
  let filledWeight = 0;
  let totalWeight = 0;
  
  fields.forEach(field => {
    totalWeight += field.weight;
    const value = data[field.key];
    if (value !== null && value !== undefined && value !== "") {
      filledWeight += field.weight;
    }
  });
  
  return Math.round((filledWeight / totalWeight) * 100);
};

export const ProfileCompletenessNudge: React.FC<ProfileCompletenessNudgeProps> = ({ candidate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userProfileCompleteness, setUserProfileCompleteness] = useState<number>(100);
  const [loading, setLoading] = useState(true);

  const candidateCompleteness = calculateCompleteness(candidate as unknown as Record<string, unknown>, CANDIDATE_PROFILE_FIELDS);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setUserProfileCompleteness(calculateCompleteness(data as unknown as Record<string, unknown>, USER_PROFILE_FIELDS));
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [user]);

  // Both profiles are complete enough
  if (loading || (userProfileCompleteness >= 70 && candidateCompleteness >= 70)) {
    return null;
  }

  const bothIncomplete = userProfileCompleteness < 70 && candidateCompleteness < 70;
  const onlyUserIncomplete = userProfileCompleteness < 70 && candidateCompleteness >= 70;
  const onlyCandidateIncomplete = candidateCompleteness < 70 && userProfileCompleteness >= 70;

  return (
    <div className="bg-[image:var(--gradient-hero)] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-primary-foreground">
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">Get More Accurate Insights</span>
      </div>
      
      <p className="text-sm text-primary-foreground/90">
        {bothIncomplete && (
          <>Complete both your profile and {candidate.nickname}'s profile for in-depth compatibility analysis and personalized advice.</>
        )}
        {onlyUserIncomplete && (
          <>Complete your profile to unlock better compatibility scoring and personalized advice.</>
        )}
        {onlyCandidateIncomplete && (
          <>Add more details about {candidate.nickname} for deeper insights and more accurate scoring.</>
        )}
      </p>

      <div className="flex flex-col gap-2">
        {(bothIncomplete || onlyUserIncomplete) && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2 bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
            onClick={() => navigate("/settings", { state: { tab: "profile" } })}
          >
            <User className="w-4 h-4" />
            Your Profile ({userProfileCompleteness}%)
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        )}
        {(bothIncomplete || onlyCandidateIncomplete) && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2 bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
            onClick={() => navigate(`/add-candidate?edit=${candidate.id}`)}
          >
            <Users className="w-4 h-4" />
            {candidate.nickname}'s Profile ({candidateCompleteness}%)
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        )}
      </div>
    </div>
  );
};
