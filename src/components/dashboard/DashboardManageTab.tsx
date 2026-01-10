import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Users } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { CandidateSearch } from "./CandidateSearch";
import { CandidateFilters, SortOption, StatusFilter } from "./CandidateFilters";
import { CandidatesList } from "./CandidatesList";
import { CandidateAlertBadge } from "@/hooks/useDatingAlerts";

type Candidate = Tables<"candidates">;

interface DashboardManageTabProps {
  candidates: Candidate[];
  filteredCandidates: Candidate[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  qualityFilter: "good" | "bad" | null;
  onQualityFilterChange: (filter: "good" | "bad" | null) => void;
  candidateAlerts: Record<string, CandidateAlertBadge[]>;
  onUpdate: () => void;
}

export function DashboardManageTab({
  candidates,
  filteredCandidates,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  qualityFilter,
  onQualityFilterChange,
  candidateAlerts,
  onUpdate,
}: DashboardManageTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
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
            onClick={() => onQualityFilterChange(null)} 
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {/* Search and Filters */}
      {candidates.length > 0 ? (
        <div className="space-y-3">
          <CandidateSearch value={searchQuery} onChange={onSearchChange} />
          <CandidateFilters
            sortBy={sortBy}
            onSortChange={onSortChange}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
          />
          <div data-tour="candidates-list">
            <CandidatesList
              candidates={filteredCandidates}
              onUpdate={onUpdate}
              showGroupHeaders={statusFilter === "all" && sortBy === "status" && !qualityFilter}
              candidateAlerts={candidateAlerts}
            />
          </div>
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
    </div>
  );
}
