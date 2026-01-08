import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const BETA_WELCOME_TYPE = "beta_welcome_seen";
export const BETA_WELCOME_VERSION = "1.0";

export function useBetaWelcome() {
  const { user } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkWelcomeSeen();
    } else {
      // Check localStorage for non-authenticated users
      const localSeen = localStorage.getItem("datebetter_beta_welcome_seen") === "true";
      setHasSeenWelcome(localSeen);
      setLoading(false);
    }
  }, [user]);

  const checkWelcomeSeen = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_agreements")
        .select("*")
        .eq("user_id", user.id)
        .eq("agreement_type", BETA_WELCOME_TYPE)
        .eq("agreement_version", BETA_WELCOME_VERSION)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasSeenWelcome(true);
        localStorage.setItem("datebetter_beta_welcome_seen", "true");
      } else {
        // Check localStorage as fallback
        const localSeen = localStorage.getItem("datebetter_beta_welcome_seen") === "true";
        if (localSeen) {
          // Migrate to database
          await markWelcomeSeen();
        } else {
          setHasSeenWelcome(false);
        }
      }
    } catch (error) {
      console.error("Error checking welcome status:", error);
      const localSeen = localStorage.getItem("datebetter_beta_welcome_seen") === "true";
      setHasSeenWelcome(localSeen);
    } finally {
      setLoading(false);
    }
  };

  const markWelcomeSeen = async () => {
    localStorage.setItem("datebetter_beta_welcome_seen", "true");
    setHasSeenWelcome(true);

    if (!user) {
      return true;
    }

    try {
      await supabase
        .from("user_agreements")
        .insert({
          user_id: user.id,
          agreement_type: BETA_WELCOME_TYPE,
          agreement_version: BETA_WELCOME_VERSION,
          accepted_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
        });

      return true;
    } catch (error) {
      console.error("Error marking welcome as seen:", error);
      return false;
    }
  };

  return {
    hasSeenWelcome,
    loading,
    markWelcomeSeen,
    refetch: checkWelcomeSeen,
  };
}
