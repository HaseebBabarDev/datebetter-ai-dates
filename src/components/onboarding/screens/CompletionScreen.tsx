import React from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Sparkles, MessageCircle, HelpCircle } from "lucide-react";

// Fields that can have "unsure" or "prefer not to say" values
const UNSURE_TRACKABLE_FIELDS = [
  { key: "relationshipGoal", unsureValues: ["unsure"] },
  { key: "relationshipStructure", unsureValues: ["unsure"] },
  { key: "kidsDesire", unsureValues: ["unsure"] },
  { key: "religion", unsureValues: ["prefer_not_say"] },
  { key: "politics", unsureValues: ["prefer_not_say"] },
  { key: "attachmentStyle", unsureValues: ["unsure"] },
];

const CompletionScreen = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const { user } = useAuth();
  const [saving, setSaving] = React.useState(false);

  // Count how many "unsure" or "prefer not to say" answers
  const unsureCount = UNSURE_TRACKABLE_FIELDS.reduce((count, field) => {
    const value = data[field.key as keyof typeof data];
    if (value && field.unsureValues.includes(value as string)) {
      return count + 1;
    }
    return count;
  }, 0);

  const hasMultipleUnsure = unsureCount >= 2;

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const { error } = await supabase.from("profiles").update({
        name: data.name,
        birth_date: data.birthDate,
        country: data.country,
        city: data.city,
        state: data.state,
        gender_identity: data.genderIdentity as any,
        pronouns: data.pronouns as any,
        custom_pronouns: data.customPronouns,
        height: data.height,
        body_type: data.bodyType,
        sexual_orientation: data.sexualOrientation as any,
        orientation_custom: data.orientationCustom,
        interested_in: data.interestedIn,
        match_specificity: data.matchSpecificity,
        is_trans: data.isTrans,
        transition_stage: data.transitionStage,
        hormone_profile: data.hormoneProfile,
        lgbtq_connection: data.lgbtqConnection,
        track_cycle: data.trackCycle,
        last_period_date: data.lastPeriodDate,
        cycle_length: data.cycleLength,
        cycle_regularity: data.cycleRegularity as any,
        dating_motivation: data.datingMotivation,
        relationship_status: data.relationshipStatus as any,
        relationship_goal: data.relationshipGoal as any,
        relationship_structure: data.relationshipStructure as any,
        monogamy_required: data.monogamyRequired,
        exclusivity_before_intimacy: data.exclusivityBeforeIntimacy,
        kids_status: data.kidsStatus as any,
        kids_desire: data.kidsDesire as any,
        kids_timeline: data.kidsTimeline,
        marriage_before_kids: data.marriageBeforeKids,
        open_to_single_parenthood: data.openToSingleParenthood,
        religion: data.religion as any,
        religion_practice_level: data.religionPracticeLevel,
        faith_importance: data.faithImportance,
        faith_requirements: data.faithRequirements,
        politics: data.politics as any,
        politics_importance: data.politicsImportance,
        political_dealbreakers: data.politicalDealbreakers,
        education_level: data.educationLevel,
        education_matters: data.educationMatters,
        career_stage: data.careerStage,
        ambition_level: data.ambitionLevel,
        financial_importance: data.financialImportance,
        income_range: data.incomeRange,
        preferred_education_level: data.preferredEducationLevel,
        preferred_income_range: data.preferredIncomeRange,
        distance_preference: data.distancePreference,
        living_situation: data.livingSituation,
        open_to_moving: data.openToMoving,
        social_style: data.socialStyle as any,
        work_schedule_type: data.workScheduleType,
        flexibility_rating: data.flexibilityRating,
        activity_level: data.activityLevel,
        schedule_flexibility: data.scheduleFlexibility,
        attraction_importance: data.attractionImportance,
        preferred_age_min: data.preferredAgeMin,
        preferred_age_max: data.preferredAgeMax,
        height_preference: data.heightPreference,
        chemistry_factors: data.chemistryFactors,
        communication_style: data.communicationStyle as any,
        response_time_preference: data.responseTimePreference,
        conflict_style: data.conflictStyle,
        love_languages: data.loveLanguages,
        attachment_style: data.attachmentStyle as any,
        longest_relationship: data.longestRelationship,
        time_since_last_relationship: data.timeSinceLastRelationship,
        pattern_recognition: data.patternRecognition,
        parent_status: data.parentStatus,
        mother_status: data.motherStatus,
        father_status: data.fatherStatus,
        full_siblings: data.fullSiblings,
        half_siblings: data.halfSiblings,
        parents_relationship_dynamic: data.parentsRelationshipDynamic,
        felt_loved_as_child: data.feltLovedAsChild,
        parent_wound_types: data.parentWoundTypes,
        childhood_trauma_types: data.childhoodTraumaTypes,
        socioeconomic_background: data.socioeconomicBackground,
        family_stability: data.familyStability,
        healthy_relationship_models: data.healthyRelationshipModels,
        generational_patterns: data.generationalPatterns,
        dealbreakers: data.dealbreakers,
        safety_priorities: data.safetyPriorities,
        boundary_strength: data.boundaryStrength,
        is_neurodivergent: data.isNeurodivergent,
        neurodivergence_types: data.neurodivergenceTypes,
        mental_health_openness: data.mentalHealthOpenness,
        mental_health_importance: data.mentalHealthImportance,
        in_therapy: data.inTherapy,
        intimacy_comfort: data.intimacyComfort,
        safety_requirements: data.safetyRequirements,
        post_intimacy_tendency: data.postIntimacyTendency,
        red_flag_sensitivity: data.redFlagSensitivity,
        love_bombing_sensitivity: data.loveBombingSensitivity,
        behavioral_monitoring: data.behavioralMonitoring,
        devi_style: data.deviStyle,
        onboarding_completed: true,
        onboarding_step: 21,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Profile saved! Welcome to dateBetter 💜" });
      navigate("/dashboard");
    } catch (e) {
      toast({ title: "Error saving profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChatWithDevi = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const { error } = await supabase.from("profiles").update({
        name: data.name,
        birth_date: data.birthDate,
        country: data.country,
        city: data.city,
        state: data.state,
        gender_identity: data.genderIdentity as any,
        pronouns: data.pronouns as any,
        custom_pronouns: data.customPronouns,
        height: data.height,
        body_type: data.bodyType,
        sexual_orientation: data.sexualOrientation as any,
        orientation_custom: data.orientationCustom,
        interested_in: data.interestedIn,
        match_specificity: data.matchSpecificity,
        is_trans: data.isTrans,
        transition_stage: data.transitionStage,
        hormone_profile: data.hormoneProfile,
        lgbtq_connection: data.lgbtqConnection,
        track_cycle: data.trackCycle,
        last_period_date: data.lastPeriodDate,
        cycle_length: data.cycleLength,
        cycle_regularity: data.cycleRegularity as any,
        dating_motivation: data.datingMotivation,
        relationship_status: data.relationshipStatus as any,
        relationship_goal: data.relationshipGoal as any,
        relationship_structure: data.relationshipStructure as any,
        monogamy_required: data.monogamyRequired,
        exclusivity_before_intimacy: data.exclusivityBeforeIntimacy,
        kids_status: data.kidsStatus as any,
        kids_desire: data.kidsDesire as any,
        kids_timeline: data.kidsTimeline,
        marriage_before_kids: data.marriageBeforeKids,
        open_to_single_parenthood: data.openToSingleParenthood,
        religion: data.religion as any,
        religion_practice_level: data.religionPracticeLevel,
        faith_importance: data.faithImportance,
        faith_requirements: data.faithRequirements,
        politics: data.politics as any,
        politics_importance: data.politicsImportance,
        political_dealbreakers: data.politicalDealbreakers,
        education_level: data.educationLevel,
        education_matters: data.educationMatters,
        career_stage: data.careerStage,
        ambition_level: data.ambitionLevel,
        financial_importance: data.financialImportance,
        income_range: data.incomeRange,
        preferred_education_level: data.preferredEducationLevel,
        preferred_income_range: data.preferredIncomeRange,
        distance_preference: data.distancePreference,
        living_situation: data.livingSituation,
        open_to_moving: data.openToMoving,
        social_style: data.socialStyle as any,
        work_schedule_type: data.workScheduleType,
        flexibility_rating: data.flexibilityRating,
        activity_level: data.activityLevel,
        schedule_flexibility: data.scheduleFlexibility,
        attraction_importance: data.attractionImportance,
        preferred_age_min: data.preferredAgeMin,
        preferred_age_max: data.preferredAgeMax,
        height_preference: data.heightPreference,
        chemistry_factors: data.chemistryFactors,
        communication_style: data.communicationStyle as any,
        response_time_preference: data.responseTimePreference,
        conflict_style: data.conflictStyle,
        love_languages: data.loveLanguages,
        attachment_style: data.attachmentStyle as any,
        longest_relationship: data.longestRelationship,
        time_since_last_relationship: data.timeSinceLastRelationship,
        pattern_recognition: data.patternRecognition,
        parent_status: data.parentStatus,
        mother_status: data.motherStatus,
        father_status: data.fatherStatus,
        full_siblings: data.fullSiblings,
        half_siblings: data.halfSiblings,
        parents_relationship_dynamic: data.parentsRelationshipDynamic,
        felt_loved_as_child: data.feltLovedAsChild,
        parent_wound_types: data.parentWoundTypes,
        childhood_trauma_types: data.childhoodTraumaTypes,
        socioeconomic_background: data.socioeconomicBackground,
        family_stability: data.familyStability,
        healthy_relationship_models: data.healthyRelationshipModels,
        generational_patterns: data.generationalPatterns,
        dealbreakers: data.dealbreakers,
        safety_priorities: data.safetyPriorities,
        boundary_strength: data.boundaryStrength,
        is_neurodivergent: data.isNeurodivergent,
        neurodivergence_types: data.neurodivergenceTypes,
        mental_health_openness: data.mentalHealthOpenness,
        mental_health_importance: data.mentalHealthImportance,
        in_therapy: data.inTherapy,
        intimacy_comfort: data.intimacyComfort,
        safety_requirements: data.safetyRequirements,
        post_intimacy_tendency: data.postIntimacyTendency,
        red_flag_sensitivity: data.redFlagSensitivity,
        love_bombing_sensitivity: data.loveBombingSensitivity,
        behavioral_monitoring: data.behavioralMonitoring,
        devi_style: data.deviStyle,
        onboarding_completed: true,
        onboarding_step: 21,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Profile saved! Let's figure things out together 💜" });
      navigate("/devi");
    } catch (e) {
      toast({ title: "Error saving profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-very-light to-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-success-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2">You're All Set!</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">Your personalized dating assistant is ready to help you find better matches.</p>
      
      {hasMultipleUnsure && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 max-w-sm">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground mb-1">
                Still figuring some things out?
              </p>
              <p className="text-xs text-muted-foreground">
                That's totally okay! D.E.V.I. can help you explore your preferences and values through conversation.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3 w-full max-w-xs">
        {hasMultipleUnsure ? (
          <>
            <Button onClick={handleChatWithDevi} disabled={saving} size="lg" className="w-full gap-2">
              <MessageCircle className="w-5 h-5" />
              {saving ? "Saving..." : "Chat with D.E.V.I. First"}
            </Button>
            <Button onClick={handleComplete} disabled={saving} variant="outline" size="lg" className="w-full gap-2">
              <Sparkles className="w-5 h-5" />
              {saving ? "Saving..." : "Go to Dashboard"}
            </Button>
          </>
        ) : (
          <Button onClick={handleComplete} disabled={saving} size="lg" className="w-full gap-2">
            <Sparkles className="w-5 h-5" />
            {saving ? "Saving..." : "Start Dating Smarter"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CompletionScreen;
