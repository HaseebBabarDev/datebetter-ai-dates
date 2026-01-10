import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;

export interface OxytocinAlert {
  candidate: Candidate;
  daysSince: number;
  phase: string;
}

export interface LoveBombingAlert {
  candidate: Candidate;
  reason: string;
}

export interface PostIntimacyDropAlert {
  candidate: Candidate;
  reason: string;
}

export interface CandidateAlertBadge {
  type: string;
  label: string;
  color: string;
}

export function useOxytocinAlerts(
  candidates: Candidate[],
  interactions: Interaction[]
): OxytocinAlert[] {
  return useMemo(() => {
    const alerts: OxytocinAlert[] = [];
    const intimateInteractions = interactions.filter((i) => i.interaction_type === "intimate");

    intimateInteractions.forEach((interaction) => {
      const daysSince = differenceInDays(new Date(), new Date(interaction.interaction_date || ""));
      if (daysSince <= 5) {
        const candidate = candidates.find((c) => c.id === interaction.candidate_id);
        if (candidate && !alerts.find((a) => a.candidate.id === candidate.id)) {
          let phase = "";
          if (daysSince === 0) phase = "Oxytocin peaked — bonding feelings strongest";
          else if (daysSince <= 2) phase = "Oxytocin still elevated — attachment feelings high";
          else phase = "Oxytocin dropping — you may feel more clear-headed now";
          alerts.push({ candidate, daysSince, phase });
        }
      }
    });

    return alerts;
  }, [candidates, interactions]);
}

export function usePostIntimacyDropAlerts(
  candidates: Candidate[],
  interactions: Interaction[]
): PostIntimacyDropAlert[] {
  return useMemo(() => {
    const alerts: PostIntimacyDropAlert[] = [];
    const flaggedIds = new Set<string>();
    
    candidates.forEach((candidate) => {
      // First check AI-detected red flags for post-intimacy patterns
      const redFlags = Array.isArray(candidate.red_flags) ? candidate.red_flags : [];
      const postIntimacyFlagPhrases = [
        "post-intimacy", "post intimacy", "after intimacy", "after sex", 
        "pulled away", "fell off", "dropped off", "drop off", "ghost after",
        "distance after", "distant after", "less interested after",
        "breadcrumb", "slow fade", "switched up after"
      ];
      
      const hasPostIntimacyRedFlag = redFlags.some((flag: unknown) => {
        const lowerFlag = (String(flag) || "").toLowerCase();
        return postIntimacyFlagPhrases.some(phrase => lowerFlag.includes(phrase));
      });
      
      if (hasPostIntimacyRedFlag) {
        alerts.push({ candidate, reason: "AI detected post-intimacy behavior change" });
        flaggedIds.add(candidate.id);
        return;
      }
      
      // Then check interaction patterns
      const candidateInteractions = interactions
        .filter((i) => i.candidate_id === candidate.id)
        .sort((a, b) => new Date(a.interaction_date || "").getTime() - new Date(b.interaction_date || "").getTime());
      
      // Find intimate interaction
      const intimateIdx = candidateInteractions.findIndex((i) => i.interaction_type === "intimate");
      if (intimateIdx === -1) return;
      
      const postIntimateInteractions = candidateInteractions.slice(intimateIdx + 1);
      
      // Check notes for drop indicators in post-intimacy interactions
      const dropPhrases = ["fell off", "falling off", "falling for", "distant", "distance", "pulled away", "less interested", "ghosting", "slow fade", "breadcrumbing", "mixed signals", "switched up", "didn't answer", "didn't pick up", "not responding"];
      const allPostNotes = postIntimateInteractions.map(i => (i.notes || "").toLowerCase()).join(" ");
      const candidateNotes = (candidate.notes || "").toLowerCase();
      const hasDropLanguage = dropPhrases.some(phrase => allPostNotes.includes(phrase) || candidateNotes.includes(phrase));
      
      // Check for feeling drop after intimacy
      let feelingDrop = false;
      if (postIntimateInteractions.length > 0) {
        const avgPostFeeling = postIntimateInteractions.reduce((sum, i) => sum + (i.overall_feeling || 3), 0) / postIntimateInteractions.length;
        feelingDrop = avgPostFeeling <= 2;
      }
      
      if ((feelingDrop || hasDropLanguage) && !flaggedIds.has(candidate.id)) {
        alerts.push({ 
          candidate, 
          reason: hasDropLanguage ? "Post-intimacy pullback detected" : "Feelings dropped after intimacy"
        });
      }
    });
    
    return alerts;
  }, [candidates, interactions]);
}

