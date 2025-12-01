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
  
  // Screen 6: Kids & Family
  kidsStatus?: string;
  kidsDesire?: string;
  kidsTimeline?: string;
  marriageBeforeKids?: boolean;
  openToSingleParenthood?: boolean;
  
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

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.min(Math.max(step, 0), totalSteps - 1));
  }, [totalSteps]);

  const isStepComplete = useCallback((step: number): boolean => {
    switch (step) {
      case 0: return !!data.birthDate && !!data.ageConfirmed;
      case 1: return !!data.termsAccepted && !!data.privacyAccepted;
      case 2: return !!data.name && !!data.genderIdentity;
      case 3: return !!data.sexualOrientation && (data.interestedIn?.length ?? 0) > 0;
      case 4: return true; // Hormone/Cycle optional
      case 5: return (data.datingMotivation?.length ?? 0) > 0; // Dating Motivation
      case 6: return !!data.relationshipGoal;
      case 7: return !!data.kidsStatus && !!data.kidsDesire;
      case 8: return !!data.religion;
      case 9: return !!data.politics;
      case 10: return !!data.careerStage;
      case 11: return !!data.distancePreference;
      case 12: return true; // Social/Activity optional
      case 13: return (data.attractionImportance ?? 0) > 0;
      case 14: return !!data.communicationStyle;
      case 15: return !!data.attachmentStyle;
      case 16: return (data.dealbreakers?.length ?? 0) > 0;
      case 17: return true; // Mental health optional
      case 18: return !!data.intimacyComfort;
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
