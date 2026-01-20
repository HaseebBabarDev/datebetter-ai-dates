import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface DeviSettingsProps {
  userId: string;
}

const DEVI_STYLES = [
  {
    value: "direct",
    label: "Direct",
    description: "Straight to the point. No fluff, just insights.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Warm but honest. The default experience.",
  },
  {
    value: "gentle",
    label: "Gentle",
    description: "Extra supportive and encouraging tone.",
  },
];

const DEVI_VOICES = [
  {
    value: "younger",
    label: "Younger",
    description: "Energetic and relatable vibe.",
  },
  {
    value: "mature",
    label: "Mature",
    description: "Warm and reassuring tone.",
  },
];

export const DeviSettings: React.FC<DeviSettingsProps> = ({ userId }) => {
  const [deviStyle, setDeviStyle] = useState("balanced");
  const [deviVoice, setDeviVoice] = useState("mature");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDeviPreferences();
  }, [userId]);

  const fetchDeviPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("devi_style, devi_voice")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      if (data?.devi_style) {
        setDeviStyle(data.devi_style);
      }
      if (data?.devi_voice) {
        setDeviVoice(data.devi_voice);
      }
    } catch (error) {
      console.error("Error fetching Devi preferences:", error);
    }
  };

  const handleStyleChange = async (newStyle: string) => {
    setDeviStyle(newStyle);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ devi_style: newStyle })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("Communication style updated!");
    } catch (error) {
      console.error("Error saving Devi style:", error);
      toast.error("Failed to save preference");
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceChange = async (newVoice: string) => {
    setDeviVoice(newVoice);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ devi_voice: newVoice })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("Voice preference updated!");
    } catch (error) {
      console.error("Error saving Devi voice:", error);
      toast.error("Failed to save preference");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Communication Style */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Communication Style
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-3">
            Choose how D.E.V.I. talks to you
          </p>
          <RadioGroup
            value={deviStyle}
            onValueChange={handleStyleChange}
            className="space-y-2"
            disabled={saving}
          >
            {DEVI_STYLES.map((style) => (
              <div
                key={style.value}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  deviStyle === style.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleStyleChange(style.value)}
              >
                <RadioGroupItem value={style.value} id={style.value} className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor={style.value} className="text-sm font-medium cursor-pointer">
                    {style.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {style.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Voice Preference */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary" />
            Voice
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-3">
            Choose D.E.V.I.'s voice when speaking
          </p>
          <RadioGroup
            value={deviVoice}
            onValueChange={handleVoiceChange}
            className="space-y-2"
            disabled={saving}
          >
            {DEVI_VOICES.map((voice) => (
              <div
                key={voice.value}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  deviVoice === voice.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleVoiceChange(voice.value)}
              >
                <RadioGroupItem value={voice.value} id={`voice-${voice.value}`} className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor={`voice-${voice.value}`} className="text-sm font-medium cursor-pointer">
                    {voice.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {voice.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};