export function useLoveBombingAlerts(
  candidates: Candidate[],
  interactions: Interaction[]
): LoveBombingAlert[] {
  return useMemo(() => {
    const alerts: LoveBombingAlert[] = [];
    
    const loveBombingPhrases = [
      "too good to be true", "already said i love you", "wants to move in", 
      "moving too fast", "constant texting", "showering with gifts", 
      "future faking", "soulmate", "never felt this way", "falling for me",
      "wants to have kids", "wants kids with me", "hes falling", "he's falling",
      "she's falling", "shes falling", "love you already", "marry me",
      "move in together", "intense", "overwhelming",
      "promised but", "says but doesn't", "said but didn't", "all talk", 
      "empty promises", "keeps promising", "never follows through", "talks big",
      "can't afford", "couldn't afford", "no money for", "broke but",
      "overpromising", "over promising", "too soon", "way too fast",
      "only been", "just met", "barely know", "week and already",
      "days and already", "planning our future", "talking about marriage",
      "talking about kids", "talking about moving", "words don't match"
    ];
    
    candidates.forEach((candidate) => {
      const candidateInteractions = interactions.filter((i) => i.candidate_id === candidate.id);
      
      // Check candidate notes for love bombing language
      const candidateNotes = (candidate.notes || "").toLowerCase();
      const hasLoveBombingInCandidateNotes = loveBombingPhrases.some(phrase => candidateNotes.includes(phrase));
      
      if (hasLoveBombingInCandidateNotes) {
        alerts.push({ candidate, reason: "Love bombing signs in notes" });
        return;
      }
      
      // Check interaction notes
      const notesText = candidateInteractions.map(i => (i.notes || "").toLowerCase()).join(" ");
      const hasLoveBombingLanguage = loveBombingPhrases.some(phrase => notesText.includes(phrase));
      
      if (hasLoveBombingLanguage) {
        alerts.push({ candidate, reason: "Love bombing language detected" });
        return;
      }
      
      // Check for rapid interaction frequency
      if (candidateInteractions.length < 3) return;
      
      const firstInteractionDate = candidateInteractions.length > 0 
        ? new Date(candidateInteractions[candidateInteractions.length - 1].interaction_date || candidate.created_at || "")
        : null;
      
      if (firstInteractionDate) {
        const daysSinceFirst = differenceInDays(new Date(), firstInteractionDate);
        const interactionsPerWeek = candidateInteractions.length / Math.max(1, daysSinceFirst / 7);
        
        if (daysSinceFirst <= 14 && candidateInteractions.length >= 7) {
          alerts.push({ candidate, reason: "Very intense start — 7+ interactions in 2 weeks" });
        } else if (interactionsPerWeek >= 5 && daysSinceFirst <= 30) {
          alerts.push({ candidate, reason: "Rapid escalation detected" });
        }
      }
    });
    
    return alerts;
  }, [candidates, interactions]);
}

export function useCandidateAlerts(
  oxytocinAlerts: OxytocinAlert[],
  loveBombingAlerts: LoveBombingAlert[],
  postIntimacyDropAlerts: PostIntimacyDropAlert[]
): Record<string, CandidateAlertBadge[]> {
  return useMemo(() => {
    const alertsMap: Record<string, CandidateAlertBadge[]> = {};
    
    // Oxytocin alerts
    oxytocinAlerts.forEach(({ candidate, daysSince }) => {
      if (!alertsMap[candidate.id]) alertsMap[candidate.id] = [];
      alertsMap[candidate.id].push({
        type: "oxytocin",
        label: daysSince <= 2 ? "🔥 Bonding high" : "Oxytocin clearing",
        color: daysSince <= 2 ? "bg-pink-500/20 text-pink-600" : "bg-amber-500/20 text-amber-600"
      });
    });
    
    // Love bombing alerts
    loveBombingAlerts.forEach(({ candidate }) => {
      if (!alertsMap[candidate.id]) alertsMap[candidate.id] = [];
      alertsMap[candidate.id].push({
        type: "love_bombing",
        label: "⚠️ Love bombing?",
        color: "bg-orange-500/20 text-orange-600"
      });
    });
    
    // Post-intimacy drop alerts
    postIntimacyDropAlerts.forEach(({ candidate }) => {
      if (!alertsMap[candidate.id]) alertsMap[candidate.id] = [];
      alertsMap[candidate.id].push({
        type: "post_intimacy_drop",
        label: "📉 Post-intimacy drop",
        color: "bg-purple-500/20 text-purple-600"
      });
    });
    
    return alertsMap;
  }, [oxytocinAlerts, loveBombingAlerts, postIntimacyDropAlerts]);
}
