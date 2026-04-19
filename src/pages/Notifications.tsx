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
  Sparkles,
  Home,
  Gift,
  Bell,
  Reply,
  MessageSquare,
  Send,
  Loader2
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { differenceInDays } from "date-fns";

type Candidate = Tables<"candidates">;
type Interaction = Tables<"interactions">;
type Referral = Tables<"referrals">;

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_type?: string;
  reply_to?: string | null;
}

interface Notification {
  id: string;
  type: "warning" | "info" | "success" | "urgent" | "advice" | "oxytocin" | "no-contact" | "low-score" | "referral" | "admin-message";
  icon: React.ReactNode;
  title: string;
  message: string;
  candidateId?: string;
  time?: string;
  adminMessage?: AdminMessage;
}

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<AdminMessage | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [candidatesRes, interactionsRes, adviceRes, referralsRes, adminMsgsRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("user_id", user!.id),
        supabase.from("interactions").select("*").eq("user_id", user!.id).order("interaction_date", { ascending: false }).limit(50),
        supabase.from("advice_tracking").select("*").eq("user_id", user!.id),
        supabase.from("referrals").select("*").eq("referrer_id", user!.id).eq("status", "converted").order("converted_at", { ascending: false }),
        supabase.from("admin_messages").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      ]);

      if (candidatesRes.data) setCandidates(candidatesRes.data);
      if (interactionsRes.data) setInteractions(interactionsRes.data);
      if (referralsRes.data) setReferrals(referralsRes.data);
      if (adminMsgsRes.data) setAdminMessages(adminMsgsRes.data as AdminMessage[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyingToMessage || !replyContent.trim() || !user) return;
    
    setSendingReply(true);
    try {
      const { error } = await supabase
        .from("admin_messages")
        .insert({
          user_id: user.id,
          sender_id: user.id,
          sender_type: 'user',
          title: `Re: ${replyingToMessage.title}`,
          message: replyContent.trim(),
          reply_to: replyingToMessage.id,
        });
      
      if (error) throw error;
      
      setReplyContent("");
      setReplyDialogOpen(false);
      setReplyingToMessage(null);
      fetchData(); // Refresh to show the reply
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setSendingReply(false);
    }
  };

  const notifications = useMemo(() => {
    const notifs: Notification[] = [];
    const today = new Date();

    // Referral notifications
    referrals.forEach((ref) => {
      const daysSince = ref.converted_at ? differenceInDays(today, new Date(ref.converted_at)) : 0;
      if (daysSince <= 7) {
        notifs.push({
          id: `referral-${ref.id}`,
          type: "referral",
          icon: <Gift className="w-4 h-4" />,
          title: "Friend signed up!",
          message: ref.trial_granted ? "You earned a free trial!" : "Your referral worked!",
          time: daysSince === 0 ? "Today" : `${daysSince}d ago`,
        });
      }
    });

    // Oxytocin alerts (recent intimacy) - deduplicated by candidate, one per 72hrs
    const intimateInteractions = interactions.filter((i) => i.interaction_type === "intimate");
    const seenOxyCandidates = new Set<string>();
    intimateInteractions.forEach((interaction) => {
      const daysSince = differenceInDays(today, new Date(interaction.interaction_date || ""));
      if (daysSince <= 3) {
        const candidate = candidates.find((c) => c.id === interaction.candidate_id);
        if (candidate && !seenOxyCandidates.has(candidate.id)) {
          seenOxyCandidates.add(candidate.id);
          notifs.push({
            id: `oxy-${candidate.id}`,
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

    // Low compatibility - suggest no contact
    candidates.filter((c) => c.compatibility_score && c.compatibility_score < 35 && !c.no_contact_active && c.status !== "archived").forEach((c) => {
      notifs.push({
        id: `low-score-${c.id}`,
        type: "low-score",
        icon: <TrendingUp className="w-4 h-4" />,
        title: `${c.compatibility_score}% compatibility`,
        message: `${c.nickname} — Consider starting No Contact`,
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

    // Admin messages
    adminMessages.forEach((msg) => {
      const daysSince = differenceInDays(today, new Date(msg.created_at));
      const isFromAdmin = msg.sender_type !== 'user';
      notifs.push({
        id: `admin-msg-${msg.id}`,
        type: "admin-message",
        icon: isFromAdmin ? <Bell className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />,
        title: msg.title,
        message: msg.message,
        time: daysSince === 0 ? "Today" : `${daysSince}d ago`,
        adminMessage: msg,
      });
    });

    return notifs;
  }, [candidates, interactions, referrals, adminMessages]);

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

  const getTypeStyles = (type: Notification["type"], adminMessage?: AdminMessage) => {
    if (type === "admin-message" && adminMessage) {
      return adminMessage.is_read 
        ? "bg-muted/50 text-foreground border-border" 
        : "bg-primary/10 text-primary border-primary/20";
    }
    switch (type) {
      case "oxytocin":
        return "bg-pink-500/10 text-pink-600 border-pink-500/20";
      case "no-contact":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      case "advice":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "warning":
        return "bg-amber-500/20 text-amber-600 border-amber-500/30";
      case "success":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "urgent":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "low-score":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "referral":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getIconBg = (type: Notification["type"], adminMessage?: AdminMessage) => {
    if (type === "admin-message" && adminMessage) {
      return adminMessage.is_read ? "bg-muted" : "bg-primary/20";
    }
    switch (type) {
      case "oxytocin": return "bg-pink-500/20";
      case "no-contact": return "bg-slate-500/20";
      case "advice": return "bg-purple-500/20";
      case "warning": return "bg-amber-500/30";
      case "success": return "bg-emerald-500/20";
      case "urgent": return "bg-destructive/20";
      case "low-score": return "bg-orange-500/20";
      case "referral": return "bg-green-500/20";
      default: return "bg-primary/20";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <Home className="w-5 h-5" />
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
            {notifications.map((notif) => {
              // Special rendering for admin messages
              if (notif.type === "admin-message" && notif.adminMessage) {
                const msg = notif.adminMessage;
                const isFromAdmin = msg.sender_type !== 'user';
                
                const handleMarkAsRead = async () => {
                  if (!msg.is_read) {
                    await supabase
                      .from("admin_messages")
                      .update({ is_read: true })
                      .eq("id", msg.id);
                    setAdminMessages(prev => 
                      prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m)
                    );
                  }
                };
                
                return (
                  <div
                    key={notif.id}
                    onClick={handleMarkAsRead}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${getTypeStyles(notif.type, msg)}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getIconBg(notif.type, msg)}`}>
                      {notif.icon}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm truncate ${msg.is_read ? 'text-foreground' : 'text-primary'}`}>
                          {notif.title}
                        </p>
                        {!msg.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                        {!isFromAdmin && (
                          <span className="text-xs text-muted-foreground">(Your reply)</span>
                        )}
                        {notif.time && (
                          <span className="text-[10px] opacity-60 shrink-0">{notif.time}</span>
                        )}
                      </div>
                      <p className="text-xs opacity-70 truncate">{notif.message}</p>
                    </div>
                    {isFromAdmin && !msg.reply_to && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyingToMessage(msg);
                          setReplyDialogOpen(true);
                        }}
                        className="shrink-0 text-xs h-7 px-2 text-muted-foreground hover:text-primary"
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                    )}
                  </div>
                );
              }
              
              // Standard notification rendering
              return (
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
              );
            })}
          </div>
        )}
      </main>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>
              {replyingToMessage?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{replyingToMessage?.message}</p>
            </div>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendReply} 
                disabled={sendingReply || !replyContent.trim()}
              >
                {sendingReply ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
