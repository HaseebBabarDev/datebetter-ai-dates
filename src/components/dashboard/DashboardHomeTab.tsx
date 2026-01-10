import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, TrendingUp, Heart, Sparkles, ChevronRight, Users } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { LogInteractionDialog } from "./LogInteractionDialog";
import { QuickCandidateSelect } from "./QuickCandidateSelect";
import { UpgradeNudge } from "@/components/subscription/UpgradeNudge";
import { FreeUpgradeBanner } from "@/components/subscription/FreeUpgradeBanner";
import { HealingScoreCard } from "./HealingScoreCard";
import { AIAlertsCard } from "./AIAlertsCard";
import { DeviCTA } from "./DeviCTA";
import { ReferralCard } from "./ReferralCard";
import { WinsStats } from "@/components/devi/WinsStats";
import { AlertsCarousel } from "./AlertsCarousel";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { RecentActivityCard } from "./RecentActivityCard";
import { CandidateRecap } from "@/hooks/useCandidateRecap";
import { OxytocinAlert, LoveBombingAlert, PostIntimacyDropAlert } from "@/hooks/useDatingAlerts";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;
type Profile = Tables<"profiles">;

interface CycleAlert {
  phase: string;
  warning: string;
  icon: React.ReactNode;
  dayInCycle: number;
}

interface DashboardHomeTabProps {
  profile: Profile | null;
  candidates: Candidate[];
  interactions: Interaction[];
  recap: CandidateRecap;
  cycleAlerts: CycleAlert | null;
  oxytocinAlerts: OxytocinAlert[];
  loveBombingAlerts: LoveBombingAlert[];
  postIntimacyDropAlerts: PostIntimacyDropAlert[];
  wins: {
    total: number;
    thisMonth: number;
    byType: Record<string, number>;
  };
  userId: string | undefined;
  onTabChange: (tab: string) => void;
  onStatusFilterChange: (filter: "active" | "all") => void;
  onQualityFilterChange: (filter: "good" | "bad" | null) => void;
  onCandidatesUpdate: () => void;
}

export function DashboardHomeTab({
  profile,
  candidates,
  interactions,
  recap,
  cycleAlerts,
  oxytocinAlerts,
  loveBombingAlerts,
  postIntimacyDropAlerts,
  wins,
  userId,
  onTabChange,
  onStatusFilterChange,
  onQualityFilterChange,
  onCandidatesUpdate,
}: DashboardHomeTabProps) {
  const navigate = useNavigate();
  
  const activeCandidates = candidates.filter(
    (c) => c.status !== "archived" && c.status !== "no_contact"
  );
  const activeCandidateCount = activeCandidates.length;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-2">
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-tour="add-candidate"
                onClick={() => navigate("/add-candidate")}
                className="h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-medium">Add Candidate</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="text-xs">Start tracking someone new you're dating or considering</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div data-tour="log-interaction" className="h-11">
          <LogInteractionDialog 
            candidates={candidates} 
            onSuccess={onCandidatesUpdate}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-tour="talk-to-devi"
                variant="outline"
                onClick={() => navigate("/devi")}
                className="h-11 gap-2 rounded-xl border-primary/30 bg-[image:var(--gradient-subtle)] text-foreground hover:bg-primary/10 transition-all duration-200 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">Talk to D.E.V.I.</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="text-xs">Get personalized dating advice from your AI coach</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-tour="view-patterns"
                variant="outline"
                onClick={() => navigate("/patterns")}
                className="h-11 gap-2 rounded-xl border-border bg-card text-foreground hover:bg-muted/50 transition-all duration-200 active:scale-[0.98]"
              >
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">View Patterns</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="text-xs">Discover trends in your dating behaviors and preferences</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <UpgradeNudge />
      <FreeUpgradeBanner />

      {/* Log How I'm Feeling CTA */}
      <Card 
        className="overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-md active:scale-[0.99] border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5"
        onClick={() => navigate("/devi?prompt=feeling")}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">How are you feeling today?</h3>
              <p className="text-xs text-muted-foreground">Check in with D.E.V.I. about your emotions</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-muted/50 border border-border/50">
        <Sparkles className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[10px] font-medium text-foreground whitespace-nowrap">Chat with Devi & log honestly → better insights</span>
      </div>

      {/* Alerts Carousel */}
      <AlertsCarousel
        profile={profile}
        cycleAlerts={cycleAlerts}
        oxytocinAlerts={oxytocinAlerts}
        loveBombingAlerts={loveBombingAlerts}
        candidates={candidates}
      />

      {/* Quick Stats */}
      <QuickStatsGrid
        activeCandidateCount={activeCandidateCount}
        recap={recap}
        onActiveClick={() => { onTabChange("manage"); onStatusFilterChange("active"); onQualityFilterChange(null); }}
        onGoodClick={() => { onTabChange("manage"); onStatusFilterChange("active"); onQualityFilterChange("good"); }}
        onBadClick={() => { onTabChange("manage"); onStatusFilterChange("active"); onQualityFilterChange("bad"); }}
      />

      {/* Healing Score Card */}
      <HealingScoreCard />

      {/* AI Alerts Card */}
      <AIAlertsCard 
        candidateCount={candidates.length}
        lastInteractionTime={interactions[0]?.interaction_date || undefined}
        interactionCount={interactions.length}
        userId={userId}
        onLogInteraction={activeCandidates.length === 1 
          ? () => navigate(`/candidate/${activeCandidates[0].id}?tab=interactions`)
          : activeCandidates.length > 1 
            ? () => document.getElementById("log-interaction-trigger")?.click()
            : undefined
        }
      />

      {/* Candidate Recap */}
      {candidates.length > 0 && (
        <RecentActivityCard 
          recap={recap} 
          onCandidatesUpdate={onCandidatesUpdate}
        />
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

      {/* D.E.V.I. CTA */}
      <DeviCTA />

      {/* Wins Stats */}
      {wins.total > 0 && (
        <WinsStats
          totalWins={wins.total}
          thisMonthWins={wins.thisMonth}
          winsByType={wins.byType}
        />
      )}

      {/* Referral CTA at bottom */}
      <ReferralCard />
    </div>
  );
}
