import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CycleStatusBar } from "@/components/dashboard/CycleStatusBar";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { CandidatesList } from "@/components/dashboard/CandidatesList";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AddCandidateForm } from "@/components/dashboard/AddCandidateForm";
import { CandidateFilters, SortOption, StatusFilter } from "@/components/dashboard/CandidateFilters";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Candidate = Tables<"candidates">;

const statusOrder: Record<string, number> = {
  getting_serious: 1,
  dating: 2,
  planning_date: 3,
  texting: 4,
  just_matched: 5,
  no_contact: 6,
  archived: 7,
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("status");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = [...candidates];

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((c) => c.status !== "archived" && c.status !== "no_contact");
      } else {
        filtered = filtered.filter((c) => c.status === statusFilter);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.compatibility_score ?? 0) - (a.compatibility_score ?? 0);
        case "status":
          return (statusOrder[a.status || ""] || 99) - (statusOrder[b.status || ""] || 99);
        case "date_added":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "date_updated":
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [candidates, sortBy, statusFilter]);

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
        {/* Filters - Always visible when there are candidates */}
        {candidates.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <CandidateFilters
              sortBy={sortBy}
              onSortChange={setSortBy}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            <AddCandidateForm onSuccess={handleCandidateUpdate} />
          </div>
        )}

        {profile?.track_cycle && (
          <CycleStatusBar 
            lastPeriodDate={profile.last_period_date} 
            cycleLength={profile.cycle_length || 28} 
          />
        )}
        
        <AlertsSection candidates={candidates} />
        
        {candidates.length > 0 ? (
          <CandidatesList 
            candidates={filteredAndSortedCandidates} 
            onUpdate={handleCandidateUpdate}
            showGroupHeaders={statusFilter === "all" && sortBy === "status"}
          />
        ) : (
          <EmptyState onCandidateAdded={handleCandidateUpdate} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
