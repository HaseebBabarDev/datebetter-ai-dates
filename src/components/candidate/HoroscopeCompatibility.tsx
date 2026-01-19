import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Star, Sparkles, AlertCircle, Check, X, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getZodiacLabel,
  getZodiacSymbol,
  getHoroscopeCompatibility,
} from "@/lib/zodiacUtils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from "react-router-dom";

interface HoroscopeCompatibilityProps {
  candidateId: string;
  candidateNickname: string;
  candidateZodiacSign: string | null;
}

export function HoroscopeCompatibility({
  candidateId,
  candidateNickname,
  candidateZodiacSign,
}: HoroscopeCompatibilityProps) {
  const { user } = useAuth();
  const [userZodiacSign, setUserZodiacSign] = useState<string | null>(null);
  const [zodiacModeEnabled, setZodiacModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserZodiac();
    }
  }, [user]);

  const loadUserZodiac = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("zodiac_sign, zodiac_mode_enabled")
        .eq("user_id", user!.id)
        .single();

      if (profile) {
        setUserZodiacSign(profile.zodiac_sign);
        setZodiacModeEnabled(profile.zodiac_mode_enabled || false);
      }
    } catch (error) {
      console.error("Error loading user zodiac:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if zodiac mode is not enabled
  if (!zodiacModeEnabled || loading) {
    return null;
  }

  const compatibility = getHoroscopeCompatibility(userZodiacSign, candidateZodiacSign);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-emerald-600 bg-emerald-500/10 border-emerald-500/30";
      case "medium":
        return "text-amber-600 bg-amber-500/10 border-amber-500/30";
      case "low":
      case "challenging":
        return "text-orange-600 bg-orange-500/10 border-orange-500/30";
      default:
        return "text-muted-foreground bg-muted/10";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "high":
        return "Great Match";
      case "medium":
        return "Good Potential";
      case "low":
        return "Requires Effort";
      case "challenging":
        return "Challenging";
      default:
        return level;
    }
  };

  return (
    <Card className="border-primary/20 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="w-5 h-5 text-primary" />
                Horoscope Compatibility
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-background/80">
                  Entertainment Only
                </Badge>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-4 space-y-4">
            {/* Missing partner zodiac sign */}
            {!candidateZodiacSign && userZodiacSign && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <Star className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Add {candidateNickname}'s zodiac sign to see compatibility
                </p>
                <Link
                  to={`/add-candidate?edit=${candidateId}`}
                  className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  <Pencil className="w-3 h-3" />
                  Edit Profile
                </Link>
              </div>
            )}

            {/* Compatibility Display */}
            {userZodiacSign && candidateZodiacSign && compatibility && (
              <div className="space-y-5">
                {/* Signs Display - Enhanced */}
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2 mx-auto border border-primary/20">
                      <span className="text-3xl">{getZodiacSymbol(userZodiacSign)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">You</div>
                    <div className="text-sm font-semibold">{getZodiacLabel(userZodiacSign)}</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2 mx-auto border border-primary/20">
                      <span className="text-3xl">{getZodiacSymbol(candidateZodiacSign)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{candidateNickname}</div>
                    <div className="text-sm font-semibold">{getZodiacLabel(candidateZodiacSign)}</div>
                  </div>
                </div>

                {/* Compatibility Score - Enhanced */}
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-primary">
                      {compatibility.percentage}%
                    </span>
                    <Badge className={cn("text-xs font-medium", getLevelColor(compatibility.level))}>
                      {getLevelLabel(compatibility.level)}
                    </Badge>
                  </div>
                  <Progress
                    value={compatibility.percentage}
                    className="h-2 max-w-xs mx-auto"
                  />
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {compatibility.description}
                  </p>
                </div>

                {/* Strengths & Challenges - Enhanced */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <Label className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Strengths
                    </Label>
                    <div className="space-y-1.5">
                      {compatibility.strengths.map((strength, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-muted-foreground">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <Label className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />
                      Challenges
                    </Label>
                    <div className="space-y-1.5">
                      {compatibility.challenges.map((challenge, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-muted-foreground">{challenge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit link */}
                <div className="text-center pt-1">
                  <Link
                    to={`/add-candidate?edit=${candidateId}`}
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Update {candidateNickname}'s sign in profile
                  </Link>
                </div>
              </div>
            )}

            {/* Missing user zodiac sign */}
            {!userZodiacSign && (
              <div className="flex gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p>
                    Set your zodiac sign in{" "}
                    <a href="/settings" className="text-primary font-medium hover:underline">
                      Settings
                    </a>{" "}
                    to see horoscope compatibility.
                  </p>
                </div>
              </div>
            )}

            {/* Disclaimer - Compact */}
            <div className="flex gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/20">
              <Star className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Just for fun!</span> This is not part of D.E.V.I.'s 
                AI analysis.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
