import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
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
import {
  Shield,
  Trophy,
  Phone,
  MessageCircle,
  Heart,
  Flame,
  Star,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

type Candidate = Tables<"candidates">;
type NoContactProgress = Tables<"no_contact_progress">;

interface NoContactModeProps {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => Promise<void>;
}

const DAILY_MESSAGES = [
  { day: 1, title: "Day 1: The Beginning", message: "You've made a brave decision. The first day is often the hardest. Remember why you started this journey.", icon: Shield },
  { day: 2, title: "Day 2: Stay Strong", message: "The urge to reach out might be strong today. Sit with those feelings - they will pass.", icon: Heart },
  { day: 3, title: "Day 3: Three Days Strong", message: "You're building momentum! Each day without contact is a gift you give yourself.", icon: Flame },
  { day: 4, title: "Day 4: Breaking Patterns", message: "Old habits are being rewired. Your brain is starting to adjust to this new normal.", icon: Star },
  { day: 5, title: "Day 5: Almost a Week", message: "Five days of choosing yourself. That's something to be proud of!", icon: Trophy },
  { day: 6, title: "Day 6: Self-Discovery", message: "Use this time to reconnect with who you are outside of this relationship.", icon: Sparkles },
  { day: 7, title: "Day 7: One Week!", message: "🎉 You made it through the hardest week! The first 7 days are crucial and you did it.", icon: Trophy },
  { day: 8, title: "Day 8: New Week Energy", message: "Week two begins. You're stronger than you were 8 days ago.", icon: Shield },
  { day: 9, title: "Day 9: Clarity Coming", message: "With distance comes perspective. Notice how your thoughts are shifting.", icon: Star },
  { day: 10, title: "Day 10: Double Digits", message: "10 days! You're proving to yourself that you can do hard things.", icon: Flame },
  { day: 11, title: "Day 11: Healing in Progress", message: "Your heart is healing even when you can't feel it. Trust the process.", icon: Heart },
  { day: 12, title: "Day 12: Stay the Course", message: "Don't let a moment of weakness undo days of progress. You've got this.", icon: Shield },
  { day: 13, title: "Day 13: Lucky You", message: "Lucky day 13! You're choosing yourself over someone who isn't choosing you.", icon: Star },
  { day: 14, title: "Day 14: Two Weeks!", message: "🎉 Two weeks strong! You're halfway through the crucial first month.", icon: Trophy },
  { day: 15, title: "Day 15: Momentum", message: "You've built real momentum now. Keep riding this wave.", icon: Flame },
  { day: 16, title: "Day 16: Your Worth", message: "Remember: you deserve someone who doesn't make you question your worth.", icon: Heart },
  { day: 17, title: "Day 17: Growth Mode", message: "Personal growth happens in discomfort. You're growing every single day.", icon: Sparkles },
  { day: 18, title: "Day 18: Boundaries", message: "No contact is a boundary. You're learning to protect your peace.", icon: Shield },
  { day: 19, title: "Day 19: Almost 3 Weeks", message: "19 days of choosing yourself. That's nearly three weeks of self-love.", icon: Star },
  { day: 20, title: "Day 20: The Home Stretch", message: "You're in the home stretch now. 10 more days to your goal!", icon: Flame },
  { day: 21, title: "Day 21: Three Weeks!", message: "🎉 Three weeks! Science says it takes 21 days to form a new habit.", icon: Trophy },
  { day: 22, title: "Day 22: New Habits Forming", message: "Your new normal is taking shape. How does it feel?", icon: Heart },
  { day: 23, title: "Day 23: Strength", message: "Look at how strong you've become. The person from day 1 would be proud.", icon: Shield },
  { day: 24, title: "Day 24: Almost There", message: "Less than a week to go! You can see the finish line.", icon: Star },
  { day: 25, title: "Day 25: Reflection", message: "Take time to reflect on what you've learned about yourself.", icon: Sparkles },
  { day: 26, title: "Day 26: Self-Love", message: "You've been practicing self-love for 26 days. That's beautiful.", icon: Heart },
  { day: 27, title: "Day 27: Three Days Left", message: "Three more days! You've come too far to give up now.", icon: Flame },
  { day: 28, title: "Day 28: Four Weeks!", message: "🎉 Four full weeks of no contact! You're incredible.", icon: Trophy },
  { day: 29, title: "Day 29: Tomorrow's the Day", message: "One more day until graduation. How far you've come!", icon: Star },
  { day: 30, title: "Day 30: GRADUATION!", message: "🎓🎉 YOU DID IT! 30 days of choosing yourself. You are STRONG.", icon: Trophy },
];

export const NoContactMode: React.FC<NoContactModeProps> = ({
  candidate,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<NoContactProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    if (candidate.no_contact_active && user) {
      fetchProgress();
      calculateCurrentDay();
    }
  }, [candidate, user]);

  const calculateCurrentDay = () => {
    if (candidate.no_contact_start_date) {
      const startDate = new Date(candidate.no_contact_start_date);
      const today = new Date();
      const daysDiff = differenceInDays(today, startDate) + 1;
      setCurrentDay(Math.min(daysDiff, 30));
    }
  };

  const fetchProgress = async () => {
    const { data } = await supabase
      .from("no_contact_progress")
      .select("*")
      .eq("candidate_id", candidate.id)
      .eq("user_id", user!.id)
      .order("day_number", { ascending: true });

    if (data) setProgress(data);
  };

  const startNoContact = async () => {
    setLoading(true);
    try {
      await onUpdate({
        no_contact_active: true,
        no_contact_start_date: new Date().toISOString().split("T")[0],
        no_contact_day: 1,
        status: "no_contact",
      });

      // Create day 1 progress entry
      await supabase.from("no_contact_progress").insert({
        user_id: user!.id,
        candidate_id: candidate.id,
        day_number: 1,
      });

      toast.success("No Contact Mode activated. You've got this! 💪");
      setCurrentDay(1);
      fetchProgress();
    } catch (error) {
      toast.error("Failed to start No Contact Mode");
    } finally {
      setLoading(false);
    }
  };

  const recordHoover = async () => {
    setLoading(true);
    try {
      // Check if today's entry exists
      const todayEntry = progress.find((p) => p.day_number === currentDay);

      if (todayEntry) {
        await supabase
          .from("no_contact_progress")
          .update({ hoover_attempt: true })
          .eq("id", todayEntry.id);
      } else {
        await supabase.from("no_contact_progress").insert({
          user_id: user!.id,
          candidate_id: candidate.id,
          day_number: currentDay,
          hoover_attempt: true,
        });
      }

      toast.success("Hoover attempt recorded. Stay strong! 🛡️");
      fetchProgress();
    } catch (error) {
      toast.error("Failed to record hoover");
    } finally {
      setLoading(false);
    }
  };

  const brokeNoContact = async () => {
    setLoading(true);
    try {
      const todayEntry = progress.find((p) => p.day_number === currentDay);

      if (todayEntry) {
        await supabase
          .from("no_contact_progress")
          .update({ broke_nc: true })
          .eq("id", todayEntry.id);
      }

      await onUpdate({
        no_contact_active: false,
        no_contact_day: currentDay,
      });

      toast("No Contact ended. It's okay - healing isn't linear. 💜");
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const restartNoContact = async () => {
    setLoading(true);
    try {
      // Clear old progress
      await supabase
        .from("no_contact_progress")
        .delete()
        .eq("candidate_id", candidate.id)
        .eq("user_id", user!.id);

      await onUpdate({
        no_contact_active: true,
        no_contact_start_date: new Date().toISOString().split("T")[0],
        no_contact_day: 1,
      });

      await supabase.from("no_contact_progress").insert({
        user_id: user!.id,
        candidate_id: candidate.id,
        day_number: 1,
      });

      toast.success("Fresh start! Day 1 begins now. 💪");
      setCurrentDay(1);
      fetchProgress();
    } catch (error) {
      toast.error("Failed to restart");
    } finally {
      setLoading(false);
    }
  };

  const todayMessage = DAILY_MESSAGES.find((m) => m.day === currentDay) || DAILY_MESSAGES[0];
  const hooverCount = progress.filter((p) => p.hoover_attempt).length;
  const progressPercent = (currentDay / 30) * 100;

  // Not in No Contact Mode
  if (!candidate.no_contact_active) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            No Contact Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Need to create distance? No Contact Mode will guide you through 30 days
            of healing with daily messages, progress tracking, and support.
          </p>

          {candidate.no_contact_day && candidate.no_contact_day > 1 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Previous attempt: Made it to Day {candidate.no_contact_day}
              </p>
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full gap-2">
                <Shield className="w-4 h-4" />
                Start No Contact Mode
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start No Contact Mode?</AlertDialogTitle>
                <AlertDialogDescription>
                  You're committing to 30 days of no contact with {candidate.nickname}.
                  This means no texts, calls, social media stalking, or asking friends about them.
                  You've got this! 💜
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Not Yet</AlertDialogCancel>
                <AlertDialogAction onClick={startNoContact} disabled={loading}>
                  I'm Ready
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  }

  // Completed 30 days
  if (currentDay >= 30) {
    return (
      <Card className="border-primary">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            🎓 No Contact Graduate!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              YOU DID IT!
            </h3>
            <p className="text-muted-foreground">
              30 days of choosing yourself. You survived {hooverCount} hoover
              attempts and came out stronger.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">30</div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{hooverCount}</div>
              <div className="text-xs text-muted-foreground">Hoovers Survived</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onUpdate({ no_contact_active: false, status: "archived" })}
          >
            Archive {candidate.nickname}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active No Contact Mode
  const IconComponent = todayMessage.icon;

  return (
    <Card className="border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            No Contact Mode
          </CardTitle>
          <Badge variant="outline" className="text-primary border-primary">
            Day {currentDay}/30
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Started</span>
            <span>{Math.round(progressPercent)}% complete</span>
            <span>Day 30</span>
          </div>
        </div>

        {/* Today's Message */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{todayMessage.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {todayMessage.message}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{30 - currentDay}</span>
            </div>
            <div className="text-xs text-muted-foreground">Days Left</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{hooverCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">Hoovers Survived</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
            onClick={recordHoover}
            disabled={loading}
          >
            <MessageCircle className="w-4 h-4" />
            They Tried to Contact Me (Hoover)
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                <XCircle className="w-4 h-4 mr-2" />
                I Broke No Contact
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>It's okay 💜</AlertDialogTitle>
                <AlertDialogDescription>
                  Healing isn't linear. You made it {currentDay} days, and that's
                  still progress. Would you like to start fresh?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Going</AlertDialogCancel>
                <AlertDialogAction onClick={brokeNoContact}>
                  End No Contact
                </AlertDialogAction>
                <AlertDialogAction onClick={restartNoContact} className="bg-primary">
                  Restart from Day 1
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Day Progress Dots */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">Your Journey</p>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 30 }, (_, i) => {
              const dayNum = i + 1;
              const dayProgress = progress.find((p) => p.day_number === dayNum);
              const isCompleted = dayNum < currentDay;
              const isCurrent = dayNum === currentDay;
              const hadHoover = dayProgress?.hoover_attempt;

              return (
                <div
                  key={dayNum}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                      : isCompleted
                      ? hadHoover
                        ? "bg-amber-500 text-white"
                        : "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                  title={
                    hadHoover
                      ? `Day ${dayNum} - Survived hoover!`
                      : isCompleted
                      ? `Day ${dayNum} - Complete`
                      : `Day ${dayNum}`
                  }
                >
                  {isCompleted ? (
                    hadHoover ? (
                      <Shield className="w-3 h-3" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )
                  ) : (
                    dayNum
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
