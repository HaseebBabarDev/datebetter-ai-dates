import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;

export type RecentActivityItem = {
  type: "matched" | "interacted" | "ended" | "no_contact" | "notification";
  candidate?: Candidate;
  interaction?: Interaction;
  date: Date;
  notification?: {
    notifType: "oxytocin" | "red_flags" | "high_match" | "low_match" | "stale" | "advice";
    title: string;
    message: string;
    icon: "flame" | "alert" | "heart" | "trending" | "clock" | "lightbulb";
  };
};

export interface CandidateRecap {
  recentActivity: RecentActivityItem[];
  goodCandidates: Candidate[];
  badCandidates: Candidate[];
  neutralCandidates: Candidate[];
}

export function useCandidateRecap(
  candidates: Candidate[],
  interactions: Interaction[]
): CandidateRecap {
  return useMemo(() => {
    const activeCandidates = candidates.filter(
      (c) => c.status !== "archived" && c.status !== "no_contact"
    );

    // Build unified recent activity list
    const activityItems: RecentActivityItem[] = [];
    const seenCandidateIds = new Set<string>();

    // Add recent interactions (up to 5)
    interactions.slice(0, 5).forEach((interaction) => {
      const candidate = candidates.find((c) => c.id === interaction.candidate_id);
      if (candidate && !seenCandidateIds.has(candidate.id)) {
        activityItems.push({
          type: "interacted",
          candidate,
          interaction,
          date: new Date(interaction.interaction_date || interaction.created_at || 0),
        });
        seenCandidateIds.add(candidate.id);
      }
    });

    // Add recently matched (within last 14 days)
    candidates
      .filter((c) => c.created_at && differenceInDays(new Date(), new Date(c.created_at)) <= 14)
      .forEach((candidate) => {
        if (!seenCandidateIds.has(candidate.id)) {
          activityItems.push({
            type: "matched",
            candidate,
            date: new Date(candidate.created_at!),
          });
          seenCandidateIds.add(candidate.id);
        }
      });

    // Add recently ended (within last 14 days)
    candidates
      .filter((c) => {
        const endedAt = c.relationship_ended_at;
        if (!endedAt || c.status !== "archived") return false;
        return differenceInDays(new Date(), new Date(endedAt)) <= 14;
      })
      .forEach((candidate) => {
        if (!seenCandidateIds.has(candidate.id)) {
          activityItems.push({
            type: "ended",
            candidate,
            date: new Date(candidate.relationship_ended_at!),
          });
          seenCandidateIds.add(candidate.id);
        }
      });

    // Add no contact candidates
    candidates
      .filter((c) => c.no_contact_active && c.status === "no_contact")
      .forEach((candidate) => {
        if (!seenCandidateIds.has(candidate.id)) {
          activityItems.push({
            type: "no_contact",
            candidate,
            date: new Date(candidate.no_contact_start_date || candidate.relationship_ended_at || candidate.updated_at || 0),
          });
          seenCandidateIds.add(candidate.id);
        }
      });

    // Also add recently ended relationships that went to no_contact
    candidates
      .filter((c) => {
        if (!c.relationship_ended_at) return false;
        if (c.status !== "no_contact" && c.status !== "archived") return false;
        return differenceInDays(new Date(), new Date(c.relationship_ended_at)) <= 14;
      })
      .forEach((candidate) => {
        if (!seenCandidateIds.has(candidate.id)) {
          activityItems.push({
            type: candidate.no_contact_active ? "no_contact" : "ended",
            candidate,
            date: new Date(candidate.relationship_ended_at!),
          });
          seenCandidateIds.add(candidate.id);
        }
      });

    // Add notification items
    const today = new Date();

    // Oxytocin alerts (recent intimacy)
    interactions
      .filter((i) => i.interaction_type === "intimate")
      .forEach((interaction) => {
        const daysSince = differenceInDays(today, new Date(interaction.interaction_date || ""));
        if (daysSince <= 3) {
          const candidate = candidates.find((c) => c.id === interaction.candidate_id);
          if (candidate) {
            activityItems.push({
              type: "notification",
              candidate,
              date: new Date(interaction.interaction_date || ""),
              notification: {
                notifType: "oxytocin",
                title: "Oxytocin active",
                message: `${candidate.nickname} — hormones affect judgment for 48-72hrs`,
                icon: "flame",
              },
            });
          }
        }
      });

    // Red flag alerts
    candidates.forEach((c) => {
      const flags = c.red_flags as unknown[];
      if (Array.isArray(flags) && flags.length >= 2 && c.status !== "archived" && c.status !== "no_contact") {
        activityItems.push({
          type: "notification",
          candidate: c,
          date: new Date(c.updated_at || c.created_at || ""),
          notification: {
            notifType: "red_flags",
            title: `${flags.length} red flags`,
            message: `${c.nickname} — Review concerns before proceeding`,
            icon: "alert",
          },
        });
      }
    });

    // High compatibility alerts
    candidates
      .filter((c) => c.compatibility_score && c.compatibility_score >= 80 && c.status !== "archived" && c.status !== "no_contact")
      .forEach((c) => {
        activityItems.push({
          type: "notification",
          candidate: c,
          date: new Date(c.last_score_update || c.updated_at || c.created_at || ""),
          notification: {
            notifType: "high_match",
            title: `${c.compatibility_score}% compatible`,
            message: `${c.nickname} — High potential match!`,
            icon: "heart",
          },
        });
      });

    // Low compatibility alerts
    candidates
      .filter((c) => c.compatibility_score && c.compatibility_score < 35 && !c.no_contact_active && c.status !== "archived")
      .forEach((c) => {
        activityItems.push({
          type: "notification",
          candidate: c,
          date: new Date(c.last_score_update || c.updated_at || c.created_at || ""),
          notification: {
            notifType: "low_match",
            title: `${c.compatibility_score}% compatibility`,
            message: `${c.nickname} — Consider starting No Contact`,
            icon: "trending",
          },
        });
      });

    // Stale candidates (no updates in 7+ days)
    candidates.forEach((c) => {
      if (c.updated_at && c.status !== "archived" && c.status !== "no_contact") {
        const daysSince = differenceInDays(today, new Date(c.updated_at));
        if (daysSince > 7) {
          activityItems.push({
            type: "notification",
            candidate: c,
            date: new Date(c.updated_at),
            notification: {
              notifType: "stale",
              title: `No updates in ${daysSince} days`,
              message: `${c.nickname} — Time to check in?`,
              icon: "clock",
            },
          });
        }
      }
    });

    // Sort by date and take top 8
    const recentActivity = activityItems
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 8);

    // Categorize by compatibility/feeling
    const goodCandidates = activeCandidates.filter(
      (c) => (c.compatibility_score && c.compatibility_score >= 40) && 
             (!Array.isArray(c.red_flags) || c.red_flags.length < 3)
    );
    const badCandidates = activeCandidates.filter(
      (c) => (c.compatibility_score && c.compatibility_score < 40) || 
             (Array.isArray(c.red_flags) && c.red_flags.length >= 3)
    );
    const neutralCandidates = activeCandidates.filter(
      (c) => !goodCandidates.includes(c) && !badCandidates.includes(c)
    );

    return {
      recentActivity,
      goodCandidates,
      badCandidates,
      neutralCandidates,
    };
  }, [candidates, interactions]);
}
