import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingData {
  // Quick start mode flag
  quickStartMode?: boolean;
  
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
  
  // Screen 14: Family & Upbringing
  parentStatus?: string;
  motherStatus?: string;
  fatherStatus?: string;
  fullSiblings?: number;
  halfSiblings?: number;
  parentsRelationshipDynamic?: string;
  parentsConflictStyle?: string;
  childoodLoveExpression?: string;
  feltLovedAsChild?: string;
  childhoodEmotionalNeedsMet?: string;
  parentWoundTypes?: string[];
  childhoodTraumaTypes?: string[];
  abuseHistory?: string[];
  socioeconomicBackground?: string;
  familyStability?: string;
  caregiverConsistency?: string;
  healthyRelationshipModels?: boolean;
  generationalPatterns?: string[];
  familyUpbringingNotes?: string;
  
  // Screen 16: Relationship Trauma
  pastRelationshipTraumas?: any[]; // Array of PastRelationship objects
  relationshipTraumaNotes?: string;
  
  // Screen 17: Healing Assessment
  exContactStatus?: string;
  overExLevel?: number;
  attachmentToPast?: number;
  
  // Screen 18: Boundaries
  dealbreakers?: string[];
  safetyPriorities?: string[];
  boundaryStrength?: number;
  
  // Screen 16: Mental Health & Neurodivergence
  isNeurodivergent?: string;
  neurodivergenceTypes?: string[];
  mentalHealthOpenness?: string;
  mentalHealthImportance?: number;
  inTherapy?: boolean;
  
  // Screen 17: Safety/Intimacy
  intimacyComfort?: string;
  safetyRequirements?: string[];
  postIntimacyTendency?: string;
  redFlagSensitivity?: number;
  loveBombingSensitivity?: number;
  behavioralMonitoring?: number;
  
  // Screen 18: Devi Style
  deviStyle?: string;
  
  // Zodiac Mode (Entertainment Only)
  zodiacSign?: string;
  zodiacModeEnabled?: boolean;
  
  // Male Dating Style Assessment
  datingHonestyIntent?: string;
  relationshipBlockers?: string[];
  relationshipBlockerTimeline?: string;
  attachmentSecurityLevel?: string;
  relationshipMotivation?: string;
  jealousyTriggers?: Record<string, any>;
  datingSkillChallenges?: string[];
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
  const dataRef = useRef<OnboardingData>(data);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const totalSteps = 25; // Must match Setup.tsx screens array (0-24)

  // Keep ref in sync with state
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

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
            parentStatus: (profile as any).parent_status || undefined,
            motherStatus: (profile as any).mother_status || undefined,
            fatherStatus: (profile as any).father_status || undefined,
            fullSiblings: (profile as any).full_siblings ?? undefined,
            halfSiblings: (profile as any).half_siblings ?? undefined,
            parentsRelationshipDynamic: (profile as any).parents_relationship_dynamic || undefined,
            feltLovedAsChild: (profile as any).felt_loved_as_child || undefined,
            parentWoundTypes: (profile as any).parent_wound_types as string[] || undefined,
            childhoodTraumaTypes: (profile as any).childhood_trauma_types as string[] || undefined,
            socioeconomicBackground: (profile as any).socioeconomic_background || undefined,
            familyStability: (profile as any).family_stability || undefined,
            healthyRelationshipModels: (profile as any).healthy_relationship_models ?? undefined,
            generationalPatterns: (profile as any).generational_patterns as string[] || undefined,
            familyUpbringingNotes: (profile as any).family_upbringing_notes || undefined,
            pastRelationshipTraumas: (profile as any).past_relationship_traumas || undefined,
            relationshipTraumaNotes: (profile as any).relationship_trauma_notes || undefined,
            exContactStatus: (profile as any).ex_contact_status || undefined,
            overExLevel: (profile as any).over_ex_level ?? undefined,
            attachmentToPast: (profile as any).attachment_to_past ?? undefined,
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
            deviStyle: (profile as any).devi_style || undefined,
            zodiacSign: profile.zodiac_sign || undefined,
            zodiacModeEnabled: profile.zodiac_mode_enabled ?? undefined,
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
    setData(prev => {
      const newData = { ...prev, ...updates };
      dataRef.current = newData; // Update ref immediately for saveProgress
      return newData;
    });
  }, []);

  // Save progress to database
  const saveProgress = useCallback(async (stepNum: number) => {
    if (!user) return;
    
    const currentData = dataRef.current;
    
    try {
      await supabase.from("profiles").update({
        onboarding_step: stepNum,
        // Save all current data using ref for latest values
        name: currentData.name,
        birth_date: currentData.birthDate,
        country: currentData.country,
        city: currentData.city,
        state: currentData.state,
        gender_identity: currentData.genderIdentity as any,
        pronouns: currentData.pronouns as any,
        custom_pronouns: currentData.customPronouns,
        height: currentData.height,
        body_type: currentData.bodyType,
        sexual_orientation: currentData.sexualOrientation as any,
        orientation_custom: currentData.orientationCustom,
        interested_in: currentData.interestedIn,
        match_specificity: currentData.matchSpecificity,
        is_trans: currentData.isTrans,
        transition_stage: currentData.transitionStage,
        hormone_profile: currentData.hormoneProfile,
        lgbtq_connection: currentData.lgbtqConnection,
        track_cycle: currentData.trackCycle,
        last_period_date: currentData.lastPeriodDate,
        cycle_length: currentData.cycleLength,
        cycle_regularity: currentData.cycleRegularity as any,
        dating_motivation: currentData.datingMotivation,
        relationship_status: currentData.relationshipStatus as any,
        relationship_goal: currentData.relationshipGoal as any,
        relationship_structure: currentData.relationshipStructure as any,
        monogamy_required: currentData.monogamyRequired,
        exclusivity_before_intimacy: currentData.exclusivityBeforeIntimacy,
        kids_status: currentData.kidsStatus as any,
        kids_desire: currentData.kidsDesire as any,
        kids_timeline: currentData.kidsTimeline,
        marriage_before_kids: currentData.marriageBeforeKids,
        open_to_single_parenthood: currentData.openToSingleParenthood,
        religion: currentData.religion as any,
        religion_practice_level: currentData.religionPracticeLevel,
        faith_importance: currentData.faithImportance,
        faith_requirements: currentData.faithRequirements,
        politics: currentData.politics as any,
        politics_importance: currentData.politicsImportance,
        political_dealbreakers: currentData.politicalDealbreakers,
        education_level: currentData.educationLevel,
        education_matters: currentData.educationMatters,
        career_stage: currentData.careerStage,
        ambition_level: currentData.ambitionLevel,
        financial_importance: currentData.financialImportance,
        income_range: currentData.incomeRange,
        preferred_education_level: currentData.preferredEducationLevel,
        preferred_income_range: currentData.preferredIncomeRange,
        distance_preference: currentData.distancePreference,
        living_situation: currentData.livingSituation,
        open_to_moving: currentData.openToMoving,
        social_style: currentData.socialStyle as any,
        work_schedule_type: currentData.workScheduleType,
        flexibility_rating: currentData.flexibilityRating,
        activity_level: currentData.activityLevel,
        schedule_flexibility: currentData.scheduleFlexibility,
        attraction_importance: currentData.attractionImportance,
        preferred_age_min: currentData.preferredAgeMin,
        preferred_age_max: currentData.preferredAgeMax,
        height_preference: currentData.heightPreference,
        chemistry_factors: currentData.chemistryFactors,
        communication_style: currentData.communicationStyle as any,
        response_time_preference: currentData.responseTimePreference,
        conflict_style: currentData.conflictStyle,
        love_languages: currentData.loveLanguages,
        attachment_style: currentData.attachmentStyle as any,
        longest_relationship: currentData.longestRelationship,
        time_since_last_relationship: currentData.timeSinceLastRelationship,
        pattern_recognition: currentData.patternRecognition,
        parent_status: currentData.parentStatus,
        mother_status: currentData.motherStatus,
        father_status: currentData.fatherStatus,
        full_siblings: currentData.fullSiblings,
        half_siblings: currentData.halfSiblings,
        parents_relationship_dynamic: currentData.parentsRelationshipDynamic,
        felt_loved_as_child: currentData.feltLovedAsChild,
        parent_wound_types: currentData.parentWoundTypes,
        childhood_trauma_types: currentData.childhoodTraumaTypes,
        socioeconomic_background: currentData.socioeconomicBackground,
        family_stability: currentData.familyStability,
        healthy_relationship_models: currentData.healthyRelationshipModels,
        generational_patterns: currentData.generationalPatterns,
        family_upbringing_notes: currentData.familyUpbringingNotes,
        past_relationship_traumas: currentData.pastRelationshipTraumas,
        relationship_trauma_notes: currentData.relationshipTraumaNotes,
        ex_contact_status: currentData.exContactStatus,
        over_ex_level: currentData.overExLevel,
        attachment_to_past: currentData.attachmentToPast,
        dealbreakers: currentData.dealbreakers,
        safety_priorities: currentData.safetyPriorities,
        boundary_strength: currentData.boundaryStrength,
        is_neurodivergent: currentData.isNeurodivergent,
        neurodivergence_types: currentData.neurodivergenceTypes,
        mental_health_openness: currentData.mentalHealthOpenness,
        mental_health_importance: currentData.mentalHealthImportance,
        in_therapy: currentData.inTherapy,
        intimacy_comfort: currentData.intimacyComfort,
        safety_requirements: currentData.safetyRequirements,
        post_intimacy_tendency: currentData.postIntimacyTendency,
        red_flag_sensitivity: currentData.redFlagSensitivity,
        love_bombing_sensitivity: currentData.loveBombingSensitivity,
        behavioral_monitoring: currentData.behavioralMonitoring,
        devi_style: currentData.deviStyle,
        zodiac_sign: currentData.zodiacSign,
        zodiac_mode_enabled: currentData.zodiacModeEnabled,
        // Male Dating Style Assessment fields
        dating_honesty_intent: currentData.datingHonestyIntent,
        relationship_blockers: currentData.relationshipBlockers,
        relationship_blocker_timeline: currentData.relationshipBlockerTimeline,
        attachment_security_level: currentData.attachmentSecurityLevel,
        relationship_motivation: currentData.relationshipMotivation,
        jealousy_triggers: currentData.jealousyTriggers,
        dating_skill_challenges: currentData.datingSkillChallenges,
      } as any).eq("user_id", user.id);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [user]);

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
  // 13: CommunicationScreen, 14: PastPatternsScreen, 15: PersonalSectionIntroScreen,
  // 16: RelationshipTraumaScreen, 17: HealingAssessmentScreen, 18: FamilyUpbringingScreen, 
  // 19: BoundariesScreen, 20: MentalHealthScreen, 21: SafetyIntimacyScreen, 
  // 22: DeviStyleScreen, 23: CompletionScreen
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
      case 15: return true; // PersonalSectionIntroScreen - acknowledgment only
      case 16: return true; // RelationshipTraumaScreen - optional
      case 17: return true; // HealingAssessmentScreen - optional
      case 18: return !!data.parentsRelationshipDynamic && !!data.feltLovedAsChild; // FamilyUpbringingScreen
      case 19: return (data.dealbreakers?.length ?? 0) > 0; // BoundariesScreen
      case 20: return true; // MentalHealthScreen - optional
      case 21: return !!data.intimacyComfort; // SafetyIntimacyScreen
      case 22: return true; // DeviStyleScreen - optional
      case 23: return true; // CompletionScreen
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
