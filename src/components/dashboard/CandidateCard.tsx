import React, { useEffect, useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
  Ban,
  Target,
  Check,
  X,
  HelpCircle,
  ShieldX,
  RotateCcw,
} from "lucide-react";
import { ScheduleCompatibilityAlert } from "@/components/candidate/ScheduleCompatibilityAlert";
import { useAutoDisqualify } from "@/hooks/useAutoDisqualify";
import { AutoDisqualifyDialog, RestoreCandidateDialog } from "@/components/candidate/AutoDisqualifyDialog";
import { toast } from "sonner";

type Candidate = Tables<"candidates">;

export interface CandidateAlert {
  type: string;
  label: string;
  color: string;
}

interface CandidateCardProps {
  candidate: Candidate;
  onUpdate: () => void;
  alerts?: CandidateAlert[];
  rank?: number | null;
  totalRanked?: number;
}

const rankBadgeConfig: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: "Top Match", color: "bg-amber-500/15 text-amber-600 border-amber-400/40", emoji: "👑" },
  2: { label: "Strong Match", color: "bg-sky-500/15 text-sky-600 border-sky-400/40", emoji: "🥈" },
  3: { label: "Great Match", color: "bg-orange-500/15 text-orange-600 border-orange-400/40", emoji: "🥉" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  just_matched: { label: "Just Matched", color: "bg-primary/10 text-primary" },
  texting: { label: "Texting", color: "bg-blue-500/10 text-blue-600" },
  planning_date: { label: "Planning Date", color: "bg-amber-500/10 text-amber-600" },
  dating: { label: "Situationship", color: "bg-emerald-500/10 text-emerald-600" },
  dating_casually: { label: "Dating Casually", color: "bg-teal-500/10 text-teal-600" },
  getting_serious: { label: "Getting Serious", color: "bg-pink-500/10 text-pink-600" },
  serious_relationship: { label: "Serious Relationship", color: "bg-rose-500/10 text-rose-600" },
  no_contact: { label: "No Contact", color: "bg-slate-500/10 text-slate-600" },
  archived: { label: "Archived", color: "bg-muted text-muted-foreground" },
};

const distanceConfig: Record<string, { label: string; icon: typeof MapPin; color: string }> = {
  same_city: { label: "Nearby", icon: MapPin, color: "text-emerald-600 bg-emerald-500/10" },
  regional: { label: "Regional", icon: Car, color: "text-blue-600 bg-blue-500/10" },
  far: { label: "Far", icon: Plane, color: "text-amber-600 bg-amber-500/10" },
  long_distance: { label: "Long Distance", icon: Globe, color: "text-purple-600 bg-purple-500/10" },
};

const zodiacConfig: Record<string, { emoji: string; label: string }> = {
  aries: { emoji: "♈", label: "Aries" },
  taurus: { emoji: "♉", label: "Taurus" },
  gemini: { emoji: "♊", label: "Gemini" },
  cancer: { emoji: "♋", label: "Cancer" },
  leo: { emoji: "♌", label: "Leo" },
  virgo: { emoji: "♍", label: "Virgo" },
  libra: { emoji: "♎", label: "Libra" },
  scorpio: { emoji: "♏", label: "Scorpio" },
  sagittarius: { emoji: "♐", label: "Sagittarius" },
  capricorn: { emoji: "♑", label: "Capricorn" },
  aquarius: { emoji: "♒", label: "Aquarius" },
  pisces: { emoji: "♓", label: "Pisces" },
};

// Goal alignment helper
type GoalAlignment = "match" | "mismatch" | "partial" | "unknown";

const goalHierarchy: Record<string, number> = {
  casual: 1,
  situationship: 2,
  dating: 3,
  serious: 4,
  marriage: 5,
  unsure: 0,
};

