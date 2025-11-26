import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CycleStatusBar } from "@/components/dashboard/CycleStatusBar";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { CandidatesList } from "@/components/dashboard/CandidatesList";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Candidate = Tables<"candidates">;

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [profileRes, candidatesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
        supabase.from("candidates").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (candidatesRes.data) setCandidates(candidatesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateUpdate = () => {
    fetchData();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile?.name || "there"} />
      
      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {profile?.track_cycle && (
          <CycleStatusBar 
            lastPeriodDate={profile.last_period_date} 
            cycleLength={profile.cycle_length || 28} 
          />
        )}
        
        <AlertsSection candidates={candidates} />
        
        {candidates.length > 0 ? (
          <CandidatesList 
            candidates={candidates} 
            onUpdate={handleCandidateUpdate} 
          />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
