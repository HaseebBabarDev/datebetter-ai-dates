import React from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CandidateCardProps {
  id: string;
  nickname: string;
  photoUrl: string | null;
  compatibilityScore: number | null;
  status: string | null;
  updatedAt: string | null;
  latestInsight?: string | null;
}

const STATUS_DOT: Record<string, string> = {
  just_matched: "bg-blue-500",
  talking: "bg-sky-500",
  first_date: "bg-violet-500",
  dating: "bg-primary",
  getting_serious: "bg-emerald-500",
  exclusive: "bg-amber-500",
  official: "bg-rose-500",
  complicated: "bg-orange-500",
  on_hold: "bg-muted-foreground",
  ended: "bg-destructive",
  ghosted: "bg-muted-foreground",
};

function getScoreColor(score: number | null) {
  if (!score) return "text-muted-foreground";
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-destructive";
}

export function CandidateCard({
  id,
  nickname,
  photoUrl,
  compatibilityScore,
  status,
  updatedAt,
  latestInsight,
}: CandidateCardProps) {
  const navigate = useNavigate();
  const dotColor = status ? STATUS_DOT[status] || "bg-muted-foreground" : "bg-muted-foreground";

  return (
    <button
      onClick={() => navigate(`/thread/${id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-[0.98]"
    >
      <div className="relative">
        <Avatar className="w-12 h-12 border border-border">
          <AvatarImage src={photoUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {nickname.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card", dotColor)} />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{nickname}</span>
          {compatibilityScore !== null && (
            <span className={cn("text-xs font-bold", getScoreColor(compatibilityScore))}>
              {compatibilityScore}%
            </span>
          )}
        </div>
        {latestInsight ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{latestInsight}</p>
        ) : updatedAt ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
          </p>
        ) : null}
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
