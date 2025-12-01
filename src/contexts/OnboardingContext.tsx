import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingData {
  // Screen 0: Welcome & Age
  birthDate?: string;
  ageConfirmed?: boolean;
  
  // Screen 1: Account (handled by auth)
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  marketingOptIn?: boolean;
  
  // Screen 2: Basic Identity
  name?: string;
  country?: string;
  city?: string;
  state?: string;
  genderIdentity?: string;
  pronouns?: string;
  customPronouns?: string;
  height?: string;
  bodyType?: string;
  
  // Screen 3: Dating Preferences
  sexualOrientation?: string;
  orientationCustom?: string;
  interestedIn?: string[];
  matchSpecificity?: number;
  
  // Screen 4: Hormone/Cycle
  isTrans?: boolean;
  transitionStage?: string;
  hormoneProfile?: string;
  lgbtqConnection?: number;
  trackCycle?: boolean;
  lastPeriodDate?: string;
  cycleLength?: number;
  cycleRegularity?: string;
  
  // Screen 5: Dating Motivation (NEW)
  datingMotivation?: string[];
  
  // Screen 6: Relationship Goals
  relationshipStatus?: string;
  relationshipGoal?: string;
  relationshipStructure?: string;
  monogamyRequired?: boolean;
  exclusivityBeforeIntimacy?: boolean;
  relationshipPriorities?: string[];
  
  // Screen 6: Kids & Family
  kidsStatus?: string;
  kidsDesire?: string;
  kidsTimeline?: string;
  marriageBeforeKids?: boolean;
  openToSingleParenthood?: boolean;
  familyPriorities?: string[];
  
  // Screen 7: Faith
  religion?: string;
  religionPracticeLevel?: string;
  faithImportance?: number;
  faithRequirements?: string[];
  
  // Screen 8: Politics
  politics?: string;
  politicsImportance?: number;
  politicalDealbreakers?: string[];
  
  // Screen 9: Career
  educationLevel?: string;
  educationMatters?: boolean;
  careerStage?: string;
  ambitionLevel?: number;
  financialImportance?: number;
  incomeRange?: string;
  preferredEducationLevel?: string;
  preferredIncomeRange?: string;
  
  // Screen 10: Lifestyle
  distancePreference?: string;
  livingSituation?: string;
  openToMoving?: boolean;
  socialStyle?: string;
  workScheduleType?: string;
  flexibilityRating?: number;
  activityLevel?: string;
  scheduleFlexibility?: string;
  
  // Screen 11: Physical Preferences
  attractionImportance?: number;
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  heightPreference?: string;
  chemistryFactors?: string[];
  
  // Screen 12: Communication
  communicationStyle?: string;
  responseTimePreference?: number;
  conflictStyle?: string;
  loveLanguages?: string[];
  
  // Screen 13: Past Patterns
  attachmentStyle?: string;
  longestRelationship?: string;
  timeSinceLastRelationship?: string;
  patternRecognition?: string[];
  
  // Screen 14: Boundaries
  dealbreakers?: string[];
  safetyPriorities?: string[];
  boundaryStrength?: number;
  
  // Screen 15: Mental Health & Neurodivergence
  isNeurodivergent?: string;
  neurodivergenceTypes?: string[];
  mentalHealthOpenness?: string;
  mentalHealthImportance?: number;
  inTherapy?: boolean;
  
  // Screen 16: Safety/Intimacy
  intimacyComfort?: string;
  safetyRequirements?: string[];
  postIntimacyTendency?: string;
  redFlagSensitivity?: number;
  loveBombingSensitivity?: number;
  behavioralMonitoring?: number;
}

interface OnboardingContextType {
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  loading: boolean;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  isStepComplete: (step: number) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<OnboardingData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const totalSteps = 19; // 0-18 (added Dating Motivation screen)

