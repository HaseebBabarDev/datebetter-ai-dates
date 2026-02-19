import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldX, ShieldCheck, AlertTriangle } from "lucide-react";

interface AutoDisqualifyDialogProps {
  open: boolean;
  candidateName: string;
  reasons: string[];
  /** Called when user confirms DQ (keeps it disqualified) */
  onConfirm: () => void;
  /** Called when user overrides (keeps the candidate active) */
  onKeep: () => void;
}

export const AutoDisqualifyDialog: React.FC<AutoDisqualifyDialogProps> = ({
  open,
  candidateName,
  reasons,
  onConfirm,
  onKeep,
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm mx-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <ShieldX className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="text-base leading-snug">
              {candidateName} was auto-disqualified
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Based on your dealbreaker settings, this candidate triggered the following rule{reasons.length > 1 ? "s" : ""}:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {reasons.map((reason, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/8 border border-destructive/20"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
              <span className="text-sm font-medium text-destructive">{reason}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          You can disqualify them now, or keep them active if you'd like to reconsider. You can always change this later from their profile.
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onConfirm}
          >
            <ShieldX className="w-4 h-4 mr-2" />
            Disqualify {candidateName}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={onKeep}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Keep them active (override)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Restore Dialog ────────────────────────────────────────────────────────────

interface RestoreCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  disqualifyReasons: string[];
  onRestore: (explanation: string) => void;
  loading?: boolean;
}

export const RestoreCandidateDialog: React.FC<RestoreCandidateDialogProps> = ({
  open,
  onOpenChange,
  candidateName,
  disqualifyReasons,
  onRestore,
  loading,
}) => {
  const [explanation, setExplanation] = useState("");

  const handleRestore = () => {
    onRestore(explanation);
    setExplanation("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-base leading-snug">
              Re-add {candidateName}?
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            This candidate was disqualified for:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          {disqualifyReasons.length > 0 ? disqualifyReasons.map((r, i) => (
            <Badge key={i} variant="destructive" className="text-xs mr-1">
              {r}
            </Badge>
          )) : (
            <Badge variant="outline" className="text-xs">Manual disqualification</Badge>
          )}
        </div>

        <div className="space-y-2 pt-1">
          <Label className="text-sm">
            Why are you reconsidering? <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            placeholder="e.g. We had a good conversation and I want to give it another chance..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="resize-none text-sm"
            rows={3}
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            onClick={handleRestore}
            disabled={loading}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            {loading ? "Restoring..." : `Re-add ${candidateName}`}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
