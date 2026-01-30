import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEVI_INTRO_DISMISSED_KEY = "devi_intro_dismissed";

export function useDeviIntro(userId: string | undefined) {
  const [showDeviIntro, setShowDeviIntro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDeviUsage = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has dismissed the intro
        const dismissed = localStorage.getItem(`${DEVI_INTRO_DISMISSED_KEY}_${userId}`);
        if (dismissed) {
          setLoading(false);
          return;
        }

        // Check if user has any Devi conversations
        const { data: conversations, error } = await supabase
          .from("devi_conversations")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (error) {
          console.error("Error checking Devi conversations:", error);
          setLoading(false);
          return;
        }

        // Show intro if user has no conversations
        if (!conversations || conversations.length === 0) {
          // Small delay to not overwhelm new users with dialogs
          const timer = setTimeout(() => {
            setShowDeviIntro(true);
          }, 2000);
          
          setLoading(false);
          return () => clearTimeout(timer);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error in useDeviIntro:", error);
        setLoading(false);
      }
    };

    checkDeviUsage();
  }, [userId]);

  const dismissDeviIntro = () => {
    if (userId) {
      localStorage.setItem(`${DEVI_INTRO_DISMISSED_KEY}_${userId}`, "true");
    }
    setShowDeviIntro(false);
  };

  return {
    showDeviIntro,
    setShowDeviIntro,
    dismissDeviIntro,
    loading,
  };
}
