import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Heart, AlertTriangle, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EX_CONTACT_OPTIONS = [
  { value: "no_contact", label: "No contact at all" },
  { value: "occasional", label: "Occasional contact (rare texts/calls)" },
  { value: "regular", label: "Regular contact (friends)" },
  { value: "frequent", label: "Frequent contact (talk often)" },
  { value: "still_connected", label: "Still emotionally connected" },
  { value: "not_applicable", label: "No significant exes" },
];

const HealingAssessmentScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  
  const [exContactStatus, setExContactStatus] = useState(data.exContactStatus || "");
  const [overExLevel, setOverExLevel] = useState(data.overExLevel || 50);
  const [attachmentToPast, setAttachmentToPast] = useState(data.attachmentToPast || 50);

  const handleExContactChange = (value: string) => {
    setExContactStatus(value);
    updateData({ exContactStatus: value });
  };

  const handleOverExChange = (value: number[]) => {
    setOverExLevel(value[0]);
    updateData({ overExLevel: value[0] });
  };

  const handleAttachmentChange = (value: number[]) => {
    setAttachmentToPast(value[0]);
    updateData({ attachmentToPast: value[0] });
  };

  const handleContinue = () => {
    updateData({
      exContactStatus,
      overExLevel,
      attachmentToPast,
    });
    nextStep();
  };

  const getOverExLabel = (value: number) => {
    if (value <= 20) return "Still deeply attached";
    if (value <= 40) return "Working through it";
    if (value <= 60) return "Making progress";
    if (value <= 80) return "Mostly moved on";
    return "Completely over them";
  };

  const getAttachmentLabel = (value: number) => {
    if (value <= 20) return "Very detached";
    if (value <= 40) return "Mostly detached";
    if (value <= 60) return "Neutral";
    if (value <= 80) return "Somewhat attached";
    return "Very attached to past";
  };

  return (
    <OnboardingLayout
      title="Healing Check-In"
      subtitle="Understanding where you are in your healing journey helps D.E.V.I. support you better"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Info notice */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            D.E.V.I. will calculate your healing score based on your responses. 
            You can refresh this score anytime by chatting with D.E.V.I.
          </p>
        </div>

        {/* Ex Contact Status */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Are you still in contact with your ex(es)?</Label>
          <Select value={exContactStatus} onValueChange={handleExContactChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your situation..." />
            </SelectTrigger>
            <SelectContent>
              {EX_CONTACT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Over Ex Slider */}
        {exContactStatus && exContactStatus !== "not_applicable" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">How over your most recent significant ex are you?</Label>
              <p className="text-xs text-muted-foreground">Be honest — this helps D.E.V.I. support you better</p>
            </div>
            <div className="pt-2 pb-4">
              <Slider
                value={[overExLevel]}
                onValueChange={handleOverExChange}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-muted-foreground">Still attached</span>
                <span className="text-xs font-medium text-primary">{getOverExLabel(overExLevel)}</span>
                <span className="text-xs text-muted-foreground">Completely over</span>
              </div>
            </div>
          </div>
        )}

        {/* Attachment to Past Slider */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">How attached are you to past relationship patterns?</Label>
            <p className="text-xs text-muted-foreground">Consider if you find yourself repeating the same dynamics</p>
          </div>
          <div className="pt-2 pb-4">
            <Slider
              value={[attachmentToPast]}
              onValueChange={handleAttachmentChange}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">Detached</span>
              <span className="text-xs font-medium text-primary">{getAttachmentLabel(attachmentToPast)}</span>
              <span className="text-xs text-muted-foreground">Very attached</span>
            </div>
          </div>
        </div>

        {/* Healing note */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
          <Heart className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Healing isn't linear</p>
            <p>It's okay to not be "over it" yet. D.E.V.I. is here to support your journey, wherever you are.</p>
          </div>
        </div>

        {/* Continue button */}
        <Button onClick={handleContinue} className="w-full" size="lg">
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default HealingAssessmentScreen;
