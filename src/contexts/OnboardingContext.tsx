import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

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
  
  // Screen 5: Relationship Goals
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
  
  // Screen 15: Safety/Intimacy
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
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  isStepComplete: (step: number) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 16; // 0-15

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
      case 4: return true; // Optional
      case 5: return !!data.relationshipGoal;
      case 6: return !!data.kidsStatus && !!data.kidsDesire;
      case 7: return !!data.religion;
      case 8: return !!data.politics;
      case 9: return !!data.careerStage;
      case 10: return !!data.distancePreference;
      case 11: return (data.attractionImportance ?? 0) > 0;
      case 12: return !!data.communicationStyle;
      case 13: return !!data.attachmentStyle;
      case 14: return (data.dealbreakers?.length ?? 0) > 0;
      case 15: return !!data.intimacyComfort;
      default: return false;
    }
  }, [data]);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        currentStep,
        totalSteps,
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
