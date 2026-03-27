import React, { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZODIAC_SIGNS, getZodiacFromBirthDate } from "@/lib/zodiacUtils";

const AppearanceScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const { themeMode, toggleDarkMode } = useTheme();
  
  const [zodiacModeEnabled, setZodiacModeEnabled] = useState(data.zodiacModeEnabled ?? false);
  const [zodiacSign, setZodiacSign] = useState(data.zodiacSign || "");

  useEffect(() => {
    if (data.birthDate && !zodiacSign) {
      const calculated = getZodiacFromBirthDate(data.birthDate);
      if (calculated) {
        setZodiacSign(calculated);
      }
    }
  }, [data.birthDate, zodiacSign]);

  const handleZodiacModeToggle = (enabled: boolean) => {
    setZodiacModeEnabled(enabled);
    updateData({ zodiacModeEnabled: enabled });
  };

  const handleZodiacSignChange = (sign: string) => {
    setZodiacSign(sign);
    updateData({ zodiacSign: sign });
  };

  const handleContinue = () => {
    updateData({ 
      zodiacModeEnabled,
      zodiacSign: zodiacModeEnabled ? zodiacSign : undefined
    });
    nextStep();
  };

  return (
    <OnboardingLayout
      title="Choose Your Look"
      subtitle="Personalize the app's appearance to match your style"
      showBack={false}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header Icon */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="bg-muted/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                themeMode === "dark" 
                  ? "bg-slate-800 text-yellow-400" 
                  : "bg-amber-100 text-amber-500"
              )}>
                {themeMode === "dark" ? (
                  <Moon className="w-6 h-6" />
                ) : (
                  <Sun className="w-6 h-6" />
                )}
              </div>
              <div>
                <Label className="text-base font-semibold">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  {themeMode === "dark" ? "Easier on the eyes" : "Bright and clear"}
                </p>
              </div>
            </div>
            <Switch
              checked={themeMode === "dark"}
              onCheckedChange={toggleDarkMode}
              className="scale-125"
            />
          </div>
        </div>

        {/* Zodiac Mode Toggle */}
        <div className="bg-muted/30 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                zodiacModeEnabled 
                  ? "bg-purple-500 text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                <Star className="w-6 h-6" />
              </div>
              <div>
                <Label className="text-base font-semibold">Zodiac Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Fun horoscope compatibility
                </p>
              </div>
            </div>
            <Switch
              checked={zodiacModeEnabled}
              onCheckedChange={handleZodiacModeToggle}
              className="scale-125"
            />
          </div>
          
          {zodiacModeEnabled && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center italic">
                🎭 For entertainment only — separate from AI analysis
              </p>
              <Label className="text-sm font-medium">Your Zodiac Sign</Label>
              <Select value={zodiacSign} onValueChange={handleZodiacSignChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your sign..." />
                </SelectTrigger>
                <SelectContent>
                  {ZODIAC_SIGNS.map((sign) => (
                    <SelectItem key={sign.value} value={sign.value}>
                      {sign.symbol} {sign.label} <span className="text-muted-foreground text-xs">({sign.dates})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Preview hint */}
        <p className="text-xs text-center text-muted-foreground">
          You can change these anytime in Settings
        </p>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          className="w-full"
          size="lg"
          disabled={zodiacModeEnabled && !zodiacSign}
        >
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default AppearanceScreen;
