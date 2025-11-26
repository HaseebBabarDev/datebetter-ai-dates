import React from "react";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  AlertTriangle, 
  Clock, 
  MessageCircle, 
  Sparkles,
  ChevronRight,
  Zap,
  MapPin
} from "lucide-react";

type Candidate = Tables<"candidates">;

interface CandidateCardProps {
  candidate: Candidate;
  onUpdate: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  just_matched: { label: "Just Matched", color: "bg-primary/10 text-primary" },
  texting: { label: "Texting", color: "bg-blue-500/10 text-blue-600" },
  planning_date: { label: "Planning Date", color: "bg-amber-500/10 text-amber-600" },
  dating: { label: "Dating", color: "bg-emerald-500/10 text-emerald-600" },
  getting_serious: { label: "Getting Serious", color: "bg-pink-500/10 text-pink-600" },
  no_contact: { label: "No Contact", color: "bg-slate-500/10 text-slate-600" },
  archived: { label: "Archived", color: "bg-muted text-muted-foreground" },
};

const distanceConfig: Record<string, { label: string; icon: string; color: string }> = {
  same_city: { label: "Nearby", icon: "📍", color: "text-emerald-600 bg-emerald-500/10" },
  regional: { label: "Regional", icon: "🚗", color: "text-blue-600 bg-blue-500/10" },
  far: { label: "Far", icon: "✈️", color: "text-amber-600 bg-amber-500/10" },
  long_distance: { label: "Long Distance", icon: "🌍", color: "text-purple-600 bg-purple-500/10" },
};

const getNextStep = (status: string | null, updatedAt: string | null): string | null => {
  const daysSinceUpdate = updatedAt 
    ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  switch (status) {
    case "just_matched":
      return "Send a message to break the ice";
    case "texting":
      if (daysSinceUpdate > 3) return "It's been a few days - check in or suggest a date";
      return "Keep chatting or suggest meeting up";
    case "planning_date":
      return "Confirm the date details";
    case "dating":
      if (daysSinceUpdate > 7) return "Schedule your next date";
      return "Log your latest interaction";
    case "getting_serious":
      return "Have the relationship talk when ready";
    case "no_contact":
      return "Stay strong - focus on yourself";
    case "archived":
      return null;
    default:
      return "Add more details to their profile";
  }
};

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onUpdate }) => {
  const navigate = useNavigate();
  const status = statusConfig[candidate.status || "just_matched"];
  const redFlagCount = Array.isArray(candidate.red_flags) ? candidate.red_flags.length : 0;
  const greenFlagCount = Array.isArray(candidate.green_flags) ? candidate.green_flags.length : 0;
  const nextStep = getNextStep(candidate.status, candidate.updated_at);

  const handleClick = () => {
    navigate(`/candidate/${candidate.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-card rounded-xl border border-border p-4 text-left transition-all duration-200 hover:shadow-lg hover:border-primary/30 active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 border-2 border-border">
          <AvatarImage src={candidate.photo_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {candidate.nickname.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">
              {candidate.nickname}
            </h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className={`text-xs ${status.color}`}>
              {status.label}
            </Badge>
            {candidate.no_contact_active && candidate.no_contact_day !== null && (
              <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-600 border-slate-300">
                🚫 Day {candidate.no_contact_day}
              </Badge>
            )}
            {candidate.age && (
              <span className="text-xs text-muted-foreground">{candidate.age}y</span>
            )}
            {(candidate as any).distance_approximation && distanceConfig[(candidate as any).distance_approximation] && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${distanceConfig[(candidate as any).distance_approximation].color}`}>
                <span>{distanceConfig[(candidate as any).distance_approximation].icon}</span>
                {distanceConfig[(candidate as any).distance_approximation].label}
              </span>
            )}
          </div>

          {candidate.compatibility_score && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Compatibility
                </span>
                <span className="text-xs font-medium text-primary">
                  {candidate.compatibility_score}%
                </span>
              </div>
              <Progress value={candidate.compatibility_score} className="h-1.5" />
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            {greenFlagCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Heart className="w-3 h-3" />
                {greenFlagCount}
              </span>
            )}
            {redFlagCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="w-3 h-3" />
                {redFlagCount}
              </span>
            )}
            {candidate.no_contact_active && candidate.no_contact_day && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Day {candidate.no_contact_day}
              </span>
            )}
            {candidate.met_via && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {candidate.met_app || candidate.met_via}
              </span>
            )}
          </div>

          {nextStep && (
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs text-primary/80 flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                {nextStep}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