const getGoalAlignment = (userGoal: string | null | undefined, theirGoal: string | null | undefined): GoalAlignment => {
  if (!userGoal || !theirGoal) return "unknown";
  if (userGoal === "unsure" || theirGoal === "unsure") return "partial";
  if (userGoal === theirGoal) return "match";
  
  const userLevel = goalHierarchy[userGoal] || 0;
  const theirLevel = goalHierarchy[theirGoal] || 0;
  
  // If difference is 1 level, it's partial (close enough)
  if (Math.abs(userLevel - theirLevel) === 1) return "partial";
  
  return "mismatch";
};

const goalAlignmentConfig: Record<GoalAlignment, { label: string; icon: typeof Check; color: string }> = {
  match: { label: "Goals align", icon: Check, color: "text-emerald-600 bg-emerald-500/10" },
  partial: { label: "Goals close", icon: HelpCircle, color: "text-amber-600 bg-amber-500/10" },
  mismatch: { label: "Goals differ", icon: X, color: "text-rose-600 bg-rose-500/10" },
  unknown: { label: "", icon: Target, color: "" },
};

interface NextStepParams {
  status: string | null;
  updatedAt: string | null;
  compatibilityScore: number | null;
  redFlagCount: number;
  alerts: CandidateAlert[];
}

