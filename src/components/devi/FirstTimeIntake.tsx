import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Camera, ArrowRight, ImagePlus } from "lucide-react";
import { VoiceInputButton } from "./VoiceInputButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [candidateAge, setCandidateAge] = useState("");
  const [candidateLocation, setCandidateLocation] = useState("");
  const [candidateSex, setCandidateSex] = useState("");
  const [freeformInfo, setFreeformInfo] = useState("");

  const goalLabel = userGoal === "detachment" ? "detach from" 
    : userGoal === "evaluate" ? "evaluate" 
    : userGoal === "healing" ? "healing from"
    : "tell me about";

  const canSubmit = candidateName.trim().length > 0;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[image:var(--gradient-hero)] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold">
            Hey {userName || "there"}! 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Let's get started — tell me about the person you want to {goalLabel}
          </p>
        </div>

        {/* Quick form */}
        <div className="space-y-3 bg-card rounded-2xl p-4 border border-border/50">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Their name or nickname *</Label>
            <Input
              placeholder="e.g. Alex, Coffee Guy, etc."
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Age</Label>
              <Input
                type="number"
                placeholder="Age"
                value={candidateAge}
                onChange={(e) => setCandidateAge(e.target.value)}
                className="h-10"
                min={18}
                max={99}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Gender</Label>
              <Select value={candidateSex} onValueChange={setCandidateSex}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="man_cis">Man</SelectItem>
                  <SelectItem value="woman_cis">Woman</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Location</Label>
            <Input
              placeholder="City or area"
              value={candidateLocation}
              onChange={(e) => setCandidateLocation(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Anything else you want to share?</Label>
              <VoiceInputButton 
                onTranscript={(text) => setFreeformInfo(prev => prev ? prev + " " + text : text)} 
                size="sm" 
              />
            </div>
            <textarea
              placeholder="Tell me everything — how you met, what's going on, red flags, how you're feeling..."
              value={freeformInfo}
              onChange={(e) => setFreeformInfo(e.target.value)}
              className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <Button
            className="w-full gap-2 bg-[image:var(--gradient-hero)] hover:opacity-90 h-11"
            onClick={() => onSubmit({ candidateName, candidateAge, candidateLocation, candidateSex, freeformInfo })}
            disabled={!canSubmit}
          >
            <Camera className="w-4 h-4" />
            Continue — I'll ask for screenshots next
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground text-xs"
            onClick={onSkipToChat}
          >
            Skip — just chat with D.E.V.I.
          </Button>
        </div>
      </div>
    </div>
  );
};
