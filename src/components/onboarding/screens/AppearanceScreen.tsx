import React, { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { useTheme, ColorScheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Sparkles, Star, Heart, Leaf, Waves, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZODIAC_SIGNS, getZodiacFromBirthDate } from "@/lib/zodiacUtils";

const colorSchemes: {
  value: ColorScheme;
  label: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
}[] = [
  {
    value: "original",
    label: "Rose",
    description: "Warm pink tones",
    icon: <Heart className="w-4 h-4" />,
    preview: "linear-gradient(135deg, hsl(340 75% 55%), hsl(320 60% 60%))",
  },
  {
    value: "green",
    label: "Emerald",
    description: "Fresh green tones",
    icon: <Leaf className="w-4 h-4" />,
    preview: "linear-gradient(135deg, hsl(155 75% 40%), hsl(170 65% 45%))",
  },
  {
    value: "blue",
    label: "Ocean",
    description: "Cool blue tones",
    icon: <Waves className="w-4 h-4" />,
    preview: "linear-gradient(135deg, hsl(210 80% 50%), hsl(190 70% 50%))",
  },
];

const AppearanceScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const { colorScheme, setColorScheme, themeMode, toggleDarkMode } = useTheme();
  
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
      subtitle="Pick your colors now — you can always change them later"
      showBack={false}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <div className="bg-muted/30 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[image:var(--gradient-primary)] flex items-center justify-center text-primary-foreground">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <Label className="text-base font-semibold">Color Theme</Label>
              <p className="text-sm text-muted-foreground">
                Green and pink are both available here
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {colorSchemes.map((scheme) => {
              const isSelected = colorScheme === scheme.value;

              return (
                <button
                  key={scheme.value}
                  type="button"
                  onClick={() => setColorScheme(scheme.value)}
                  className={cn(
                    "rounded-2xl border-2 p-3 text-left transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-[var(--shadow-soft)]"
                      : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  <div
                    className="mb-3 h-2 w-full rounded-full"
                    style={{ backgroundImage: scheme.preview }}
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(isSelected ? "text-primary" : "text-muted-foreground")}>
                      {scheme.icon}
                    </span>
                    <span className="text-sm font-semibold">{scheme.label}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{scheme.description}</p>
                </button>
              );
            })}
          </div>
        </div>

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

        <div className="bg-muted/30 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                zodiacModeEnabled 
                  ? "bg-primary text-primary-foreground" 
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

        <p className="text-xs text-center text-muted-foreground">
          You can change all of this anytime in Settings
        </p>

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

