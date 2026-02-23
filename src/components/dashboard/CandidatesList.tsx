import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Tables } from "@/integrations/supabase/types";
import { CandidateCard, CandidateAlert } from "./CandidateCard";
import { supabase } from "@/integrations/supabase/client";
import { GripVertical, ShieldX } from "lucide-react";

type Candidate = Tables<"candidates">;

interface CandidatesListProps {
  candidates: Candidate[];
  onUpdate: () => void;
  showGroupHeaders?: boolean;
  candidateAlerts?: Record<string, CandidateAlert[]>;
}

// Compute ranks for candidates with compatibility scores
const computeRanks = (candidates: Candidate[]): Record<string, number> => {
  const scorable = candidates
    .filter(c => c.compatibility_score != null && c.status !== "archived" && c.status !== "no_contact" && !((c as any).is_auto_disqualified && !(c as any).auto_disqualify_override))
    .sort((a, b) => (b.compatibility_score ?? 0) - (a.compatibility_score ?? 0));
  
  const ranks: Record<string, number> = {};
  scorable.forEach((c, i) => { ranks[c.id] = i + 1; });
  return ranks;
};

const statusOrder: Record<string, number> = {
  getting_serious: 1,
  dating: 2,
  planning_date: 3,
  texting: 4,
  just_matched: 5,
  no_contact: 6,
  archived: 7,
};

const saveSortOrder = async (ordered: Candidate[]) => {
  const updates = ordered.map((c, idx) =>
    supabase
      .from("candidates")
      .update({ sort_order: idx + 1 })
      .eq("id", c.id)
  );
  await Promise.all(updates);
};

interface DraggableListProps {
  items: Candidate[];
  onReorder: (reordered: Candidate[]) => void;
  candidateAlerts: Record<string, CandidateAlert[]>;
  onUpdate: () => void;
  ranks: Record<string, number>;
}

const DraggableList: React.FC<DraggableListProps> = ({
  items,
  onReorder,
  candidateAlerts,
  onUpdate,
  ranks,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [list, setList] = useState<Candidate[]>(items);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setList(items);
  }, [items]);

  const handleDragStart = useCallback((idx: number) => {
    setDragIndex(idx);
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    setOverIndex(idx);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const reordered = [...list];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(overIndex, 0, moved);

    setList(reordered);
    onReorder(reordered);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveSortOrder(reordered);
    }, 600);

    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, list, onReorder]);

  return (
    <div className="space-y-3">
      {list.map((candidate, idx) => {
        const isDragging = dragIndex === idx;
        const isOver = overIndex === idx && dragIndex !== idx;

        return (
          <div
            key={candidate.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`group relative transition-all duration-150 ${
              isDragging ? "opacity-40 scale-[0.98]" : "opacity-100"
            } ${isOver ? "translate-y-1" : ""}`}
          >
            {isOver && (
              <div className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-full bg-primary z-10" />
            )}

            <div className="absolute left-0 top-0 bottom-0 flex items-center pl-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-muted-foreground/50" />
            </div>

            <div className="pl-4">
              <CandidateCard
                candidate={candidate}
                onUpdate={onUpdate}
                alerts={candidateAlerts[candidate.id]}
                rank={ranks[candidate.id] ?? null}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Flat list (no drag) for filtered/search view
const FlatList: React.FC<{
  candidates: Candidate[];
  onUpdate: () => void;
  candidateAlerts: Record<string, CandidateAlert[]>;
  ranks: Record<string, number>;
}> = ({ candidates, onUpdate, candidateAlerts, ranks }) => {
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
          rank={ranks[candidate.id] ?? null}
        />
      ))}
    </div>
  );
};

const GroupedList: React.FC<{
  candidates: Candidate[];
  onUpdate: () => void;
  candidateAlerts: Record<string, CandidateAlert[]>;
  ranks: Record<string, number>;
}> = ({ candidates, onUpdate, candidateAlerts, ranks }) => {
  const activeCandidates = candidates.filter(
    (c) => c.status !== "archived" && c.status !== "no_contact"
      && !((c as any).is_auto_disqualified && !(c as any).auto_disqualify_override)
  );
  const noContactCandidates = candidates.filter((c) => c.status === "no_contact");
  const archivedCandidates = candidates.filter((c) => c.status === "archived");
  const disqualifiedCandidates = candidates.filter(
    (c) => (c as any).is_auto_disqualified && !(c as any).auto_disqualify_override
  );

  const sortedActive = [...activeCandidates].sort((a, b) => {
    const aOrder = a.sort_order ?? null;
    const bOrder = b.sort_order ?? null;
    if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return (statusOrder[a.status || ""] || 99) - (statusOrder[b.status || ""] || 99);
  });

  const [activeList, setActiveList] = useState(sortedActive);

  useEffect(() => {
    setActiveList(sortedActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates]);

  return (
    <div className="space-y-6">
      {activeList.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Active ({activeList.length})
            </h2>
            <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </span>
          </div>
          <DraggableList
            items={activeList}
            onReorder={setActiveList}
            candidateAlerts={candidateAlerts}
            onUpdate={onUpdate}
            ranks={ranks}
          />
        </motion.section>
      )}

      {noContactCandidates.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
        >
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
        </motion.section>
      )}

      {archivedCandidates.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
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
        </motion.section>
      )}

      {disqualifiedCandidates.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ShieldX className="w-3.5 h-3.5 text-destructive" />
            <h2 className="text-sm font-medium text-destructive uppercase tracking-wide">
              Disqualified ({disqualifiedCandidates.length})
            </h2>
          </div>
          <div className="space-y-3">
            {disqualifiedCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onUpdate={onUpdate}
                alerts={candidateAlerts[candidate.id]}
              />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  onUpdate,
  showGroupHeaders = true,
  candidateAlerts = {},
}) => {
  const ranks = useMemo(() => computeRanks(candidates), [candidates]);

  if (!showGroupHeaders) {
    return (
      <FlatList
        candidates={candidates}
        onUpdate={onUpdate}
        candidateAlerts={candidateAlerts}
        ranks={ranks}
      />
    );
  }

  return (
    <GroupedList
      candidates={candidates}
      onUpdate={onUpdate}
      candidateAlerts={candidateAlerts}
      ranks={ranks}
    />
  );
};
