import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Settings,
  TrendingUp,
  Heart,
  AlertTriangle,
  Clock,
  Sparkles,
  Droplet,
  Flame,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Users,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { CandidateSearch } from "@/components/dashboard/CandidateSearch";
import { CandidateFilters, SortOption, StatusFilter } from "@/components/dashboard/CandidateFilters";
import { CandidatesList } from "@/components/dashboard/CandidatesList";
import { differenceInDays, addDays, format } from "date-fns";

type Profile = Tables<"profiles">;
type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;

interface CandidateRecap {
  lastMatched: Candidate | null;
  lastInteracted: { candidate: Candidate; interaction: Interaction } | null;
  goodCandidates: Candidate[];
  badCandidates: Candidate[];
  neutralCandidates: Candidate[];
}

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
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("status");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [profileRes, candidatesRes, interactionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
        supabase.from("candidates").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false }),
        supabase.from("interactions").select("*").eq("user_id", user!.id).order("interaction_date", { ascending: false }).limit(50),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (candidatesRes.data) setCandidates(candidatesRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate cycle phase alerts
  const cycleAlerts = useMemo(() => {
    if (!profile?.track_cycle || !profile?.last_period_date) return null;

    const lastPeriod = new Date(profile.last_period_date);
    const cycleLength = profile.cycle_length || 28;
    const today = new Date();
    const dayInCycle = differenceInDays(today, lastPeriod) % cycleLength;
    const ovulationDay = Math.round(cycleLength / 2) - 2;

    let phase = "";
    let warning = "";
    let icon = null;

    if (dayInCycle <= 5) {
      phase = "Menstrual Phase";
      warning = "Energy may be lower — be gentle with yourself";
      icon = <Droplet className="w-4 h-4" />;
    } else if (dayInCycle >= ovulationDay - 2 && dayInCycle <= ovulationDay + 2) {
      phase = "Ovulation Window";
      warning = "Hormones peak — attraction feelings may be heightened. Make decisions carefully!";
      icon = <Flame className="w-4 h-4" />;
    } else if (dayInCycle > ovulationDay + 2 && dayInCycle < cycleLength - 5) {
      phase = "Luteal Phase";
      warning = "PMS territory — emotions may be more intense";
      icon = <AlertTriangle className="w-4 h-4" />;
    }

    return phase ? { phase, warning, icon, dayInCycle } : null;
  }, [profile]);

  // Check for post-intimacy oxytocin alerts
  const oxytocinAlerts = useMemo(() => {
    const alerts: { candidate: Candidate; daysSince: number }[] = [];
    const intimateInteractions = interactions.filter((i) => i.interaction_type === "intimate");

    intimateInteractions.forEach((interaction) => {
      const daysSince = differenceInDays(new Date(), new Date(interaction.interaction_date || ""));
      if (daysSince <= 3) {
        const candidate = candidates.find((c) => c.id === interaction.candidate_id);
        if (candidate && !alerts.find((a) => a.candidate.id === candidate.id)) {
          alerts.push({ candidate, daysSince });
        }
      }
    });

    return alerts;
  }, [interactions, candidates]);

  // Candidate recap
  const recap: CandidateRecap = useMemo(() => {
    const activeCandidates = candidates.filter(
      (c) => c.status !== "archived" && c.status !== "no_contact"
    );

    // Last matched
    const lastMatched = [...candidates]
      .filter((c) => c.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0] || null;

    // Last interacted
    const lastInteraction = interactions[0];
    const lastInteractedCandidate = lastInteraction
      ? candidates.find((c) => c.id === lastInteraction.candidate_id)
      : null;

    // Categorize by compatibility/feeling
    const goodCandidates = activeCandidates.filter(
      (c) => (c.compatibility_score && c.compatibility_score >= 70) || (c.overall_chemistry && c.overall_chemistry >= 4)
    );
    const badCandidates = activeCandidates.filter(
      (c) => (c.compatibility_score && c.compatibility_score < 50) || 
             (Array.isArray(c.red_flags) && c.red_flags.length >= 3)
    );
    const neutralCandidates = activeCandidates.filter(
      (c) => !goodCandidates.includes(c) && !badCandidates.includes(c)
    );

    return {
      lastMatched,
      lastInteracted: lastInteractedCandidate && lastInteraction
        ? { candidate: lastInteractedCandidate, interaction: lastInteraction }
        : null,
      goodCandidates,
      badCandidates,
      neutralCandidates,
    };
  }, [candidates, interactions]);

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = [...candidates];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c) => c.nickname.toLowerCase().includes(query));
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((c) => c.status !== "archived" && c.status !== "no_contact");
      } else {
        filtered = filtered.filter((c) => c.status === statusFilter);
      }
    }

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
  }, [candidates, sortBy, statusFilter, searchQuery]);

  const greeting = getGreeting();

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

  const activeCandidateCount = candidates.filter(
    (c) => c.status !== "archived" && c.status !== "no_contact"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{greeting}</p>
              <h1 className="text-xl font-semibold text-foreground">{profile?.name || "there"}</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {/* Add Candidate CTA */}
        <Button
          onClick={() => navigate("/add-candidate")}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Candidate
        </Button>

        {/* Cycle Alert */}
        {cycleAlerts && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  {cycleAlerts.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{cycleAlerts.phase} (Day {cycleAlerts.dayInCycle})</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cycleAlerts.warning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Oxytocin Alerts */}
        {oxytocinAlerts.map(({ candidate, daysSince }) => (
          <Card key={candidate.id} className="border-pink-500/30 bg-pink-500/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-600 shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Oxytocin Alert: {candidate.nickname}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {daysSince === 0 ? "Today" : `${daysSince} day${daysSince > 1 ? "s" : ""} ago`} — 
                    bonding hormones may cloud judgment for 48-72 hours. Wait before making big decisions!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter("active")}>
            <CardContent className="py-3 text-center">
              <div className="text-2xl font-bold text-primary">{activeCandidateCount}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-green-500/50" onClick={() => {}}>
            <CardContent className="py-3 text-center">
              <div className="text-2xl font-bold text-green-600">{recap.goodCandidates.length}</div>
              <div className="text-xs text-muted-foreground">Good Vibes</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-amber-500/50" onClick={() => {}}>
            <CardContent className="py-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{recap.badCandidates.length}</div>
              <div className="text-xs text-muted-foreground">Watch Out</div>
            </CardContent>
          </Card>
        </div>

        {/* Candidate Recap */}
        {candidates.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Last Matched */}
              {recap.lastMatched && (
                <button
                  onClick={() => navigate(`/candidate/${recap.lastMatched!.id}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={recap.lastMatched.photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {recap.lastMatched.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{recap.lastMatched.nickname}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Last matched
                      {recap.lastMatched.created_at && (
                        <> • {format(new Date(recap.lastMatched.created_at), "MMM d")}</>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              {/* Last Interaction */}
              {recap.lastInteracted && (
                <button
                  onClick={() => navigate(`/candidate/${recap.lastInteracted!.candidate.id}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={recap.lastInteracted.candidate.photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {recap.lastInteracted.candidate.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{recap.lastInteracted.candidate.nickname}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {recap.lastInteracted.interaction.interaction_type.replace("_", " ")}
                      {recap.lastInteracted.interaction.interaction_date && (
                        <> • {format(new Date(recap.lastInteracted.interaction.interaction_date), "MMM d")}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {recap.lastInteracted.interaction.overall_feeling && recap.lastInteracted.interaction.overall_feeling >= 4 && (
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                    )}
                    {recap.lastInteracted.interaction.overall_feeling && recap.lastInteracted.interaction.overall_feeling <= 2 && (
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                    )}
                    {recap.lastInteracted.interaction.overall_feeling === 3 && (
                      <Minus className="w-4 h-4 text-muted-foreground" />
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              )}

              {/* Good/Bad/Neutral Summary */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <ThumbsUp className="w-3 h-3" />
                    <span className="text-sm font-medium">{recap.goodCandidates.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Good</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Minus className="w-3 h-3" />
                    <span className="text-sm font-medium">{recap.neutralCandidates.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Neutral</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-500">
                    <ThumbsDown className="w-3 h-3" />
                    <span className="text-sm font-medium">{recap.badCandidates.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Caution</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        {candidates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Your Roster
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/patterns")}>
                <TrendingUp className="w-4 h-4 mr-1" />
                View Patterns
              </Button>
            </div>
            <CandidateSearch value={searchQuery} onChange={setSearchQuery} />
            <CandidateFilters
              sortBy={sortBy}
              onSortChange={setSortBy}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>
        )}

        {/* Candidates List */}
        {candidates.length > 0 ? (
          <CandidatesList
            candidates={filteredAndSortedCandidates}
            onUpdate={fetchData}
            showGroupHeaders={statusFilter === "all" && sortBy === "status"}
          />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Candidates Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start tracking your dating journey by adding your first candidate.
              </p>
              <Button onClick={() => navigate("/add-candidate")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Candidate
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
}

export default Dashboard;
