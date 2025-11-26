import React from "react";
import { Tables } from "@/integrations/supabase/types";
import { CandidateCard, CandidateAlert } from "./CandidateCard";

type Candidate = Tables<"candidates">;

interface CandidatesListProps {
  candidates: Candidate[];
  onUpdate: () => void;
  showGroupHeaders?: boolean;
  candidateAlerts?: Record<string, CandidateAlert[]>;
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

export const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  onUpdate,
  showGroupHeaders = true,
  candidateAlerts = {},
}) => {
  // If not showing group headers, render flat list
  if (!showGroupHeaders) {
    if (candidates.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No candidates match your filter
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onUpdate={onUpdate}
            alerts={candidateAlerts[candidate.id]}
          />
        ))}
      </div>
    );
  }

  // Grouped view
  const activeCandidates = candidates.filter(
    (c) => c.status !== "archived" && c.status !== "no_contact"
  );
  const noContactCandidates = candidates.filter((c) => c.status === "no_contact");
  const archivedCandidates = candidates.filter((c) => c.status === "archived");

  const sortedActive = [...activeCandidates].sort(
    (a, b) => (statusOrder[a.status || ""] || 99) - (statusOrder[b.status || ""] || 99)
  );

  return (
    <div className="space-y-6">
      {sortedActive.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Active ({sortedActive.length})
          </h2>
          <div className="space-y-3">
            {sortedActive.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onUpdate={onUpdate}
                alerts={candidateAlerts[candidate.id]}
              />
            ))}
          </div>
        </section>
      )}

      {noContactCandidates.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            No Contact ({noContactCandidates.length})
          </h2>
          <div className="space-y-3">
            {noContactCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onUpdate={onUpdate}
                alerts={candidateAlerts[candidate.id]}
              />
            ))}
          </div>
        </section>
      )}

      {archivedCandidates.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Archived ({archivedCandidates.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {archivedCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onUpdate={onUpdate}
                alerts={candidateAlerts[candidate.id]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
