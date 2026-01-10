import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, CheckCircle, TrendingUp, AlertTriangle, ChevronRight, Sparkles, MessageCircle } from "lucide-react";

interface HealingScoreCardProps {
  compact?: boolean;
}

export const HealingScoreCard: React.FC<HealingScoreCardProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [healingScore, setHealingScore] = useState<number | null>(null);
  const [hasAssessmentData, setHasAssessmentData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHealingData();
    }
  }, [user]);

  const fetchHealingData = async () => {
    if (!user) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("healing_score, ex_contact_status, over_ex_level, attachment_to_past")
      .eq("user_id", user.id)
      .single();

    if (!error && profile) {
      setHealingScore(profile.healing_score);
      setHasAssessmentData(!!(profile.ex_contact_status || profile.over_ex_level || profile.attachment_to_past));
    }
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getReadinessInfo = (score: number) => {
    if (score >= 75) {
      return {
        text: "Ready to date!",
        subtext: "You're in a good place emotionally",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
        icon: <CheckCircle className="w-4 h-4" />,
      };
    }
    if (score >= 50) {
      return {
        text: "Getting there",
        subtext: "Continue your healing journey",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
        icon: <TrendingUp className="w-4 h-4" />,
      };
    }
    return {
      text: "Focus on healing",
      subtext: "Take it one day at a time",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
      icon: <Heart className="w-4 h-4" />,
    };
  };

  if (loading) return null;

  // If no score yet, show CTA to complete assessment
  if (healingScore === null) {
    return (
      <Card 
        className="overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-md active:scale-[0.99] border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
        onClick={() => navigate("/settings?tab=preferences&section=healing")}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Check your healing score</h3>
              <p className="text-xs text-muted-foreground">Find out if you're ready to date</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const readiness = getReadinessInfo(healingScore);

  return (
    <Card 
      className={`overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-md active:scale-[0.99] border ${readiness.bgColor}`}
      onClick={() => navigate("/patterns?tab=healing")}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${readiness.color} bg-current/10`}>
              {readiness.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Healing Score</h3>
              <p className="text-xs text-muted-foreground">{readiness.subtext}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(healingScore)}`}>
              {healingScore}%
            </div>
            <div className={`text-xs font-medium ${readiness.color}`}>
              {readiness.text}
            </div>
          </div>
        </div>

        <Progress value={healingScore} className="h-2" />

        {healingScore < 75 && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate("/devi?prompt=healing");
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-xs font-medium text-primary"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Talk to D.E.V.I. about your healing</span>
            <ChevronRight className="w-3 h-3 ml-auto" />
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default HealingScoreCard;