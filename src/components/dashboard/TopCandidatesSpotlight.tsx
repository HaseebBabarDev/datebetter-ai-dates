import React, { useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight, Heart, AlertTriangle } from "lucide-react";

type Candidate = Tables<"candidates">;

interface TopCandidatesSpotlightProps {
  candidates: Candidate[];
}

const getRankLabel = (score: number) => {
  if (score >= 65) return "Top Match";
  if (score >= 45) return "Promising";
  if (score >= 30) return "Needs Work";
  return "Consider DQ";
};

export const TopCandidatesSpotlight: React.FC<TopCandidatesSpotlightProps> = ({ candidates }) => {
  const navigate = useNavigate();

  const topCandidates = useMemo(() => {
    return candidates
      .filter(
        (c) =>
          c.status !== "archived" &&
          c.status !== "no_contact" &&
          !(c as any).is_auto_disqualified
      )
      .sort((a, b) => (b.compatibility_score ?? 0) - (a.compatibility_score ?? 0))
      .slice(0, 3);
  }, [candidates]);

  if (topCandidates.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Your Top Matches</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>

      <div className="space-y-2">
        {topCandidates.map((candidate, idx) => {
          const score = candidate.compatibility_score ?? 0;
          const label = getRankLabel(score);
          const redFlagCount = Array.isArray(candidate.red_flags) ? candidate.red_flags.length : 0;
          const greenFlagCount = Array.isArray(candidate.green_flags) ? candidate.green_flags.length : 0;

          return (
            <motion.button
              key={candidate.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08, ease: "easeOut" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/candidate/${candidate.id}`)}
              className="w-full rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-3 text-left transition-all duration-200 hover:shadow-[var(--shadow-soft)] hover:border-primary/20"
            >
              <div className="flex items-center gap-3">
                {/* Rank + Avatar */}
                <div className="relative">
                  <Avatar className="w-11 h-11 border border-border/60 shadow-sm">
                    <AvatarImage src={candidate.photo_url || undefined} />
                    <AvatarFallback className="bg-muted text-foreground font-semibold text-xs">
                      {candidate.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
                    <span className="text-[9px] font-bold">#{idx + 1}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground truncate text-sm">{candidate.nickname}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/80 text-muted-foreground font-medium border border-border/50 shrink-0">
                      {label}
                    </span>
                  </div>
                  
                  {/* Score bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1">
                      <Progress value={score} className="h-1.5" />
                    </div>
                    <span className="text-xs font-bold text-primary tabular-nums">
                      {score}%
                    </span>
                  </div>

                  {/* Micro stats */}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {(candidate.met_app || candidate.met_via) && (
                      <span className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-full border border-border/50">
                        {(candidate.met_app || candidate.met_via || "").replace(/_/g, " ")}
                      </span>
                    )}
                    {greenFlagCount > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5 text-primary" /> {greenFlagCount}
                      </span>
                    )}
                    {redFlagCount > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> {redFlagCount}
                      </span>
                    )}
                    {candidate.status && (
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {(candidate.status || "").replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
};