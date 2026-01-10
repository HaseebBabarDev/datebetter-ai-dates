import { useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";
import { SortOption, StatusFilter } from "@/components/dashboard/CandidateFilters";

type Candidate = Tables<"candidates">;

const statusOrder: Record<string, number> = {
  getting_serious: 1,
  serious_relationship: 2,
  dating: 3,
  dating_casually: 4,
  planning_date: 5,
  texting: 6,
  just_matched: 7,
  no_contact: 8,
  archived: 9,
};

export function useCandidateFiltering(
  candidates: Candidate[],
  sortBy: SortOption,
  statusFilter: StatusFilter,
  qualityFilter: "good" | "bad" | null,
  searchQuery: string
): Candidate[] {
  return useMemo(() => {
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

    // Apply quality filter - matches recap thresholds (40%+ for good)
    if (qualityFilter === "good") {
      filtered = filtered.filter(
        (c) => (c.compatibility_score && c.compatibility_score >= 40) && 
               (!Array.isArray(c.red_flags) || c.red_flags.length < 3)
      );
    } else if (qualityFilter === "bad") {
      filtered = filtered.filter(
        (c) => (c.compatibility_score && c.compatibility_score < 40) || 
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
}

export { statusOrder };
