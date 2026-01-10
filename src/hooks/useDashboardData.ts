import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;

interface DashboardData {
  profile: Profile | null;
  candidates: Candidate[];
  interactions: Interaction[];
  loading: boolean;
  refetch: () => Promise<void>;
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
}

export function useDashboardData(userId: string | undefined): DashboardData {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const [profileRes, candidatesRes, interactionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("candidates").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
        supabase.from("interactions").select("*").eq("user_id", userId).order("interaction_date", { ascending: false }).limit(50),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (candidatesRes.data) setCandidates(candidatesRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  return {
    profile,
    candidates,
    interactions,
    loading,
    refetch: fetchData,
    setCandidates,
  };
}
