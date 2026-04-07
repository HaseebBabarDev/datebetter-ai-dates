import React, { useEffect, useState, useCallback, useRef } from "react";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import EngagementInterstitial, { interstitials } from "@/components/onboarding/EngagementInterstitial";
import OnboardingChoiceScreen from "@/components/onboarding/screens/OnboardingChoiceScreen";

// Import all screens
import WelcomeScreen from "@/components/onboarding/screens/WelcomeScreen";
import AppearanceScreen from "@/components/onboarding/screens/AppearanceScreen";
import QuickStartScreen from "@/components/onboarding/screens/QuickStartScreen";
import BasicIdentityScreen from "@/components/onboarding/screens/BasicIdentityScreen";
import DatingPreferencesScreen from "@/components/onboarding/screens/DatingPreferencesScreen";
import HormoneCycleScreen from "@/components/onboarding/screens/HormoneCycleScreen";
import DatingMotivationScreen from "@/components/onboarding/screens/DatingMotivationScreen";
import DatingStyleScreen from "@/components/onboarding/screens/DatingStyleScreen";
import RelationshipGoalsScreen from "@/components/onboarding/screens/RelationshipGoalsScreen";
import KidsFamilyScreen from "@/components/onboarding/screens/KidsFamilyScreen";
import FaithValuesScreen from "@/components/onboarding/screens/FaithValuesScreen";
import PoliticsScreen from "@/components/onboarding/screens/PoliticsScreen";
import CareerScreen from "@/components/onboarding/screens/CareerScreen";
import LocationScheduleScreen from "@/components/onboarding/screens/LocationScheduleScreen";
import SocialActivityScreen from "@/components/onboarding/screens/SocialActivityScreen";
import PhysicalPreferencesScreen from "@/components/onboarding/screens/PhysicalPreferencesScreen";
import CommunicationScreen from "@/components/onboarding/screens/CommunicationScreen";
import PastPatternsScreen from "@/components/onboarding/screens/PastPatternsScreen";
import PersonalSectionIntroScreen from "@/components/onboarding/screens/PersonalSectionIntroScreen";
import RelationshipTraumaScreen from "@/components/onboarding/screens/RelationshipTraumaScreen";
import HealingAssessmentScreen from "@/components/onboarding/screens/HealingAssessmentScreen";
import FamilyUpbringingScreen from "@/components/onboarding/screens/FamilyUpbringingScreen";
import BoundariesScreen from "@/components/onboarding/screens/BoundariesScreen";
import MentalHealthScreen from "@/components/onboarding/screens/MentalHealthScreen";
import SafetyIntimacyScreen from "@/components/onboarding/screens/SafetyIntimacyScreen";
import DeviStyleScreen from "@/components/onboarding/screens/DeviStyleScreen";
import CompletionScreen from "@/components/onboarding/screens/CompletionScreen";

interface SetupContentProps {
  setupMode?: string | null;
}

const SetupContent = ({ setupMode }: SetupContentProps) => {
  const { currentStep, loading, data, updateData, goToStep } = useOnboarding();
  const [initialized, setInitialized] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const seenInterstitials = useRef<Set<number>>(new Set());
  const prevStepRef = useRef<number>(currentStep);

  // Show interstitial when arriving at a step that has one (only when moving forward)
  useEffect(() => {
    if (!loading && initialized) {
      const movingForward = currentStep > prevStepRef.current;
      prevStepRef.current = currentStep;

      if (
        movingForward &&
        interstitials[currentStep] &&
        !seenInterstitials.current.has(currentStep)
      ) {
        seenInterstitials.current.add(currentStep);
        setShowInterstitial(true);
      }
    }
  }, [currentStep, loading, initialized]);

  const handleInterstitialComplete = useCallback(() => {
    setShowInterstitial(false);
  }, []);

  // Handle setup mode from URL params - skip WelcomeScreen if already chosen
  useEffect(() => {
    if (!loading && !initialized && currentStep === 0 && setupMode) {
      if (setupMode === "quick") {
        updateData({ quickStartMode: true });
        goToStep(1);
      } else if (setupMode === "full") {
        updateData({ quickStartMode: false });
        goToStep(1);
      }
      setInitialized(true);
    } else if (!loading && !initialized) {
      setInitialized(true);
    }
  }, [loading, initialized, currentStep, setupMode, updateData, goToStep]);

  if (loading || (!initialized && setupMode)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Show interstitial overlay
  if (showInterstitial && interstitials[currentStep]) {
    return (
      <EngagementInterstitial
        step={currentStep}
        onComplete={handleInterstitialComplete}
      />
    );
  }

  // If quick start mode is enabled and we're past the appearance screen, show QuickStartScreen
  if (data.quickStartMode && currentStep === 2) {
    return <QuickStartScreen />;
  }

  // Build screens array - DatingStyleScreen is now included for all users
  const screens = [
    <WelcomeScreen key={0} />,
    <AppearanceScreen key={1} />,
    <BasicIdentityScreen key={2} />,
    <DatingPreferencesScreen key={3} />,
    <HormoneCycleScreen key={4} />,
    <DatingMotivationScreen key={5} />,
    <DatingStyleScreen key={6} />,
    <RelationshipGoalsScreen key={7} />,
    <KidsFamilyScreen key={8} />,
    <FaithValuesScreen key={9} />,
    <PoliticsScreen key={10} />,
    <CareerScreen key={11} />,
    <LocationScheduleScreen key={12} />,
    <SocialActivityScreen key={13} />,
    <PhysicalPreferencesScreen key={14} />,
    <CommunicationScreen key={15} />,
    <PastPatternsScreen key={16} />,
    <PersonalSectionIntroScreen key={17} />,
    <RelationshipTraumaScreen key={18} />,
    <HealingAssessmentScreen key={19} />,
    <FamilyUpbringingScreen key={20} />,
    <BoundariesScreen key={21} />,
    <MentalHealthScreen key={22} />,
    <SafetyIntimacyScreen key={23} />,
    <DeviStyleScreen key={24} />,
    <CompletionScreen key={25} />,
  ];

  return screens[currentStep] || screens[0];
};

const Setup = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  const setupMode = searchParams.get("setup");

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single();

        if (profile?.onboarding_completed) {
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (!authLoading && user) {
      checkOnboardingStatus();
    } else if (!authLoading) {
      setCheckingStatus(false);
    }
  }, [user, authLoading, navigate]);

  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <OnboardingProvider>
      <SetupContent setupMode={setupMode} />
    </OnboardingProvider>
  );
};

export default Setup;