  // Load existing profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          // Map profile data to onboarding data
          setData({
            birthDate: profile.birth_date || undefined,
            name: profile.name || undefined,
            country: profile.country || undefined,
            city: profile.city || undefined,
            state: profile.state || undefined,
            genderIdentity: profile.gender_identity || undefined,
            pronouns: profile.pronouns || undefined,
            customPronouns: profile.custom_pronouns || undefined,
            height: profile.height || undefined,
            bodyType: profile.body_type || undefined,
            sexualOrientation: profile.sexual_orientation || undefined,
            orientationCustom: profile.orientation_custom || undefined,
            interestedIn: profile.interested_in || undefined,
            matchSpecificity: profile.match_specificity || undefined,
            isTrans: profile.is_trans || undefined,
            transitionStage: profile.transition_stage || undefined,
            hormoneProfile: profile.hormone_profile || undefined,
            lgbtqConnection: profile.lgbtq_connection || undefined,
            trackCycle: profile.track_cycle || undefined,
            lastPeriodDate: profile.last_period_date || undefined,
            cycleLength: profile.cycle_length || undefined,
            cycleRegularity: profile.cycle_regularity || undefined,
            relationshipStatus: profile.relationship_status || undefined,
            relationshipGoal: profile.relationship_goal || undefined,
            relationshipStructure: profile.relationship_structure || undefined,
            monogamyRequired: profile.monogamy_required || undefined,
            exclusivityBeforeIntimacy: profile.exclusivity_before_intimacy || undefined,
            kidsStatus: profile.kids_status || undefined,
            kidsDesire: profile.kids_desire || undefined,
            kidsTimeline: profile.kids_timeline || undefined,
            marriageBeforeKids: profile.marriage_before_kids || undefined,
            openToSingleParenthood: profile.open_to_single_parenthood || undefined,
            religion: profile.religion || undefined,
            religionPracticeLevel: profile.religion_practice_level || undefined,
            faithImportance: profile.faith_importance || undefined,
            faithRequirements: profile.faith_requirements as string[] || undefined,
            politics: profile.politics || undefined,
            politicsImportance: profile.politics_importance || undefined,
            politicalDealbreakers: profile.political_dealbreakers as string[] || undefined,
            educationLevel: profile.education_level || undefined,
            educationMatters: profile.education_matters || undefined,
            careerStage: profile.career_stage || undefined,
            ambitionLevel: profile.ambition_level || undefined,
            financialImportance: profile.financial_importance || undefined,
            incomeRange: (profile as any).income_range || undefined,
            preferredEducationLevel: (profile as any).preferred_education_level || undefined,
            preferredIncomeRange: (profile as any).preferred_income_range || undefined,
            distancePreference: profile.distance_preference || undefined,
            livingSituation: profile.living_situation || undefined,
            openToMoving: profile.open_to_moving || undefined,
            socialStyle: profile.social_style || undefined,
            workScheduleType: profile.work_schedule_type || undefined,
            flexibilityRating: profile.flexibility_rating || undefined,
            activityLevel: profile.activity_level || undefined,
            scheduleFlexibility: profile.schedule_flexibility || undefined,
            attractionImportance: profile.attraction_importance || undefined,
            preferredAgeMin: profile.preferred_age_min || undefined,
            preferredAgeMax: profile.preferred_age_max || undefined,
            heightPreference: profile.height_preference || undefined,
            chemistryFactors: profile.chemistry_factors as string[] || undefined,
            communicationStyle: profile.communication_style || undefined,
            responseTimePreference: profile.response_time_preference || undefined,
            conflictStyle: profile.conflict_style || undefined,
            loveLanguages: profile.love_languages as string[] || undefined,
            attachmentStyle: profile.attachment_style || undefined,
            longestRelationship: profile.longest_relationship || undefined,
            timeSinceLastRelationship: profile.time_since_last_relationship || undefined,
            patternRecognition: profile.pattern_recognition as string[] || undefined,
            dealbreakers: profile.dealbreakers as string[] || undefined,
            safetyPriorities: profile.safety_priorities as string[] || undefined,
            boundaryStrength: profile.boundary_strength || undefined,
            isNeurodivergent: profile.is_neurodivergent || undefined,
            neurodivergenceTypes: profile.neurodivergence_types as string[] || undefined,
            mentalHealthOpenness: profile.mental_health_openness || undefined,
            mentalHealthImportance: profile.mental_health_importance || undefined,
            inTherapy: profile.in_therapy || undefined,
            intimacyComfort: profile.intimacy_comfort || undefined,
            safetyRequirements: profile.safety_requirements as string[] || undefined,
            postIntimacyTendency: profile.post_intimacy_tendency || undefined,
            redFlagSensitivity: profile.red_flag_sensitivity || undefined,
            loveBombingSensitivity: profile.love_bombing_sensitivity || undefined,
            behavioralMonitoring: profile.behavioral_monitoring || undefined,
            datingMotivation: (profile as any).dating_motivation as string[] || undefined,
          });

