import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, PartyPopper, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface SuccessfulRelationshipCTAProps {
  candidateId: string;
  candidateName: string;
  compatibilityScore: number;
  interactionDays: number;
  onAcknowledged?: () => void;
}

export const SuccessfulRelationshipCTA: React.FC<SuccessfulRelationshipCTAProps> = ({
  candidateId,
  candidateName,
  compatibilityScore,
  interactionDays,
  onAcknowledged,
}) => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [alreadyTracked, setAlreadyTracked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if already tracked
  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("behavioral_patterns")
        .select("id")
        .eq("candidate_id", candidateId)
        .eq("user_id", user.id)
        .eq("pattern_type", "successful_relationship")
        .maybeSingle();
      
      setAlreadyTracked(!!data);
      setLoading(false);
    };
    
    checkExisting();
  }, [candidateId, user]);

  const handleCelebrate = async () => {
    if (!user) return;
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#c4b5fd', '#fda4af', '#fb923c'],
    });

    try {
      // Track in behavioral_patterns
      const { error } = await supabase
        .from("behavioral_patterns")
        .insert({
          user_id: user.id,
          candidate_id: candidateId,
          pattern_type: "successful_relationship",
          severity: "positive",
          acknowledged: true,
          details: {
            compatibility_score: compatibilityScore,
            interaction_days: interactionDays,
            celebrated_at: new Date().toISOString(),
          },
        });

      if (error) throw error;

      toast.success("Congratulations! This milestone has been recorded 🎉");
      setAlreadyTracked(true);
      onAcknowledged?.();
    } catch (error) {
      console.error("Error tracking successful relationship:", error);
      toast.error("Failed to save milestone");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading || alreadyTracked || dismissed) return null;

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-rose-500/10">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-rose-400" />
      
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              It's Going Great!
              <Sparkles className="w-4 h-4 text-pink-400" />
            </h3>
            <p className="text-xs text-muted-foreground">
              {interactionDays}+ days together • {compatibilityScore}% compatible
            </p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          You and <span className="font-medium text-foreground">{candidateName}</span> have been going strong! 
          This looks like the start of something beautiful. 💜
        </p>
        
        <Button 
          onClick={handleCelebrate}
          className="w-full gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
        >
          <PartyPopper className="w-4 h-4" />
          Celebrate This Milestone!
        </Button>
      </div>
    </Card>
  );
};

// Helper to check if CTA should be shown
export const checkSuccessfulRelationship = async (
  candidateId: string,
  userId: string,
  compatibilityScore: number | null
): Promise<{ show: boolean; interactionDays: number }> => {
  // Must have 70%+ compatibility
  if (!compatibilityScore || compatibilityScore < 70) {
    return { show: false, interactionDays: 0 };
  }

  // Get earliest and latest interaction dates
  const { data: interactions } = await supabase
    .from("interactions")
    .select("interaction_date")
    .eq("candidate_id", candidateId)
    .eq("user_id", userId)
    .order("interaction_date", { ascending: true });

  if (!interactions || interactions.length < 2) {
    return { show: false, interactionDays: 0 };
  }

  const dates = interactions
    .map(i => i.interaction_date)
    .filter(Boolean)
    .map(d => new Date(d!));

  if (dates.length < 2) {
    return { show: false, interactionDays: 0 };
  }

  const earliest = dates[0];
  const latest = dates[dates.length - 1];
  const daysDiff = Math.floor((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));

  // Must have 60+ days of interactions
  if (daysDiff < 60) {
    return { show: false, interactionDays: daysDiff };
  }

  // Check if already tracked
  const { data: existing } = await supabase
    .from("behavioral_patterns")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("user_id", userId)
    .eq("pattern_type", "successful_relationship")
    .maybeSingle();

  if (existing) {
    return { show: false, interactionDays: daysDiff };
  }

  return { show: true, interactionDays: daysDiff };
};
