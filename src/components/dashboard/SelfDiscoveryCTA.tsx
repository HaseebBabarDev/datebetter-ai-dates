import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, MessageCircle, Brain, ChevronRight, CheckCircle2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SelfDiscoveryCTAProps {
  userId: string;
  variant?: "full" | "compact";
}

export const SelfDiscoveryCTA: React.FC<SelfDiscoveryCTAProps> = ({ userId, variant = "full" }) => {
  const navigate = useNavigate();
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizStatus();
  }, [userId]);

  const loadQuizStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("quiz_attachment_completed_at, quiz_love_language_completed_at, quiz_personality_completed_at, quiz_dating_style_completed_at")
        .eq("user_id", userId)
        .single();

      if (profile) {
        let count = 0;
        if ((profile as any).quiz_dating_style_completed_at) count++;
        if ((profile as any).quiz_attachment_completed_at) count++;
        if ((profile as any).quiz_love_language_completed_at) count++;
        if ((profile as any).quiz_personality_completed_at) count++;
        setCompletedCount(count);
      }
    } catch (error) {
      console.error("Error loading quiz status:", error);
    } finally {
      setLoading(false);
    }
  };

  // All quizzes completed - don't show CTA
  if (completedCount >= 4) {
    return null;
  }

  if (variant === "compact") {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
        onClick={() => navigate("/self-discovery")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Take Self-Discovery Quizzes</p>
                <p className="text-xs text-muted-foreground">
                  {completedCount}/4 completed • Personalize D.E.V.I.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Personalize D.E.V.I.</h3>
            <p className="text-sm text-muted-foreground">
              Take quick quizzes to help D.E.V.I. understand you better
            </p>
          </div>
        </div>

        {/* Quiz Progress */}
        <div className="flex items-center gap-2 mb-4">
          {[
            { icon: Target, label: "Dating" },
            { icon: Heart, label: "Attachment" },
            { icon: MessageCircle, label: "Love" },
            { icon: Brain, label: "Personality" },
          ].map((quiz, index) => {
            const Icon = quiz.icon;
            const isCompleted = index < completedCount;
            return (
              <div
                key={quiz.label}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs",
                  isCompleted 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="font-medium hidden sm:inline">{quiz.label}</span>
              </div>
            );
          })}
        </div>

        <Button 
          onClick={() => navigate("/self-discovery")}
          className="w-full group"
          size="sm"
        >
          {completedCount === 0 ? "Start Quizzes" : "Continue Quizzes"}
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};

export default SelfDiscoveryCTA;
