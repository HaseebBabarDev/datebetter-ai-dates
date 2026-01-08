import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NdaAgreement {
  id: string;
  user_id: string;
  agreement_type: string;
  agreement_version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export const NDA_AGREEMENT_TYPE = "beta_tester_nda";
export const NDA_VERSION = "1.0";

export function useNdaAgreement() {
  const { user } = useAuth();
  const [hasAcceptedNda, setHasAcceptedNda] = useState<boolean | null>(null);
  const [ndaAcceptance, setNdaAcceptance] = useState<NdaAgreement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkNdaAcceptance();
    } else {
      // Check localStorage for non-authenticated users (pre-signup)
      const localAccepted = localStorage.getItem("datebetter_beta_nda_accepted") === "true";
      setHasAcceptedNda(localAccepted);
      setLoading(false);
    }
  }, [user]);

  const checkNdaAcceptance = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_agreements")
        .select("*")
        .eq("user_id", user.id)
        .eq("agreement_type", NDA_AGREEMENT_TYPE)
        .eq("agreement_version", NDA_VERSION)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setNdaAcceptance(data as NdaAgreement);
        setHasAcceptedNda(true);
        // Sync to localStorage as backup
        localStorage.setItem("datebetter_beta_nda_accepted", "true");
        localStorage.setItem("datebetter_beta_nda_accepted_at", data.accepted_at);
      } else {
        // Check if accepted locally before login (during signup flow)
        const localAccepted = localStorage.getItem("datebetter_beta_nda_accepted") === "true";
        if (localAccepted) {
          // Migrate local acceptance to database
          await acceptNda();
        } else {
          setHasAcceptedNda(false);
        }
      }
    } catch (error) {
      console.error("Error checking NDA acceptance:", error);
      // Fallback to localStorage
      const localAccepted = localStorage.getItem("datebetter_beta_nda_accepted") === "true";
      setHasAcceptedNda(localAccepted);
    } finally {
      setLoading(false);
    }
  };

  const acceptNda = async () => {
    // Always set localStorage first for immediate UI feedback
    localStorage.setItem("datebetter_beta_nda_accepted", "true");
    localStorage.setItem("datebetter_beta_nda_accepted_at", new Date().toISOString());
    setHasAcceptedNda(true);

    if (!user) {
      // User not logged in yet - will sync to DB after signup/login
      return true;
    }

    try {
      const { data, error } = await supabase
        .from("user_agreements")
        .insert({
          user_id: user.id,
          agreement_type: NDA_AGREEMENT_TYPE,
          agreement_version: NDA_VERSION,
          accepted_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
        })
        .select()
        .single();

      if (error) {
        // Might be duplicate - that's ok
        if (!error.message.includes("duplicate")) {
          console.error("Error saving NDA acceptance:", error);
        }
      } else {
        setNdaAcceptance(data as NdaAgreement);
      }

      return true;
    } catch (error) {
      console.error("Error accepting NDA:", error);
      return false;
    }
  };

  return {
    hasAcceptedNda,
    ndaAcceptance,
    loading,
    acceptNda,
    refetch: checkNdaAcceptance,
  };
}
