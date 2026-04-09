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
    value: "female",
    label: "Female",
    description: "Warm and reassuring tone.",
  },
  {
    value: "male",
    label: "Male",
    description: "Calm and grounded tone.",
  },
];

export const DeviSettings: React.FC<DeviSettingsProps> = ({ userId }) => {
  const [deviStyle, setDeviStyle] = useState("balanced");
  const [deviVoice, setDeviVoice] = useState("female");
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
        .maybeSingle();

      if (error) throw error;
      if (data?.devi_style) {
        setDeviStyle(data.devi_style);
      }
      if (data?.devi_voice) {
        setDeviVoice(data.devi_voice);
      }
    } catch (error) {
      console.error("Error fetching D.E.V.I. preferences:", error);
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
      console.error("Error saving D.E.V.I. style:", error);
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
      console.error("Error saving D.E.V.I. voice:", error);
      toast.error("Failed to save preference");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          D.E.V.I. Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-5">
        {/* Communication Style */}
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Communication Style
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
        </div>

        {/* Voice Preference */}
        <div>
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
            <Volume2 className="w-3 h-3" />
            Voice
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DEVI_VOICES.map((voice) => (
              <div
                key={voice.value}
                onClick={() => !saving && handleVoiceChange(voice.value)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  deviVoice === voice.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <p className="font-medium text-sm">{voice.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{voice.description}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};