import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { useTheme, ColorScheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Heart, Waves, Moon, Sun, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const AppearanceScreen = () => {
  const { nextStep } = useOnboarding();
  const { colorScheme, themeMode, setColorScheme, toggleDarkMode } = useTheme();

  const colorSchemes: { 
    value: ColorScheme; 
    label: string; 
    description: string; 
    icon: React.ReactNode; 
    preview: string;
    gradient: string;
  }[] = [
    {
      value: "original",
      label: "Rose",
      description: "Warm pink & rose tones",
      icon: <Heart className="w-6 h-6" />,
      preview: "bg-gradient-to-r from-pink-500 to-rose-400",
      gradient: "from-pink-500/20 to-rose-400/20",
    },
    {
      value: "blue",
      label: "Ocean",
      description: "Cool blue & slate tones",
      icon: <Waves className="w-6 h-6" />,
      preview: "bg-gradient-to-r from-blue-500 to-cyan-400",
      gradient: "from-blue-500/20 to-cyan-400/20",
    },
  ];

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

        {/* Color Scheme Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground block text-center">
            Color Theme
          </Label>
          <div className="grid grid-cols-2 gap-4">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => setColorScheme(scheme.value)}
                className={cn(
                  "relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-300",
                  colorScheme === scheme.value
                    ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {/* Preview gradient background */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-30",
                  scheme.gradient
                )} />
                
                {/* Preview bar */}
                <div className={cn("w-full h-2 rounded-full mb-4 relative z-10", scheme.preview)} />
                
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-3 relative z-10 transition-all",
                  colorScheme === scheme.value 
                    ? scheme.preview + " text-white shadow-lg" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {scheme.icon}
                </div>
                
                <span className="font-semibold text-base relative z-10">{scheme.label}</span>
                <span className="text-xs text-muted-foreground mt-1 relative z-10">{scheme.description}</span>
                
                {/* Check indicator */}
                {colorScheme === scheme.value && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
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

        {/* Preview hint */}
        <p className="text-xs text-center text-muted-foreground">
          You can change this anytime in Settings
        </p>

        {/* Continue Button */}
        <Button
          onClick={nextStep}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default AppearanceScreen;
