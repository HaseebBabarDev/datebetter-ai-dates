import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface UpgradeNudgeProps {
  candidateId?: string;
  onDismiss?: () => void;
}

export function UpgradeNudge({ candidateId, onDismiss }: UpgradeNudgeProps) {
  const navigate = useNavigate();
  const { subscription, candidateCount, getRemainingUpdates } = useSubscription();

  if (!subscription) return null;

  const candidatesRemaining = subscription.candidates_limit - candidateCount;
  const updatesRemaining = candidateId ? getRemainingUpdates(candidateId) : null;

  // Show nudge when near limit (1 remaining) or at 80%+ usage
  const nearCandidateLimit = candidatesRemaining === 1 && candidateCount > 0;
  const nearUpdateLimit = updatesRemaining !== null && updatesRemaining <= 2 && updatesRemaining > 0;

  if (!nearCandidateLimit && !nearUpdateLimit) return null;

  const message = nearUpdateLimit
    ? `Only ${updatesRemaining} update${updatesRemaining === 1 ? "" : "s"} left for this candidate`
    : `Only 1 candidate slot remaining`;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <span className="text-foreground">{message}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          className="text-xs h-7"
          onClick={() => navigate("/subscription")}
        >
          Upgrade
        </Button>
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={onDismiss}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
