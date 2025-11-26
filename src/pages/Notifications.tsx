import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Heart, 
  Clock, 
  TrendingUp, 
  Lightbulb,
  Flame,
  Ban,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { differenceInDays } from "date-fns";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;

interface Notification {
  id: string;
  type: "warning" | "info" | "success" | "urgent" | "advice" | "oxytocin" | "no-contact";
  icon: React.ReactNode;
  title: string;
  message: string;
  candidateId?: string;
  time?: string;
}

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [candidatesRes, interactionsRes, adviceRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("user_id", user!.id),
        supabase.from("interactions").select("*").eq("user_id", user!.id).order("interaction_date", { ascending: false }).limit(50),
        supabase.from("advice_tracking").select("*").eq("user_id", user!.id),
      ]);

      if (candidatesRes.data) setCandidates(candidatesRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const notifications = useMemo(() => {
    const notifs: Notification[] = [];
    const today = new Date();

    // Oxytocin alerts (recent intimacy)
    const intimateInteractions = interactions.filter((i) => i.interaction_type === "intimate");
    intimateInteractions.forEach((interaction) => {
      const daysSince = differenceInDays(today, new Date(interaction.interaction_date || ""));
      if (daysSince <= 3) {
        const candidate = candidates.find((c) => c.id === interaction.candidate_id);
        if (candidate) {
          notifs.push({
            id: `oxy-${interaction.id}`,
            type: "oxytocin",
            icon: <Flame className="w-4 h-4" />,
            title: `Oxytocin active`,
            message: `${candidate.nickname} — hormones affect judgment for 48-72hrs`,
            candidateId: candidate.id,
            time: daysSince === 0 ? "Today" : `${daysSince}d ago`,
          });
        }
      }
    });

    // No contact progress
    candidates.filter((c) => c.no_contact_active).forEach((c) => {
      notifs.push({
        id: `nc-${c.id}`,
        type: "no-contact",
        icon: <Ban className="w-4 h-4" />,
        title: `Day ${c.no_contact_day || 0} No Contact`,
        message: `${c.nickname} — Stay strong, you're doing great!`,
        candidateId: c.id,
      });
    });

    // Pending advice
    candidates.forEach((c) => {
      const scoreData = c.score_breakdown as any;
      if (scoreData?.advice) {
        notifs.push({
          id: `advice-${c.id}`,
          type: "advice",
          icon: <Lightbulb className="w-4 h-4" />,
          title: `Advice for ${c.nickname}`,
          message: scoreData.advice.slice(0, 60) + (scoreData.advice.length > 60 ? "..." : ""),
          candidateId: c.id,
        });
      }
    });

    // Red flag alerts
    candidates.forEach((c) => {
      const flags = c.red_flags as unknown[];
      if (Array.isArray(flags) && flags.length >= 2) {
        notifs.push({
          id: `flags-${c.id}`,
          type: "warning",
          icon: <AlertTriangle className="w-4 h-4" />,
          title: `${flags.length} red flags`,
          message: `${c.nickname} — Review concerns before proceeding`,
          candidateId: c.id,
        });
      }
    });

    // High compatibility
    candidates.filter((c) => c.compatibility_score && c.compatibility_score >= 80).forEach((c) => {
      notifs.push({
        id: `match-${c.id}`,
        type: "success",
        icon: <Heart className="w-4 h-4" />,
        title: `${c.compatibility_score}% compatible`,
        message: `${c.nickname} — High potential match!`,
        candidateId: c.id,
      });
    });

    // Stale candidates
    candidates.forEach((c) => {
      if (c.updated_at && c.status !== "archived" && c.status !== "no_contact") {
        const daysSince = differenceInDays(today, new Date(c.updated_at));
        if (daysSince > 7) {
          notifs.push({
            id: `stale-${c.id}`,
            type: "info",
            icon: <Clock className="w-4 h-4" />,
            title: `No updates in ${daysSince} days`,
            message: `${c.nickname} — Time to check in?`,
            candidateId: c.id,
          });
        }
      }
    });

    return notifs;
  }, [candidates, interactions]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getTypeStyles = (type: Notification["type"]) => {
    switch (type) {
      case "oxytocin":
        return "bg-pink-500/10 text-pink-600 border-pink-500/20";
      case "no-contact":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      case "advice":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "success":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "urgent":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getIconBg = (type: Notification["type"]) => {
    switch (type) {
      case "oxytocin": return "bg-pink-500/20";
      case "no-contact": return "bg-slate-500/20";
      case "advice": return "bg-purple-500/20";
      case "warning": return "bg-amber-500/20";
      case "success": return "bg-emerald-500/20";
      case "urgent": return "bg-destructive/20";
      default: return "bg-primary/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Notifications</h1>
              <p className="text-xs text-muted-foreground">{notifications.length} active</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-lg">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No notifications right now</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => notif.candidateId && navigate(`/candidate/${notif.candidateId}`)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] ${getTypeStyles(notif.type)}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getIconBg(notif.type)}`}>
                  {notif.icon}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{notif.title}</p>
                    {notif.time && (
                      <span className="text-[10px] opacity-60 shrink-0">{notif.time}</span>
                    )}
                  </div>
                  <p className="text-xs opacity-70 truncate">{notif.message}</p>
                </div>
                {notif.candidateId && (
                  <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
