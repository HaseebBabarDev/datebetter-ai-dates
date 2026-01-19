import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Star, Sparkles, AlertCircle, Check, X, ChevronDown, ChevronUp, Pencil, Heart, MessageCircle, Calendar, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getZodiacLabel,
  getZodiacSymbol,
  getHoroscopeCompatibility,
  getWeeklyPrediction,
} from "@/lib/zodiacUtils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const weeklyPrediction = getWeeklyPrediction(userZodiacSign, candidateZodiacSign);

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

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case "high":
        return "text-emerald-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-orange-600";
      default:
        return "text-muted-foreground";
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
          <CardContent className="pt-3 space-y-3">
            {/* Missing partner zodiac sign */}
            {!candidateZodiacSign && userZodiacSign && (
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                  <Star className="w-5 h-5 text-muted-foreground" />
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
              <div className="space-y-3">
                {/* Signs Display */}
                <div className="flex items-center justify-center gap-5 py-1">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-1 mx-auto border border-primary/20">
                      <span className="text-xl">{getZodiacSymbol(userZodiacSign)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">You</div>
                    <div className="text-xs font-semibold">{getZodiacLabel(userZodiacSign)}</div>
                  </div>
                  
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-1 mx-auto border border-primary/20">
                      <span className="text-xl">{getZodiacSymbol(candidateZodiacSign)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{candidateNickname}</div>
                    <div className="text-xs font-semibold">{getZodiacLabel(candidateZodiacSign)}</div>
                  </div>
                </div>

                {/* Compatibility Score */}
                <div className="text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {compatibility.percentage}%
                    </span>
                    <Badge className={cn("text-[10px] font-medium", getLevelColor(compatibility.level))}>
                      {getLevelLabel(compatibility.level)}
                    </Badge>
                  </div>
                  <Progress
                    value={compatibility.percentage}
                    className="h-1.5 max-w-xs mx-auto"
                  />
                  <p className="text-xs text-muted-foreground">
                    {compatibility.description}
                  </p>
                </div>

                {/* Tabbed Content */}
                <Tabs defaultValue="insights" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/60 p-1 rounded-lg gap-1">
                    <TabsTrigger value="insights" className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 rounded-md py-1.5">Insights</TabsTrigger>
                    <TabsTrigger value="weekly" className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 rounded-md py-1.5">This Week</TabsTrigger>
                  </TabsList>

                  <TabsContent value="insights" className="space-y-2 mt-4 pt-1">
                    {/* Strengths & Challenges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Label className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Strengths
                        </Label>
                        <div className="space-y-0.5">
                          {compatibility.strengths.slice(0, 2).map((strength, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground leading-tight">{strength}</p>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <Label className="text-[10px] font-semibold text-orange-600 flex items-center gap-1">
                          <X className="w-3 h-3" />
                          Challenges
                        </Label>
                        <div className="space-y-0.5">
                          {compatibility.challenges.slice(0, 2).map((challenge, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground leading-tight">{challenge}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Love Advice */}
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-start gap-2">
                        <Heart className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <Label className="text-[10px] font-semibold text-primary">Love Advice</Label>
                          <p className="text-[11px] text-muted-foreground">{compatibility.loveAdvice}</p>
                        </div>
                      </div>
                    </div>

                    {/* Communication Tip */}
                    <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <Label className="text-[10px] font-semibold text-foreground">
                            Communicating with {getZodiacLabel(candidateZodiacSign)}
                          </Label>
                          <p className="text-[11px] text-muted-foreground">{compatibility.communicationTip}</p>
                        </div>
                      </div>
                    </div>

                    {/* Date Idea */}
                    <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <Label className="text-[10px] font-semibold text-foreground">Date Idea</Label>
                          <p className="text-[11px] text-muted-foreground">{compatibility.dateIdea}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="weekly" className="space-y-2 mt-4 pt-1">
                    {weeklyPrediction && (
                      <>
                        {/* Weekly Theme */}
                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25">
                          <div className="text-[10px] text-muted-foreground">This Week's Theme</div>
                          <div className="text-base font-bold text-primary">{weeklyPrediction.theme}</div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Zap className={cn("w-3.5 h-3.5", getEnergyColor(weeklyPrediction.loveEnergy))} />
                            <span className={cn("text-[11px] font-medium", getEnergyColor(weeklyPrediction.loveEnergy))}>
                              {weeklyPrediction.loveEnergy.charAt(0).toUpperCase() + weeklyPrediction.loveEnergy.slice(1)} Love Energy
                            </span>
                          </div>
                        </div>

                        {/* Weekly Advice */}
                        <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                          <div className="flex items-start gap-2">
                            <Star className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <Label className="text-[10px] font-semibold text-foreground">Weekly Guidance</Label>
                              <p className="text-[11px] text-muted-foreground">{weeklyPrediction.advice}</p>
                            </div>
                          </div>
                        </div>

                        {/* Focus Area & Lucky Day */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded-lg bg-muted/50 border border-border/50 text-center">
                            <div className="text-[10px] text-muted-foreground">Focus Area</div>
                            <p className="text-[11px] font-medium">{weeklyPrediction.focusArea}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
                            <div className="text-[10px] text-muted-foreground">Lucky Day</div>
                            <p className="text-[11px] font-medium text-primary">{weeklyPrediction.luckyDay}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Edit link */}
                <div className="text-center">
                  <Link
                    to={`/add-candidate?edit=${candidateId}`}
                    className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                    Update {candidateNickname}'s sign
                  </Link>
                </div>
              </div>
            )}

            {/* Missing user zodiac sign */}
            {!userZodiacSign && (
              <div className="flex gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Set your zodiac sign in{" "}
                  <a href="/settings" className="text-primary font-medium hover:underline">
                    Settings
                  </a>{" "}
                  to see horoscope compatibility.
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex gap-1.5 p-1.5 rounded-md bg-muted/20 border border-border/20">
              <Star className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <p className="text-[9px] text-muted-foreground">
                <span className="font-medium text-foreground">Just for fun!</span> Not part of D.E.V.I.'s AI analysis.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
