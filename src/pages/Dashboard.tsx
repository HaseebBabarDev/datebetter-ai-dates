import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Settings,
  TrendingUp,
  Heart,
  AlertTriangle,
  Sparkles,
  Droplet,
  Flame,
  ThumbsUp,
  Ban,
  ThumbsDown,
  Minus,
  Users,
  ChevronRight,
  Calendar,
  List,
  Clock,
  Bell,
} from "lucide-react";
import { CandidateSearch } from "@/components/dashboard/CandidateSearch";
import { CandidateFilters, SortOption, StatusFilter } from "@/components/dashboard/CandidateFilters";
import { CandidatesList } from "@/components/dashboard/CandidatesList";
import { LogInteractionDialog } from "@/components/dashboard/LogInteractionDialog";
import { differenceInDays, addDays, format } from "date-fns";
import heroCouple from "@/assets/hero-couple.jpeg";

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
  const [activeTab, setActiveTab] = useState("home");
  const [sortBy, setSortBy] = useState<SortOption>("status");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [qualityFilter, setQualityFilter] = useState<"good" | "bad" | null>(null);
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

    // Apply quality filter
    if (qualityFilter === "good") {
      filtered = filtered.filter(
        (c) => (c.compatibility_score && c.compatibility_score >= 70) || (c.overall_chemistry && c.overall_chemistry >= 4)
      );
    } else if (qualityFilter === "bad") {
      filtered = filtered.filter(
        (c) => (c.compatibility_score && c.compatibility_score < 50) || 
               (Array.isArray(c.red_flags) && c.red_flags.length >= 3)
      );
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
  }, [candidates, sortBy, statusFilter, qualityFilter, searchQuery]);

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
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Hero Background Image */}
      <div className="fixed inset-0 z-0">
        <img 
          src={heroCouple} 
          alt="" 
          className="w-full h-full object-cover object-top opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border bg-background/80">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{greeting}</p>
              <h1 className="text-xl font-semibold text-foreground">{profile?.name || "there"}</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-primary/10" onClick={() => navigate("/notifications")}>
                <Bell className="w-5 h-5" />
                {(oxytocinAlerts.length > 0 || candidates.filter(c => c.no_contact_active).length > 0) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-primary/10" onClick={() => navigate("/settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-4 max-w-lg pb-20">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setQualityFilter(null); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 backdrop-blur-sm border border-border">
            <TabsTrigger value="home" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Home</TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Manage Candidates</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4 mt-0">
            {/* Quick Actions */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => navigate("/add-candidate")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 gap-2 font-semibold shadow-lg shadow-primary/30"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Candidate</span>
                </Button>
                <LogInteractionDialog candidates={candidates} compact />
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/patterns")}
                className="w-full h-10 gap-2 border-border text-foreground hover:bg-primary/10"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">View Patterns</span>
              </Button>
            </div>

            {/* Alerts */}
            {(() => {
              const alerts: { key: string; icon: React.ReactNode; label: string; sub?: string; color: string; onClick?: () => void }[] = [];
              
              // Cycle Setup CTA
              if (profile?.track_cycle && !profile?.last_period_date) {
                alerts.push({
                  key: "cycle-setup",
                  icon: <Droplet className="w-3 h-3" />,
                  label: "Set up cycle",
                  color: "bg-secondary/20 text-secondary border-secondary/30",
                  onClick: () => navigate("/settings"),
                });
              }

              // Cycle Alert
              if (cycleAlerts) {
                alerts.push({
                  key: "cycle-alert",
                  icon: cycleAlerts.icon,
                  label: cycleAlerts.phase,
                  sub: `Day ${cycleAlerts.dayInCycle}`,
                  color: "bg-accent/20 text-accent-foreground border-accent/30",
                });
              }

              // Oxytocin Alerts
              oxytocinAlerts.forEach(({ candidate, daysSince }) => {
                alerts.push({
                  key: `oxy-${candidate.id}`,
                  icon: <Flame className="w-3 h-3" />,
                  label: candidate.nickname,
                  sub: daysSince === 0 ? "Today" : `${daysSince}d`,
                  color: "bg-destructive/20 text-destructive border-destructive/30",
                  onClick: () => navigate(`/candidate/${candidate.id}`),
                });
              });

              // No Contact Alerts
              candidates.filter(c => c.no_contact_active).forEach((candidate) => {
                alerts.push({
                  key: `nc-${candidate.id}`,
                  icon: <Ban className="w-3 h-3" />,
                  label: candidate.nickname,
                  sub: `Day ${candidate.no_contact_day || 0}`,
                  color: "bg-muted text-muted-foreground border-border",
                  onClick: () => navigate(`/candidate/${candidate.id}`),
                });
              });

              if (alerts.length === 0) return null;

              return (
                <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
                  <CarouselContent className="-ml-2">
                    {alerts.map((alert) => (
                      <CarouselItem key={alert.key} className="pl-2 basis-auto">
                        <button
                          onClick={alert.onClick}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${alert.color}`}
                        >
                          {alert.icon}
                          <span>{alert.label}</span>
                          {alert.sub && <span className="opacity-60">• {alert.sub}</span>}
                        </button>
                      </CarouselItem>
                    ))}
                    <CarouselItem className="pl-2 basis-auto">
                      <button
                        onClick={() => navigate("/notifications")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:bg-primary/10 transition-all"
                      >
                        <Bell className="w-3 h-3" />
                        <span>All</span>
                      </button>
                    </CarouselItem>
                  </CarouselContent>
                </Carousel>
              );
            })()}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div 
                className="cursor-pointer hover:scale-[1.02] transition-all rounded-xl p-3 bg-primary/10 backdrop-blur-sm border border-primary/20 text-center" 
                onClick={() => { setActiveTab("manage"); setStatusFilter("active"); setQualityFilter(null); }}
              >
                <div className="text-2xl font-bold text-primary">{activeCandidateCount}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div 
                className="cursor-pointer hover:scale-[1.02] transition-all rounded-xl p-3 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-center" 
                onClick={() => { setActiveTab("manage"); setStatusFilter("active"); setQualityFilter("good"); }}
              >
                <div className="text-2xl font-bold text-emerald-600">{recap.goodCandidates.length}</div>
                <div className="text-xs text-muted-foreground">Good Vibes</div>
              </div>
              <div 
                className="cursor-pointer hover:scale-[1.02] transition-all rounded-xl p-3 bg-rose-500/10 backdrop-blur-sm border border-rose-500/20 text-center" 
                onClick={() => { setActiveTab("manage"); setStatusFilter("active"); setQualityFilter("bad"); }}
              >
                <div className="text-2xl font-bold text-rose-600">{recap.badCandidates.length}</div>
                <div className="text-xs text-muted-foreground">Watch Out</div>
              </div>
            </div>

            {/* Candidate Recap */}
            {candidates.length > 0 && (
              <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Recent Activity
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {/* Last Matched */}
                  {recap.lastMatched && (
                    <button
                      onClick={() => navigate(`/candidate/${recap.lastMatched!.id}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={recap.lastMatched.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {recap.lastMatched.nickname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">{recap.lastMatched.nickname}</p>
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
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={recap.lastInteracted.candidate.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {recap.lastInteracted.candidate.nickname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">{recap.lastInteracted.candidate.nickname}</p>
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
                          <ThumbsUp className="w-4 h-4 text-emerald-500" />
                        )}
                        {recap.lastInteracted.interaction.overall_feeling && recap.lastInteracted.interaction.overall_feeling <= 2 && (
                          <ThumbsDown className="w-4 h-4 text-rose-500" />
                        )}
                        {recap.lastInteracted.interaction.overall_feeling === 3 && (
                          <Minus className="w-4 h-4 text-muted-foreground" />
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  )}

                </div>
              </div>
            )}

            {candidates.length === 0 && (
              <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border border-dashed py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Candidates Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your dating journey by adding your first candidate.
                </p>
                <Button onClick={() => navigate("/add-candidate")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Candidate
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 mt-0">
            {/* Quick Actions for Manage Tab */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => navigate("/add-candidate")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Candidate
              </Button>
              <Button variant="outline" onClick={() => navigate("/patterns")} className="w-full border-border text-foreground hover:bg-primary/10">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Patterns
              </Button>
            </div>

            {/* Quality Filter Indicator */}
            {qualityFilter && (
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${qualityFilter === "good" ? "bg-emerald-500/20 text-emerald-600" : "bg-rose-500/20 text-rose-600"}`}>
                  Showing: {qualityFilter === "good" ? "Good Vibes" : "Watch Out"}
                </span>
                <button 
                  onClick={() => setQualityFilter(null)} 
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Search and Filters */}
            {candidates.length > 0 ? (
              <div className="space-y-3">
                <CandidateSearch value={searchQuery} onChange={setSearchQuery} />
                <CandidateFilters
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
                <CandidatesList
                  candidates={filteredAndSortedCandidates}
                  onUpdate={fetchData}
                  showGroupHeaders={statusFilter === "all" && sortBy === "status" && !qualityFilter}
                />
              </div>
            ) : (
              <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border border-dashed py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Candidates Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your dating journey by adding your first candidate.
                </p>
                <Button onClick={() => navigate("/add-candidate")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Candidate
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
