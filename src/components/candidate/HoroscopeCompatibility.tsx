import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Star, Sparkles, AlertCircle, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ZODIAC_SIGNS,
  getZodiacLabel,
  getZodiacSymbol,
  getHoroscopeCompatibility,
} from "@/lib/zodiacUtils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [partnerSign, setPartnerSign] = useState<string | null>(candidateZodiacSign);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserZodiac();
    }
  }, [user]);

  useEffect(() => {
    setPartnerSign(candidateZodiacSign);
  }, [candidateZodiacSign]);

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

  const handlePartnerSignChange = async (sign: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("candidates")
        .update({ zodiac_sign: sign })
        .eq("id", candidateId)
        .eq("user_id", user!.id);

      if (error) throw error;

      setPartnerSign(sign);
      toast.success(`${candidateNickname}'s sign updated to ${getZodiacLabel(sign)}`);
    } catch (error) {
      console.error("Error updating candidate zodiac:", error);
      toast.error("Failed to update zodiac sign");
    } finally {
      setSaving(false);
    }
  };

  // Don't render if zodiac mode is not enabled
  if (!zodiacModeEnabled || loading) {
    return null;
  }

  const compatibility = getHoroscopeCompatibility(userZodiacSign, partnerSign);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "low":
      case "challenging":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="w-5 h-5 text-primary" />
                Horoscope Compatibility
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-muted/50">
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
          <CardContent className="space-y-4">
            {/* Partner Zodiac Selection */}
            {!partnerSign && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {candidateNickname}'s Zodiac Sign
                </Label>
                <Select
                  value={partnerSign || ""}
                  onValueChange={handlePartnerSignChange}
                  disabled={saving}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select their sign to see compatibility" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {ZODIAC_SIGNS.map((sign) => (
                      <SelectItem key={sign.value} value={sign.value}>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{sign.symbol}</span>
                          <span>{sign.label}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({sign.dates})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Compatibility Display */}
            {userZodiacSign && partnerSign && compatibility && (
              <div className="space-y-4">
                {/* Signs Display */}
                <div className="flex items-center justify-center gap-4 py-3">
                  <div className="text-center">
                    <div className="text-3xl mb-1">{getZodiacSymbol(userZodiacSign)}</div>
                    <div className="text-xs text-muted-foreground">You</div>
                    <div className="text-sm font-medium">{getZodiacLabel(userZodiacSign)}</div>
                  </div>
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  <div className="text-center">
                    <div className="text-3xl mb-1">{getZodiacSymbol(partnerSign)}</div>
                    <div className="text-xs text-muted-foreground">{candidateNickname}</div>
                    <div className="text-sm font-medium">{getZodiacLabel(partnerSign)}</div>
                  </div>
                </div>

                {/* Compatibility Score */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {compatibility.percentage}%
                    </span>
                    <Badge className={cn("text-xs", getLevelColor(compatibility.level))}>
                      {getLevelLabel(compatibility.level)}
                    </Badge>
                  </div>
                  <Progress
                    value={compatibility.percentage}
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {compatibility.description}
                  </p>
                </div>

                {/* Strengths & Challenges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-green-600">Strengths</Label>
                    <div className="space-y-1">
                      {compatibility.strengths.map((strength, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-orange-600">Challenges</Label>
                    <div className="space-y-1">
                      {compatibility.challenges.map((challenge, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <X className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{challenge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Change Sign Option */}
                <div className="pt-2 border-t">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Update {candidateNickname}'s sign
                  </Label>
                  <Select
                    value={partnerSign}
                    onValueChange={handlePartnerSignChange}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-background h-9 text-sm">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span>{getZodiacSymbol(partnerSign)}</span>
                          <span>{getZodiacLabel(partnerSign)}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {ZODIAC_SIGNS.map((sign) => (
                        <SelectItem key={sign.value} value={sign.value}>
                          <span className="flex items-center gap-2">
                            <span>{sign.symbol}</span>
                            <span>{sign.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Missing user zodiac sign */}
            {!userZodiacSign && (
              <div className="flex gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p>
                    Set your zodiac sign in{" "}
                    <a href="/settings?tab=account" className="text-primary underline">
                      Settings
                    </a>{" "}
                    to see horoscope compatibility.
                  </p>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
              <Star className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Just for fun!</span> This is not part of D.E.V.I.'s 
                AI analysis. Your real compatibility score is based on actual patterns and data.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
