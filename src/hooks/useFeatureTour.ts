import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const TOUR_VIEW_KEY = "feature_tour_views";
const MAX_TOUR_VIEWS = 2;

// Static function to reset feature tour for a user (can be called without the hook)
export function resetFeatureTour(userId: string) {
  const localKey = `${TOUR_VIEW_KEY}_${userId}`;
  localStorage.removeItem(localKey);
}

export function useFeatureTour(userId: string | undefined) {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkTourStatus = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Check local storage first for quick access
      const localKey = `${TOUR_VIEW_KEY}_${userId}`;
      const storedViews = localStorage.getItem(localKey);
      const viewCount = storedViews ? parseInt(storedViews, 10) : 0;

      if (viewCount >= MAX_TOUR_VIEWS) {
        setShowTour(false);
        setIsLoading(false);
        return;
      }

      // Check if user just completed onboarding (show tour for new users)
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, created_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        // User has completed onboarding, show the tour
        setShowTour(true);
      }
    } catch (error) {
      console.error("Error checking tour status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    checkTourStatus();
  }, [userId, checkTourStatus]);

  const completeTour = useCallback(() => {
    if (!userId) return;
    
    const localKey = `${TOUR_VIEW_KEY}_${userId}`;
    const storedViews = localStorage.getItem(localKey);
    const viewCount = storedViews ? parseInt(storedViews, 10) : 0;
    
    // Increment view count
    localStorage.setItem(localKey, String(viewCount + 1));
    setShowTour(false);
  }, [userId]);

  const restartTour = useCallback(() => {
    if (!userId) return;
    
    resetFeatureTour(userId);
    setShowTour(true);
  }, [userId]);

  return {
    showTour,
    isLoading,
    completeTour,
    restartTour,
  };
}
