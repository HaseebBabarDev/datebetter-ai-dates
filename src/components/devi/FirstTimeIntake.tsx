import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import { VoiceInputButton } from "@/components/devi/VoiceInputButton";

interface FirstTimeIntakeProps {
  userName: string;
  userGoal: string;
  onSubmit: (data: {
    candidateName: string;
    candidateAge: string;
    candidateLocation: string;
    candidateSex: string;
    freeformInfo: string;
  }) => void;
  onSkipToChat: () => void;
}

export const FirstTimeIntake: React.FC<FirstTimeIntakeProps> = ({
  userName,
  userGoal,
  onSubmit,
  onSkipToChat,
}) => {
  const [candidateName, setCandidateName] = useState("");

  const goalLabel = userGoal === "detachment" ? "detach from" 
    : userGoal === "evaluate" ? "evaluate" 
    : userGoal === "healing" ? "healing from"
    : "tell me about";

  const canSubmit = candidateName.trim().length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-safe-bottom flex items-center justify-center">
      <div className="w-full max-w-md mx-auto space-y-5 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[image:var(--gradient-hero)] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold">
            Hey {userName || "there"}! 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Give them a name and we'll jump right in — I'll learn more as we chat
          </p>
        </div>

        {/* Just the name */}
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><Label className="text-xs font-medium">Their name or nickname</Label><VoiceInputButton onTranscript={(text) => setCandidateName(text.trim())} /></div>
            <Input
              placeholder="e.g. Alex, Coffee Guy, etc."
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="h-11 text-base"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) {
                  onSubmit({ candidateName, candidateAge: "", candidateLocation: "", candidateSex: "", freeformInfo: "" });
                }
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <Button
            className="w-full gap-2 bg-[image:var(--gradient-hero)] hover:opacity-90 h-11"
            onClick={() => onSubmit({ candidateName, candidateAge: "", candidateLocation: "", candidateSex: "", freeformInfo: "" })}
            disabled={!canSubmit}
          >
            Start chatting with D.E.V.I.
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground text-xs gap-1.5"
            onClick={onSkipToChat}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Skip — chat without adding someone
          </Button>
        </div>
      </div>
    </div>
  );
};
