import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThreadHeaderProps {
  nickname: string;
  photoUrl: string | null;
  compatibilityScore: number | null;
  status: string | null;
  onViewProfile: () => void;
  onDelete?: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  just_matched: { color: "bg-blue-500", label: "New" },
  talking: { color: "bg-sky-500", label: "Talking" },
  first_date: { color: "bg-violet-500", label: "First Date" },
  dating: { color: "bg-primary", label: "Dating" },
  getting_serious: { color: "bg-emerald-500", label: "Serious" },
  exclusive: { color: "bg-amber-500", label: "Exclusive" },
  official: { color: "bg-rose-500", label: "Official" },
  complicated: { color: "bg-orange-500", label: "Complicated" },
  on_hold: { color: "bg-muted-foreground", label: "On Hold" },
  ended: { color: "bg-destructive", label: "Ended" },
  ghosted: { color: "bg-muted-foreground", label: "Ghosted" },
};

function getScoreColor(score: number | null) {
  if (!score) return "text-muted-foreground";
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-destructive";
}

export function ThreadHeader({
  nickname,
  photoUrl,
  compatibilityScore,
  status,
  onViewProfile,
  onDelete,
}: ThreadHeaderProps) {
  const navigate = useNavigate();
  const statusInfo = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="shrink-0 border-b border-border bg-background/80 backdrop-blur-xl px-3 py-2.5 flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => navigate("/candidates")}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <button onClick={onViewProfile} className="flex items-center gap-2.5 flex-1 min-w-0">
        <Avatar className="w-9 h-9 border border-border">
          <AvatarImage src={photoUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {nickname.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{nickname}</span>
            {statusInfo && (
              <div className="flex items-center gap-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", statusInfo.color)} />
                <span className="text-[10px] text-muted-foreground">{statusInfo.label}</span>
              </div>
            )}
          </div>
          {compatibilityScore !== null && (
            <span className={cn("text-xs font-bold", getScoreColor(compatibilityScore))}>
              {compatibilityScore}% compatible
            </span>
          )}
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onViewProfile}>View Full Profile</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/candidate/${nickname}`)}>
            Interaction History
          </DropdownMenuItem>
          {onDelete && (
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              Remove Candidate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
