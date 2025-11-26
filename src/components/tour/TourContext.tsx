import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (tourId: string, steps: TourStep[]) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  hasCompletedTour: (tourId: string) => boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_STORAGE_KEY = "completed_tours";

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [currentTourId, setCurrentTourId] = useState<string | null>(null);

  const getCompletedTours = (): string[] => {
    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const markTourComplete = (tourId: string) => {
    const completed = getCompletedTours();
    if (!completed.includes(tourId)) {
      completed.push(tourId);
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completed));
    }
  };

  const hasCompletedTour = useCallback((tourId: string): boolean => {
    return getCompletedTours().includes(tourId);
  }, []);

  const startTour = useCallback((tourId: string, tourSteps: TourStep[]) => {
    if (hasCompletedTour(tourId)) return;
    setCurrentTourId(tourId);
    setSteps(tourSteps);
    setCurrentStep(0);
    setIsActive(true);
  }, [hasCompletedTour]);

  const endTour = useCallback(() => {
    if (currentTourId) {
      markTourComplete(currentTourId);
    }
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    setCurrentTourId(null);
  }, [currentTourId]);

  const skipTour = useCallback(() => {
    if (currentTourId) {
      markTourComplete(currentTourId);
    }
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    setCurrentTourId(null);
  }, [currentTourId]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        endTour,
        nextStep,
        prevStep,
        skipTour,
        hasCompletedTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};
