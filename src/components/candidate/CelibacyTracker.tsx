import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Trophy,
  Star,
  Flame,
  Shield,
  Calendar,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

interface CelibacyTrackerProps {
  candidateId: string;
  candidateName: string;
}

interface CelibacyRecord {
  id: string;
  user_id: string;
  candidate_id: string | null;
  start_date: string;
  end_date: string | null;
  current_streak_days: number;
  longest_streak_days: number;
  is_active: boolean;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const MILESTONE_DAYS = [7, 14, 21, 30, 60, 90];

const ENCOURAGEMENT_MESSAGES = [
  { minDays: 0, message: "Every journey begins with a single step. You've got this!" },
  { minDays: 1, message: "Day by day, you're building strength and self-control." },
  { minDays: 7, message: "One week! You're proving your commitment to yourself." },
  { minDays: 14, message: "Two weeks strong! Your willpower is growing." },
  { minDays: 21, message: "Three weeks! New habits are forming." },
  { minDays: 30, message: "One month! You're an inspiration." },
  { minDays: 60, message: "Two months! Your dedication is remarkable." },
  { minDays: 90, message: "Three months! You've achieved something incredible." },
];

export const CelibacyTracker: React.FC<CelibacyTrackerProps> = ({
  candidateId,
  candidateName,
}) => {
  const { user } = useAuth();
  const [record, setRecord] = useState<CelibacyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (user) {
      fetchRecord();
    }
  }, [user, candidateId]);

  const fetchRecord = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("celibacy_tracking")
        .select("*")
        .eq("user_id", user!.id)
        .eq("candidate_id", candidateId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRecord(data as CelibacyRecord);
        calculateStreak(data.start_date);
      } else {
        setRecord(null);
        setCurrentStreak(0);
      }
    } catch (error) {
      console.error("Error fetching celibacy record:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const days = differenceInDays(today, start) + 1;
    setCurrentStreak(Math.max(1, days));
  };

  const startTracker = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("celibacy_tracking")
        .insert({
          user_id: user!.id,
          candidate_id: candidateId,
          start_date: new Date().toISOString().split("T")[0],
          current_streak_days: 1,
          is_active: true,
          reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;

      setRecord(data as CelibacyRecord);
      setCurrentStreak(1);
      setReason("");
      toast.success("Celibacy tracker started! Stay strong! 💪");
    } catch (error) {
      console.error("Error starting tracker:", error);
      toast.error("Failed to start tracker");
    } finally {
      setSaving(false);
    }
  };

  const resetTracker = async () => {
    if (!record) return;
    
    setSaving(true);
    try {
      // Mark current record as ended
      await supabase
        .from("celibacy_tracking")
        .update({
          is_active: false,
          end_date: new Date().toISOString().split("T")[0],
          current_streak_days: currentStreak,
          longest_streak_days: Math.max(record.longest_streak_days, currentStreak),
        })
        .eq("id", record.id);

      // Create new record
      const { data, error } = await supabase
        .from("celibacy_tracking")
        .insert({
          user_id: user!.id,
          candidate_id: candidateId,
          start_date: new Date().toISOString().split("T")[0],
          current_streak_days: 1,
          longest_streak_days: Math.max(record.longest_streak_days, currentStreak),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setRecord(data as CelibacyRecord);
      setCurrentStreak(1);
      toast("Tracker reset. Day 1 begins now. You've got this! 💜");
    } catch (error) {
      console.error("Error resetting tracker:", error);
      toast.error("Failed to reset tracker");
    } finally {
      setSaving(false);
    }
  };

  const stopTracker = async () => {
    if (!record) return;
    
    setSaving(true);
    try {
      await supabase
        .from("celibacy_tracking")
        .update({
          is_active: false,
          end_date: new Date().toISOString().split("T")[0],
          current_streak_days: currentStreak,
          longest_streak_days: Math.max(record.longest_streak_days, currentStreak),
        })
        .eq("id", record.id);

      setRecord(null);
      setCurrentStreak(0);
      toast.success("Tracker ended. Your progress has been saved.");
    } catch (error) {
      console.error("Error stopping tracker:", error);
      toast.error("Failed to stop tracker");
    } finally {
      setSaving(false);
    }
  };

  const getEncouragementMessage = () => {
    const message = [...ENCOURAGEMENT_MESSAGES]
      .reverse()
      .find((m) => currentStreak >= m.minDays);
    return message?.message || ENCOURAGEMENT_MESSAGES[0].message;
  };

  const getNextMilestone = () => {
    return MILESTONE_DAYS.find((d) => d > currentStreak) || 90;
  };

  const getMilestoneProgress = () => {
    const next = getNextMilestone();
    const prev = [...MILESTONE_DAYS].reverse().find((d) => d <= currentStreak) || 0;
    const progress = ((currentStreak - prev) / (next - prev)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Not tracking - show start option
  if (!record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Celibacy Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Track your celibacy journey with {candidateName}. Setting boundaries
            around physical intimacy can help you focus on emotional connection
            and self-growth.
          </p>

          <div className="space-y-3">
            <Textarea
              placeholder="Why are you starting this journey? (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={2}
            />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Target className="w-4 h-4" />
                  Start Celibacy Tracker
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start Celibacy Tracker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You're committing to abstaining from physical intimacy with{" "}
                    {candidateName}. This is a personal journey — there's no
                    judgment, only support. 💜
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Not Yet</AlertDialogCancel>
                  <AlertDialogAction onClick={startTracker} disabled={saving}>
                    I'm Ready
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active tracking
  const nextMilestone = getNextMilestone();
  const longestStreak = Math.max(record.longest_streak_days, currentStreak);

  return (
    <Card className="border-pink-500/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Celibacy Tracker
          </CardTitle>
          <Badge variant="outline" className="text-pink-600 border-pink-300">
            Day {currentStreak}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress to next milestone */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress to Day {nextMilestone}</span>
            <span>{currentStreak} / {nextMilestone} days</span>
          </div>
          <Progress value={getMilestoneProgress()} className="h-3" />
        </div>

        {/* Encouragement Message */}
        <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
              {currentStreak >= 30 ? (
                <Trophy className="w-5 h-5 text-pink-500" />
              ) : currentStreak >= 7 ? (
                <Flame className="w-5 h-5 text-pink-500" />
              ) : (
                <Star className="w-5 h-5 text-pink-500" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">
                {currentStreak >= 30
                  ? "Amazing Progress!"
                  : currentStreak >= 7
                  ? "Keep Going!"
                  : "You're on Your Way!"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {getEncouragementMessage()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-pink-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-pink-600">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{longestStreak}</div>
            <div className="text-xs text-muted-foreground">Longest</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{nextMilestone - currentStreak}</span>
            </div>
            <div className="text-xs text-muted-foreground">To Milestone</div>
          </div>
        </div>

        {/* Milestone badges */}
        <div className="flex flex-wrap gap-2">
          {MILESTONE_DAYS.map((milestone) => (
            <Badge
              key={milestone}
              variant={currentStreak >= milestone ? "default" : "outline"}
              className={
                currentStreak >= milestone
                  ? "bg-pink-500/20 text-pink-600 border-pink-300"
                  : "opacity-50"
              }
            >
              {milestone} days {currentStreak >= milestone && "✓"}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2">
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Tracker?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end your current streak of {currentStreak} days and
                  start fresh. Your longest streak will be saved. It's okay —
                  setbacks are part of the journey. 💜
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Going</AlertDialogCancel>
                <AlertDialogAction onClick={resetTracker} disabled={saving}>
                  Reset & Restart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="flex-1 text-muted-foreground">
                End Tracker
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Celibacy Tracker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to stop tracking? Your progress will be
                  saved, and you can start again anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Tracking</AlertDialogCancel>
                <AlertDialogAction onClick={stopTracker} disabled={saving}>
                  End Tracker
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {record.reason && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Your reason:</p>
            <p className="text-sm">{record.reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
