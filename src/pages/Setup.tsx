import React, { useEffect, useState } from "react";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Import all screens
import WelcomeScreen from "@/components/onboarding/screens/WelcomeScreen";
import QuickStartScreen from "@/components/onboarding/screens/QuickStartScreen";
import BasicIdentityScreen from "@/components/onboarding/screens/BasicIdentityScreen";
import DatingPreferencesScreen from "@/components/onboarding/screens/DatingPreferencesScreen";
import HormoneCycleScreen from "@/components/onboarding/screens/HormoneCycleScreen";
import DatingMotivationScreen from "@/components/onboarding/screens/DatingMotivationScreen";
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

  // If quick start mode is enabled and we're past the welcome screen, show QuickStartScreen
  if (data.quickStartMode && currentStep === 1) {
    return <QuickStartScreen />;
  }

  const screens = [
    <WelcomeScreen key={0} />,
    <BasicIdentityScreen key={1} />,
    <DatingPreferencesScreen key={2} />,
    <HormoneCycleScreen key={3} />,
    <DatingMotivationScreen key={4} />,
    <RelationshipGoalsScreen key={5} />,
    <KidsFamilyScreen key={6} />,
    <FaithValuesScreen key={7} />,
    <PoliticsScreen key={8} />,
    <CareerScreen key={9} />,
    <LocationScheduleScreen key={10} />,
    <SocialActivityScreen key={11} />,
    <PhysicalPreferencesScreen key={12} />,
    <CommunicationScreen key={13} />,
    <PastPatternsScreen key={14} />,
    <PersonalSectionIntroScreen key={15} />,
    <RelationshipTraumaScreen key={16} />,
    <FamilyUpbringingScreen key={17} />,
    <BoundariesScreen key={18} />,
    <MentalHealthScreen key={19} />,
    <SafetyIntimacyScreen key={20} />,
    <DeviStyleScreen key={21} />,
    <CompletionScreen key={22} />,
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
