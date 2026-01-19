import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ZODIAC_SIGNS, getZodiacFromBirthDate } from "@/lib/zodiacUtils";
import { cn } from "@/lib/utils";

export function ZodiacModeSettings() {
  const { user } = useAuth();
  const [zodiacModeEnabled, setZodiacModeEnabled] = useState(false);
  const [userZodiacSign, setUserZodiacSign] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("zodiac_mode_enabled, zodiac_sign, birth_date")
        .eq("user_id", user!.id)
        .single();

      if (profile) {
        setZodiacModeEnabled(profile.zodiac_mode_enabled || false);
        setBirthDate(profile.birth_date);
        
        // If no zodiac sign saved but we have birth date, calculate it
        if (!profile.zodiac_sign && profile.birth_date) {
          const calculatedSign = getZodiacFromBirthDate(profile.birth_date);
          setUserZodiacSign(calculatedSign);
        } else {
          setUserZodiacSign(profile.zodiac_sign);
        }
      }
    } catch (error) {
      console.error("Error loading zodiac settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleZodiacMode = async (enabled: boolean) => {
    setSaving(true);
    try {
      // If enabling and no zodiac sign, try to calculate from birth date
      let zodiacSign = userZodiacSign;
      if (enabled && !zodiacSign && birthDate) {
        zodiacSign = getZodiacFromBirthDate(birthDate);
        setUserZodiacSign(zodiacSign);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          zodiac_mode_enabled: enabled,
          zodiac_sign: zodiacSign,
        })
        .eq("user_id", user!.id);

      if (error) throw error;

      setZodiacModeEnabled(enabled);
      toast.success(enabled ? "Zodiac Mode enabled! ✨" : "Zodiac Mode disabled");
    } catch (error) {
      console.error("Error updating zodiac mode:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleZodiacSignChange = async (sign: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ zodiac_sign: sign })
        .eq("user_id", user!.id);

      if (error) throw error;

      setUserZodiacSign(sign);
      toast.success(`Your sign is now ${ZODIAC_SIGNS.find(z => z.value === sign)?.label} ${ZODIAC_SIGNS.find(z => z.value === sign)?.symbol}`);
    } catch (error) {
      console.error("Error updating zodiac sign:", error);
      toast.error("Failed to update zodiac sign");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm opacity-50">
        <CardContent className="py-6">
          <div className="h-20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="w-5 h-5 text-primary" />
            Zodiac Mode
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-muted/50">
            Entertainment Only
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Sparkles className={cn(
              "w-5 h-5 transition-colors",
              zodiacModeEnabled ? "text-primary" : "text-muted-foreground"
            )} />
            <div>
              <Label className="text-sm font-medium">Enable Zodiac Compatibility</Label>
              <p className="text-xs text-muted-foreground">
                See horoscope-based compatibility for fun
              </p>
            </div>
          </div>
          <Switch
            checked={zodiacModeEnabled}
            onCheckedChange={handleToggleZodiacMode}
            disabled={saving}
          />
        </div>

        {/* Zodiac Sign Selection - shown when enabled */}
        {zodiacModeEnabled && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Zodiac Sign</Label>
              <Select
                value={userZodiacSign || ""}
                onValueChange={handleZodiacSignChange}
                disabled={saving}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select your sign">
                    {userZodiacSign && (
                      <span className="flex items-center gap-2">
                        <span className="text-lg">
                          {ZODIAC_SIGNS.find(z => z.value === userZodiacSign)?.symbol}
                        </span>
                        <span>
                          {ZODIAC_SIGNS.find(z => z.value === userZodiacSign)?.label}
                        </span>
                      </span>
                    )}
                  </SelectValue>
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
              {birthDate && userZodiacSign && (
                <p className="text-xs text-muted-foreground">
                  Based on your birthday, your sign is {ZODIAC_SIGNS.find(z => z.value === userZodiacSign)?.label}
                </p>
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">For Entertainment Only</p>
                <p>
                  Horoscope compatibility is separate from D.E.V.I.'s AI relationship analysis. 
                  Your actual compatibility scores and advice are based on real data and patterns, 
                  not astrology.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
