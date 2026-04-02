import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Check, Mic } from "lucide-react";
import { VoiceInputButton } from "@/components/devi/VoiceInputButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExtractedCandidate {
  nickname?: string;
  age?: number;
  gender_identity?: string;
  pronouns?: string;
  met_via?: string;
  met_app?: string;
  height?: string;
  country?: string;
  city?: string;
  distance_approximation?: string;
  their_religion?: string;
  their_politics?: string;
  their_relationship_status?: string;
  their_relationship_goal?: string;
  their_kids_desire?: string;
  their_kids_status?: string;
  their_attachment_style?: string;
  their_career_stage?: string;
  their_education_level?: string;
  their_social_style?: string;
  their_drinking?: string;
  their_smoking?: string;
  their_exercise?: string;
  their_schedule_flexibility?: string;
  zodiac_sign?: string;
  their_parent_status?: string;
  their_mother_status?: string;
  their_father_status?: string;
  their_siblings?: number;
  their_parents_relationship?: string;
  their_felt_loved_as_child?: string;
  their_family_stability?: string;
  their_healthy_relationship_models?: boolean;
  their_family_notes?: string;
  their_relationship_notes?: string;
  notes?: string;
  their_ambition_level?: number;
  overall_chemistry?: number;
  physical_attraction?: number;
  intellectual_connection?: number;
  humor_compatibility?: number;
  energy_match?: number;
}

interface SmartFillFormProps {
  onExtracted: (data: ExtractedCandidate) => void;
  onSwitchToManual: () => void;
}

export const SmartFillForm: React.FC<SmartFillFormProps> = ({ onExtracted, onSwitchToManual }) => {
  const [freeformText, setFreeformText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);

  const handleExtract = async () => {
    if (freeformText.trim().length < 10) {
      toast.error("Please tell us a bit more about this person");
      return;
    }

    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-candidate-info", {
        body: { freeformText },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.extracted) {
        const fieldsFound = Object.values(data.extracted).filter(v => v !== null && v !== undefined).length;
        toast.success(`Filled ${fieldsFound} fields from your description!`);
        setExtracted(true);
        onExtracted(data.extracted);
      }
    } catch (err) {
      console.error("Extraction error:", err);
      toast.error("Failed to extract info. Try again or fill manually.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setFreeformText(prev => prev ? `${prev} ${text}` : text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Tell D.E.V.I. Everything
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Describe this person in your own words — their background, personality, family, past relationships, how you met, red/green flags — and we'll fill in the profile for you.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              value={freeformText}
              onChange={(e) => setFreeformText(e.target.value)}
              placeholder={`Example: "His name is Jake, he's 28, we met on Hinge. He's 6'1, works in tech as a software engineer. He's from Chicago. His parents are divorced — his dad left when he was young so he has some abandonment issues. He's avoidant, never been in a relationship longer than a year. He drinks socially, doesn't smoke. He wants kids eventually. He's really funny and smart but sometimes emotionally unavailable. We've been texting for 2 weeks..."`}
              className="min-h-[200px] text-sm pb-12"
              maxLength={3000}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground mr-1">{freeformText.length}/3000</span>
              <VoiceInputButton 
                onTranscript={handleVoiceTranscript}
                onPartialTranscript={(text) => {
                  // Show partial in real-time
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Mic className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Tap the mic to speak — tell us everything you know about them: family, past relationships, vibes, deal breakers, anything.
            </p>
          </div>

          <Button
            onClick={handleExtract}
            disabled={isExtracting || freeformText.trim().length < 10}
            className="w-full"
            size="lg"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                D.E.V.I. is reading...
              </>
            ) : extracted ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Re-analyze & Update
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-Fill Profile
              </>
            )}
          </Button>

          {extracted && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center text-muted-foreground"
            >
              ✅ Fields filled! Review and edit anything below, then save.
            </motion.p>
          )}

          <Button
            variant="ghost"
            onClick={onSwitchToManual}
            className="w-full text-xs text-muted-foreground"
          >
            Skip — I'll fill it in manually
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
