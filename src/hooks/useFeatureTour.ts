import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TOUR_VIEW_KEY = "feature_tour_views";
const MAX_TOUR_VIEWS = 2;

export function useFeatureTour(userId: string | undefined) {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    checkTourStatus();
  }, [userId]);

  const checkTourStatus = async () => {
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
  };

  const completeTour = () => {
    if (!userId) return;
    
    const localKey = `${TOUR_VIEW_KEY}_${userId}`;
    const storedViews = localStorage.getItem(localKey);
    const viewCount = storedViews ? parseInt(storedViews, 10) : 0;
    
    // Increment view count
    localStorage.setItem(localKey, String(viewCount + 1));
    setShowTour(false);
  };

  return {
    showTour,
    isLoading,
    completeTour,
  };
}
