import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, CheckCircle, TrendingUp, ChevronRight, MessageCircle, Sparkles } from "lucide-react";

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
    if (user) fetchHealingData();
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

  const getScoreInfo = (score: number) => {
    if (score >= 75) return { text: "Ready to date!", subtext: "You're in a good place emotionally", icon: <CheckCircle className="w-4 h-4" /> };
    if (score >= 50) return { text: "Getting there", subtext: "Continue your healing journey", icon: <TrendingUp className="w-4 h-4" /> };
    return { text: "Focus on healing", subtext: "Take it one day at a time", icon: <Heart className="w-4 h-4" /> };
  };

  if (loading) return null;

  if (healingScore === null) {
    return (
      <Card 
        className="overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-[var(--shadow-soft)] active:scale-[0.99] border-border/60 bg-card/80 backdrop-blur-sm"
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

  const info = getScoreInfo(healingScore);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healingScore / 100) * circumference;

  return (
    <Card 
      className="overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-[var(--shadow-soft)] active:scale-[0.99] border-border/60 bg-card/80 backdrop-blur-sm"
      onClick={() => navigate("/patterns?tab=healing")}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="relative flex-shrink-0">
            <svg width="96" height="96" className="transform -rotate-90">
              <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/30" />
              <circle
                cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"
                className="text-primary"
                style={{ strokeDasharray: circumference, strokeDashoffset, transition: "stroke-dashoffset 0.5s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground">{healingScore}%</span>
              <Sparkles className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-primary bg-primary/10">
                {info.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground">Healing Score</h3>
            </div>
            <p className="text-xs font-medium text-primary">{info.text}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{info.subtext}</p>
            
            {healingScore < 75 && (
              <button 
                onClick={(e) => { e.stopPropagation(); navigate("/devi?prompt=healing"); }}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-xs font-medium text-primary"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Talk to D.E.V.I.</span>
              </button>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
};

export default HealingScoreCard;