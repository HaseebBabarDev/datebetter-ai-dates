import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, Heart, Sparkles, Calendar, ThumbsUp, ThumbsDown, Minus,
  ChevronRight, ChevronDown, XCircle, Ban, RefreshCw, Flame, 
  AlertTriangle, Clock, Bell, Lightbulb
} from "lucide-react";
import { format } from "date-fns";
import { RecentActivityItem, CandidateRecap } from "@/hooks/useCandidateRecap";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<"candidates">;

interface RecentActivityCardProps {
  recap: CandidateRecap;
  onCandidatesUpdate: () => void;
}

export function RecentActivityCard({ recap, onCandidatesUpdate }: RecentActivityCardProps) {
  const navigate = useNavigate();
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [endingNoContactId, setEndingNoContactId] = useState<string | null>(null);

  const handleReopenRelationship = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReopeningId(candidateId);
    try {
      const { error } = await supabase
        .from("candidates")
        .update({
          status: "texting",
          relationship_ended_at: null,
          end_reason: null,
        })
        .eq("id", candidateId);
      
      if (!error) {
        onCandidatesUpdate();
      }
    } catch (error) {
      console.error("Error reopening relationship:", error);
    } finally {
      setReopeningId(null);
    }
  };

  const handleEndNoContact = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEndingNoContactId(candidateId);
    try {
      const { error } = await supabase
        .from("candidates")
        .update({
          no_contact_active: false,
          status: "texting",
          relationship_ended_at: null,
          end_reason: null,
        })
        .eq("id", candidateId);
      
      if (!error) {
        onCandidatesUpdate();
      }
    } catch (error) {
      console.error("Error ending no contact:", error);
    } finally {
      setEndingNoContactId(null);
    }
  };

  const getNotifStyles = (notifType: string) => {
    switch (notifType) {
      case "oxytocin": return { bg: "bg-pink-500/10 hover:bg-pink-500/20", iconBg: "bg-pink-500/20", text: "text-pink-600" };
      case "red_flags": return { bg: "bg-amber-500/10 hover:bg-amber-500/20", iconBg: "bg-amber-500/20", text: "text-amber-600" };
      case "high_match": return { bg: "bg-emerald-500/10 hover:bg-emerald-500/20", iconBg: "bg-emerald-500/20", text: "text-emerald-600" };
      case "low_match": return { bg: "bg-orange-500/10 hover:bg-orange-500/20", iconBg: "bg-orange-500/20", text: "text-orange-600" };
      case "stale": return { bg: "bg-slate-500/10 hover:bg-slate-500/20", iconBg: "bg-slate-500/20", text: "text-slate-600" };
      case "advice": return { bg: "bg-purple-500/10 hover:bg-purple-500/20", iconBg: "bg-purple-500/20", text: "text-purple-600" };
      default: return { bg: "bg-primary/10 hover:bg-primary/20", iconBg: "bg-primary/20", text: "text-primary" };
    }
  };

  const getNotifIcon = (icon: string) => {
    switch (icon) {
      case "flame": return <Flame className="w-4 h-4" />;
      case "alert": return <AlertTriangle className="w-4 h-4" />;
      case "heart": return <Heart className="w-4 h-4" />;
      case "trending": return <TrendingUp className="w-4 h-4" />;
      case "clock": return <Clock className="w-4 h-4" />;
      case "lightbulb": return <Lightbulb className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const renderActivityItem = (item: RecentActivityItem, idx: number) => {
    if (item.type === "matched" && item.candidate) {
      return (
        <button
          key={`matched-${item.candidate.id}-${idx}`}
          onClick={() => navigate(`/candidate/${item.candidate!.id}`)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={item.candidate.photo_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {item.candidate.nickname.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">{item.candidate.nickname}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Matched • {format(item.date, "MMM d")}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      );
    }

    if (item.type === "interacted" && item.interaction && item.candidate) {
      return (
        <button
          key={`interacted-${item.candidate.id}-${idx}`}
          onClick={() => navigate(`/candidate/${item.candidate!.id}`)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={item.candidate.photo_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {item.candidate.nickname.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">{item.candidate.nickname}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {item.interaction.interaction_type.replace("_", " ")} • {format(item.date, "MMM d")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {item.interaction.overall_feeling && item.interaction.overall_feeling >= 4 && (
              <ThumbsUp className="w-4 h-4 text-emerald-500" />
            )}
            {item.interaction.overall_feeling && item.interaction.overall_feeling <= 2 && (
              <ThumbsDown className="w-4 h-4 text-rose-500" />
            )}
            {item.interaction.overall_feeling === 3 && (
              <Minus className="w-4 h-4 text-muted-foreground" />
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
      );
    }

    if (item.type === "ended" && item.candidate) {
      return (
        <div key={`ended-${item.candidate.id}-${idx}`} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors">
          <button
            onClick={() => navigate(`/candidate/${item.candidate!.id}`)}
            className="flex items-center gap-3 flex-1"
          >
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={item.candidate.photo_url || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                {item.candidate.nickname.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{item.candidate.nickname}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Ended • {format(item.date, "MMM d")}
                {item.candidate.end_reason && (
                  <> — {item.candidate.end_reason}</>
                )}
              </p>
            </div>
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => handleReopenRelationship(item.candidate!.id, e)}
            disabled={reopeningId === item.candidate.id}
            className="shrink-0 text-xs h-7 px-2"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${reopeningId === item.candidate.id ? 'animate-spin' : ''}`} />
            Reopen
          </Button>
        </div>
      );
    }

    if (item.type === "no_contact" && item.candidate) {
      return (
        <div key={`nc-${item.candidate.id}-${idx}`} className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
          <button
            onClick={() => navigate(`/candidate/${item.candidate!.id}`)}
            className="flex items-center gap-3 flex-1"
          >
            <Avatar className="w-10 h-10 border border-slate-300">
              <AvatarImage src={item.candidate.photo_url || undefined} />
              <AvatarFallback className="bg-slate-500/20 text-slate-600 text-sm">
                {item.candidate.nickname.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{item.candidate.nickname}</p>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Ban className="w-3 h-3" />
                No Contact — Day {item.candidate.no_contact_day || 1} • {format(item.date, "MMM d")}
              </p>
            </div>
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => handleEndNoContact(item.candidate!.id, e)}
            disabled={endingNoContactId === item.candidate.id}
            className="shrink-0 text-xs h-7 px-2"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${endingNoContactId === item.candidate.id ? 'animate-spin' : ''}`} />
            End NC
          </Button>
        </div>
      );
    }

    if (item.type === "notification" && item.notification && item.candidate) {
      const styles = getNotifStyles(item.notification.notifType);
      return (
        <button
          key={`notif-${item.notification.notifType}-${item.candidate.id}-${idx}`}
          onClick={() => navigate(`/candidate/${item.candidate!.id}`)}
          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${styles.bg}`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg} ${styles.text}`}>
            {getNotifIcon(item.notification.icon)}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className={`text-sm font-medium ${styles.text}`}>{item.notification.title}</p>
            <p className="text-xs text-muted-foreground truncate">{item.notification.message}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      );
    }

    return null;
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 bg-[image:var(--gradient-subtle)] border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Recent Activity
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 text-primary font-medium cursor-help">
                  <Sparkles className="w-3 h-3" />
                  D.E.V.I.
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Dating Evaluation & Vetting Intelligence</p>
                <p className="text-xs text-muted-foreground">AI-powered insights for your dating journey</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
      </div>
      <div className="p-3 space-y-2">
        {recap.recentActivity.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        )}
        {(showAllActivity ? recap.recentActivity : recap.recentActivity.slice(0, 5)).map((item, idx) => 
          renderActivityItem(item, idx)
        )}
        
        {/* See More / See Less Button */}
        {recap.recentActivity.length > 5 && (
          <button
            onClick={() => setShowAllActivity(!showAllActivity)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAllActivity ? 'rotate-180' : ''}`} />
            {showAllActivity ? 'See Less' : `See ${recap.recentActivity.length - 5} More`}
          </button>
        )}
      </div>
    </div>
  );
}