const getNextStep = ({ status, updatedAt, compatibilityScore, redFlagCount, alerts }: NextStepParams): string | null => {
  const daysSinceUpdate = updatedAt 
    ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Check for negative sentiment indicators
  const hasPostIntimacyDrop = alerts.some(a => a.type === "post_intimacy_drop");
  const hasLoveBombing = alerts.some(a => a.type === "love_bombing");
  const isLowScore = compatibilityScore !== null && compatibilityScore < 40;
  const hasManyRedFlags = redFlagCount >= 3;
  const isNegativeSentiment = hasPostIntimacyDrop || isLowScore || hasManyRedFlags;

  // Override for negative sentiment - always suggest caution
  if (isNegativeSentiment) {
    if (hasPostIntimacyDrop) {
      return "⚠️ Take a step back - evaluate if this is worth pursuing";
    }
    if (hasManyRedFlags) {
      return "🚩 Multiple red flags - consider ending things";
    }
    if (isLowScore) {
      return "📉 Low compatibility - reflect on whether to continue";
    }
  }

  // Love bombing warning (but might not be deal-breaker yet)
  if (hasLoveBombing) {
    return "⚠️ Slow down - watch for love bombing patterns";
  }

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

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onUpdate, alerts = [], rank = null, totalRanked = 0 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userSchedule, setUserSchedule] = useState<string | null>(null);
  const [daysSinceContact, setDaysSinceContact] = useState<number | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const {
    isAutoDisqualified,
    disqualifyReasons,
    isOverridden,
    newlyDisqualified,
    dismissNewlyDisqualified,
    override: applyOverride,
  } = useAutoDisqualify({ candidateId: candidate.id, candidate: candidate as Record<string, unknown> });

  const status = statusConfig[candidate.status || "just_matched"];
  const redFlagCount = Array.isArray(candidate.red_flags) ? candidate.red_flags.length : 0;
  const greenFlagCount = Array.isArray(candidate.green_flags) ? candidate.green_flags.length : 0;
  const nextStep = getNextStep({
    status: candidate.status,
    updatedAt: candidate.updated_at,
    compatibilityScore: candidate.compatibility_score,
    redFlagCount,
    alerts,
  });

  // Derived: is this candidate in a visually "disqualified" state?
  const isDQ = isAutoDisqualified && !isOverridden;

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

  const handleKeep = async () => {
    await applyOverride();
    dismissNewlyDisqualified();
    toast.success(`${candidate.nickname} kept active`);
    onUpdate();
  };

  const handleConfirmDQ = () => {
    dismissNewlyDisqualified();
    toast.info(`${candidate.nickname} is disqualified. You can find them under "Disqualified" filter.`);
  };

  const handleRestore = async (explanation: string) => {
    setRestoring(true);
    try {
      await supabase
        .from("candidates")
        .update({ auto_disqualify_override: true, notes: explanation || (candidate.notes ?? undefined) } as any)
        .eq("id", candidate.id);
      await applyOverride();
      toast.success(`${candidate.nickname} has been re-added!`);
      setShowRestoreDialog(false);
      onUpdate();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      {/* Auto-DQ Alert Dialog */}
      <AutoDisqualifyDialog
        open={newlyDisqualified}
        candidateName={candidate.nickname}
        reasons={disqualifyReasons}
        onConfirm={handleConfirmDQ}
        onKeep={handleKeep}
      />

      {/* Restore Dialog */}
      <RestoreCandidateDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        candidateName={candidate.nickname}
        disqualifyReasons={disqualifyReasons.length > 0 ? disqualifyReasons : ((candidate as any).auto_disqualify_reasons as string[] ?? [])}
        onRestore={handleRestore}
        loading={restoring}
      />

      {/* Disqualified card */}
      {isDQ ? (
        <div className="w-full bg-card rounded-xl border border-destructive/30 p-4 text-left opacity-75">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 border-2 border-destructive/30">
              <AvatarImage src={candidate.photo_url || undefined} />
              <AvatarFallback className="bg-destructive/10 text-destructive font-semibold">
                {candidate.nickname.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-muted-foreground truncate">{candidate.nickname}</h3>
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 shrink-0">
                  <ShieldX className="w-2.5 h-2.5" />
                  Disqualified
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {((candidate as any).auto_disqualify_reasons as string[] ?? disqualifyReasons).slice(0, 3).map((r: string, i: number) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    {r}
                  </span>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-7 text-xs gap-1 border-primary/40 text-primary"
                onClick={(e) => { e.stopPropagation(); setShowRestoreDialog(true); }}
              >
                <RotateCcw className="w-3 h-3" />
                Re-add candidate
              </Button>
            </div>
          </div>
        </div>
      ) : (
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
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {candidate.nickname}
                  </h3>
                  {(candidate as any).zodiac_sign && zodiacConfig[(candidate as any).zodiac_sign] && (
                    <span className="text-sm shrink-0" title={zodiacConfig[(candidate as any).zodiac_sign].label}>
                      {zodiacConfig[(candidate as any).zodiac_sign].emoji}
                    </span>
                  )}
                  {rank !== null && rank <= 3 && rankBadgeConfig[rank] && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 gap-0.5 shrink-0 font-bold ${rankBadgeConfig[rank].color}`}>
                      {rankBadgeConfig[rank].emoji} {rankBadgeConfig[rank].label}
                    </Badge>
                  )}
                  {rank !== null && rank > 3 && rank <= 5 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 shrink-0 border-muted-foreground/30 text-muted-foreground">
                      #{rank}
                    </Badge>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className={`text-xs ${status.color}`}>
                  {status.label}
                </Badge>
                {/* Auto-disqualified override badge */}
                {isOverridden && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 border-amber-400 text-amber-600">
                    <ShieldX className="w-2.5 h-2.5" />
                    DQ Override
                  </Badge>
                )}
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
                {(() => {
                  const alignment = getGoalAlignment(
                    (candidate as any).user_goal_for_candidate,
                    candidate.their_relationship_goal
                  );
                  if (alignment === "unknown") return null;
                  const config = goalAlignmentConfig[alignment];
                  const AlignIcon = config.icon;
                  return (
                    <span 
                      className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}
                      title={`You: ${(candidate as any).user_goal_for_candidate || 'Not set'} | They: ${candidate.their_relationship_goal || 'Unknown'}`}
                    >
                      <AlignIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  );
                })()}
              </div>

              {/* Alert Badges */}
              {alerts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {alerts.map((alert, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.color}`}
                    >
                      {alert.label}
                    </span>
                  ))}
                </div>
              )}

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
                  distance={candidate.distance_approximation}
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
      )}
    </>
  );
};