          // Resume from saved step
          if (profile.onboarding_step && profile.onboarding_step > 0) {
            setCurrentStep(profile.onboarding_step);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  // Save progress to database
  const saveProgress = useCallback(async (stepNum: number) => {
    if (!user) return;
    
    try {
      await supabase.from("profiles").update({
        onboarding_step: stepNum,
        // Save all current data
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
      }).eq("user_id", user.id);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [user, data]);

  const nextStep = useCallback(() => {
    const newStep = Math.min(currentStep + 1, totalSteps - 1);
    setCurrentStep(newStep);
    saveProgress(newStep);
  }, [currentStep, totalSteps, saveProgress]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.min(Math.max(step, 0), totalSteps - 1));
  }, [totalSteps]);

  // Step validation - matches Setup.tsx screens array order:
  // 0: WelcomeScreen, 1: BasicIdentityScreen, 2: DatingPreferencesScreen, 
  // 3: HormoneCycleScreen, 4: DatingMotivationScreen, 5: RelationshipGoalsScreen,
  // 6: KidsFamilyScreen, 7: FaithValuesScreen, 8: PoliticsScreen, 9: CareerScreen,
  // 10: LocationScheduleScreen, 11: SocialActivityScreen, 12: PhysicalPreferencesScreen,
  // 13: CommunicationScreen, 14: PastPatternsScreen, 15: BoundariesScreen,
  // 16: MentalHealthScreen, 17: SafetyIntimacyScreen, 18: CompletionScreen
  const isStepComplete = useCallback((step: number): boolean => {
    switch (step) {
      case 0: return !!data.birthDate && !!data.ageConfirmed; // WelcomeScreen
      case 1: return !!data.name && !!data.genderIdentity; // BasicIdentityScreen
      case 2: return !!data.sexualOrientation && (data.interestedIn?.length ?? 0) > 0; // DatingPreferencesScreen
      case 3: return true; // HormoneCycleScreen - optional
      case 4: return (data.datingMotivation?.length ?? 0) > 0; // DatingMotivationScreen
      case 5: return !!data.relationshipGoal; // RelationshipGoalsScreen
      case 6: return !!data.kidsStatus && !!data.kidsDesire; // KidsFamilyScreen
      case 7: return !!data.religion; // FaithValuesScreen
      case 8: return !!data.politics; // PoliticsScreen
      case 9: return !!data.careerStage; // CareerScreen
      case 10: return !!data.distancePreference; // LocationScheduleScreen
      case 11: return true; // SocialActivityScreen - optional
      case 12: return (data.attractionImportance ?? 0) > 0; // PhysicalPreferencesScreen
      case 13: return !!data.communicationStyle; // CommunicationScreen
      case 14: return !!data.attachmentStyle; // PastPatternsScreen
      case 15: return (data.dealbreakers?.length ?? 0) > 0; // BoundariesScreen
      case 16: return true; // MentalHealthScreen - optional
      case 17: return !!data.intimacyComfort; // SafetyIntimacyScreen
      case 18: return true; // CompletionScreen
      default: return false;
    }
  }, [data]);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        currentStep,
        totalSteps,
        loading,
        updateData,
        nextStep,
        prevStep,
        goToStep,
        isStepComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
};
