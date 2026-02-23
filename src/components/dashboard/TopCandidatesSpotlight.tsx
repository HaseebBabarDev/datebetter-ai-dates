import React, { useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Medal, Trophy, Sparkles, ChevronRight, TrendingUp, Heart, AlertTriangle } from "lucide-react";

type Candidate = Tables<"candidates">;

interface TopCandidatesSpotlightProps {
  candidates: Candidate[];
}

const getScoreConfig = (score: number) => {
  if (score >= 65) return {
    label: "Top Match",
    icon: Crown,
    gradient: "from-amber-400/20 via-yellow-300/10 to-amber-500/20",
    border: "border-amber-400/40",
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-500/15 text-amber-600 border-amber-400/40",
    glow: "shadow-[0_0_20px_-5px_hsl(45,93%,47%,0.3)]",
    emoji: "👑",
  };
  if (score >= 45) return {
    label: "Promising",
    icon: Trophy,
    gradient: "from-sky-400/15 via-blue-300/5 to-sky-500/15",
    border: "border-sky-400/30",
    iconColor: "text-sky-500",
    badgeBg: "bg-sky-500/15 text-sky-600 border-sky-400/40",
    glow: "",
    emoji: "💫",
  };
  if (score >= 30) return {
    label: "Needs Work",
    icon: Medal,
    gradient: "from-orange-400/15 via-amber-300/5 to-orange-500/15",
    border: "border-orange-400/30",
    iconColor: "text-orange-500",
    badgeBg: "bg-orange-500/15 text-orange-600 border-orange-400/40",
    glow: "",
    emoji: "⚠️",
  };
  return {
    label: "Consider DQ",
    icon: AlertTriangle,
    gradient: "from-destructive/10 via-destructive/5 to-destructive/10",
    border: "border-destructive/30",
    iconColor: "text-destructive",
    badgeBg: "bg-destructive/15 text-destructive border-destructive/40",
    glow: "",
    emoji: "🚩",
  };
};

export const TopCandidatesSpotlight: React.FC<TopCandidatesSpotlightProps> = ({ candidates }) => {
  const navigate = useNavigate();

  const topCandidates = useMemo(() => {
    const MIN_SCORE = 20; // Don't showcase candidates below this threshold
    return candidates
      .filter(c => 
        c.compatibility_score != null && 
        (c.compatibility_score ?? 0) >= MIN_SCORE &&
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
        </motion.div>
        <h3 className="text-sm font-semibold text-foreground">Your Top Matches</h3>
        <motion.div
          className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ transformOrigin: "left" }}
        />
      </div>

      <div className="space-y-2.5">
        <AnimatePresence>
          {topCandidates.map((candidate, idx) => {
            const score = candidate.compatibility_score ?? 0;
            const config = getScoreConfig(score);
            const RankIcon = config.icon;
            const redFlagCount = Array.isArray(candidate.red_flags) ? candidate.red_flags.length : 0;
            const greenFlagCount = Array.isArray(candidate.green_flags) ? candidate.green_flags.length : 0;

            return (
              <motion.button
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.12 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/candidate/${candidate.id}`)}
                className={`w-full rounded-xl border ${config.border} ${config.glow} bg-gradient-to-r ${config.gradient} p-3 text-left transition-shadow duration-300 hover:shadow-md`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank indicator */}
                  <div className="relative">
                    <Avatar className={`w-12 h-12 border-2 ${config.border}`}>
                      <AvatarImage src={candidate.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {candidate.nickname.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-sky-400' : 'bg-orange-400'} shadow-sm`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15, delay: idx * 0.12 + 0.3 }}
                    >
                      <span className="text-xs font-bold text-white">#{idx + 1}</span>
                    </motion.div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground truncate text-sm">{candidate.nickname}</h4>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 gap-0.5 shrink-0 font-bold ${config.badgeBg}`}>
                        {config.emoji} {config.label}
                      </Badge>
                    </div>
                    
                    {/* Score bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.12 + 0.4 }}
                        >
                          <Progress value={score} className="h-1.5" />
                        </motion.div>
                      </div>
                      <motion.span 
                        className="text-xs font-bold text-primary tabular-nums"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.12 + 0.5, type: "spring" }}
                      >
                        {score}%
                      </motion.span>
                    </div>

                    {/* Micro stats */}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {(candidate.met_app || candidate.met_via) && (
                        <span className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-full border border-border/50">
                          {candidate.met_app || candidate.met_via}
                        </span>
                      )}
                      {greenFlagCount > 0 && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5" /> {greenFlagCount}
                        </span>
                      )}
                      {redFlagCount > 0 && (
                        <span className="text-[10px] text-destructive flex items-center gap-0.5">
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
        </AnimatePresence>
      </div>
    </motion.section>
  );
};
