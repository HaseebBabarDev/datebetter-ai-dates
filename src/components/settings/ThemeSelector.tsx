import React from "react";
import { useTheme, ColorScheme, ThemeMode } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette, Moon, Sun, Heart, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const { colorScheme, themeMode, setColorScheme, toggleDarkMode } = useTheme();

  const colorSchemes: { value: ColorScheme; label: string; description: string; icon: React.ReactNode; preview: string }[] = [
    {
      value: "original",
      label: "Original",
      description: "Warm pink & rose tones",
      icon: <Heart className="w-5 h-5" />,
      preview: "bg-gradient-to-r from-pink-500 to-rose-400",
    },
    {
      value: "blue",
      label: "Blue",
      description: "Cool blue & slate tones",
      icon: <Waves className="w-5 h-5" />,
      preview: "bg-gradient-to-r from-blue-500 to-cyan-400",
    },
  ];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="w-5 h-5 text-primary" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Scheme Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Color Scheme</Label>
          <div className="grid grid-cols-2 gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => setColorScheme(scheme.value)}
                className={cn(
                  "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200",
                  colorScheme === scheme.value
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {/* Preview bar */}
                <div className={cn("w-full h-2 rounded-full mb-3", scheme.preview)} />
                
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "transition-colors",
                    colorScheme === scheme.value ? "text-primary" : "text-muted-foreground"
                  )}>
                    {scheme.icon}
                  </span>
                  <span className="font-medium text-sm">{scheme.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{scheme.description}</span>
                
                {/* Check indicator */}
                {colorScheme === scheme.value && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3">
            {themeMode === "dark" ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
            <div>
              <Label className="text-sm font-medium">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">
                {themeMode === "dark" ? "Currently using dark theme" : "Currently using light theme"}
              </p>
            </div>
          </div>
          <Switch
            checked={themeMode === "dark"}
            onCheckedChange={toggleDarkMode}
          />
        </div>
      </CardContent>
    </Card>
  );
}
