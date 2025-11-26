import React, { useEffect, useState } from "react";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Import all screens
import WelcomeScreen from "@/components/onboarding/screens/WelcomeScreen";
import BasicIdentityScreen from "@/components/onboarding/screens/BasicIdentityScreen";
import DatingPreferencesScreen from "@/components/onboarding/screens/DatingPreferencesScreen";
import HormoneCycleScreen from "@/components/onboarding/screens/HormoneCycleScreen";
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
import BoundariesScreen from "@/components/onboarding/screens/BoundariesScreen";
import MentalHealthScreen from "@/components/onboarding/screens/MentalHealthScreen";
import SafetyIntimacyScreen from "@/components/onboarding/screens/SafetyIntimacyScreen";
import CompletionScreen from "@/components/onboarding/screens/CompletionScreen";

const SetupContent = () => {
  const { currentStep, loading } = useOnboarding();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const screens = [
    <WelcomeScreen key={0} />,
    <BasicIdentityScreen key={1} />,
    <DatingPreferencesScreen key={2} />,
    <HormoneCycleScreen key={3} />,
    <RelationshipGoalsScreen key={4} />,
    <KidsFamilyScreen key={5} />,
    <FaithValuesScreen key={6} />,
    <PoliticsScreen key={7} />,
    <CareerScreen key={8} />,
    <LocationScheduleScreen key={9} />,
    <SocialActivityScreen key={10} />,
    <PhysicalPreferencesScreen key={11} />,
    <CommunicationScreen key={12} />,
    <PastPatternsScreen key={13} />,
    <BoundariesScreen key={14} />,
    <MentalHealthScreen key={15} />,
    <SafetyIntimacyScreen key={16} />,
    <CompletionScreen key={17} />,
  ];

  return screens[currentStep] || screens[0];
};

const Setup = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingStatus, setCheckingStatus] = useState(true);

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
      <SetupContent />
    </OnboardingProvider>
  );
};

export default Setup;
