import React, { useEffect, useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  MapPin,
  Car,
  Plane,
  Globe,
  Ban
} from "lucide-react";
import { ScheduleCompatibilityAlert } from "@/components/candidate/ScheduleCompatibilityAlert";

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
  dating_casually: { label: "Dating Casually", color: "bg-teal-500/10 text-teal-600" },
  getting_serious: { label: "Getting Serious", color: "bg-pink-500/10 text-pink-600" },
  no_contact: { label: "No Contact", color: "bg-slate-500/10 text-slate-600" },
  archived: { label: "Archived", color: "bg-muted text-muted-foreground" },
};

const distanceConfig: Record<string, { label: string; icon: typeof MapPin; color: string }> = {
  same_city: { label: "Nearby", icon: MapPin, color: "text-emerald-600 bg-emerald-500/10" },
  regional: { label: "Regional", icon: Car, color: "text-blue-600 bg-blue-500/10" },
  far: { label: "Far", icon: Plane, color: "text-amber-600 bg-amber-500/10" },
  long_distance: { label: "Long Distance", icon: Globe, color: "text-purple-600 bg-purple-500/10" },
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
    case "dating_casually":
      return "Enjoy the moment - keep it light and fun";
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
  const { user } = useAuth();
  const [userSchedule, setUserSchedule] = useState<string | null>(null);
  const [daysSinceContact, setDaysSinceContact] = useState<number | null>(null);
  const status = statusConfig[candidate.status || "just_matched"];
  const redFlagCount = Array.isArray(candidate.red_flags) ? candidate.red_flags.length : 0;
  const greenFlagCount = Array.isArray(candidate.green_flags) ? candidate.green_flags.length : 0;
  const nextStep = getNextStep(candidate.status, candidate.updated_at);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Fetch user schedule
      const { data: profileData } = await supabase
        .from("profiles")
        .select("schedule_flexibility")
        .eq("user_id", user.id)
        .single();
      if (profileData) {
        setUserSchedule(profileData.schedule_flexibility);
      }

      // Fetch latest interaction
      const { data: interactionData } = await supabase
        .from("interactions")
        .select("interaction_date")
        .eq("candidate_id", candidate.id)
        .order("interaction_date", { ascending: false })
        .limit(1)
        .single();
      
      if (interactionData?.interaction_date) {
        const lastDate = new Date(interactionData.interaction_date);
        const today = new Date();
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setDaysSinceContact(diffDays);
      }
    };
    fetchData();
  }, [user, candidate.id]);

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
              <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-600 border-slate-300 gap-1">
                <Ban className="w-3 h-3" />
                Day {candidate.no_contact_day}
              </Badge>
            )}
            {candidate.age && (
              <span className="text-xs text-muted-foreground">{candidate.age}y</span>
            )}
            {(candidate as any).distance_approximation && distanceConfig[(candidate as any).distance_approximation] && (() => {
              const config = distanceConfig[(candidate as any).distance_approximation];
              const DistIcon = config.icon;
              return (
                <span className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                  <DistIcon className="w-3 h-3" />
                  {config.label}
                </span>
              );
            })()}
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

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
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
            {daysSinceContact !== null && !candidate.no_contact_active && (
              <span className={`flex items-center gap-1 ${daysSinceContact > 7 ? 'text-amber-600' : daysSinceContact > 14 ? 'text-destructive' : ''}`}>
                <Clock className="w-3 h-3" />
                {daysSinceContact === 0 ? 'Today' : daysSinceContact === 1 ? '1 day ago' : `${daysSinceContact}d ago`}
              </span>
            )}
            {candidate.met_via && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {candidate.met_app || candidate.met_via}
              </span>
            )}
            <ScheduleCompatibilityAlert
              userSchedule={userSchedule}
              candidateSchedule={(candidate as any).their_schedule_flexibility}
              variant="compact"
            />
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
