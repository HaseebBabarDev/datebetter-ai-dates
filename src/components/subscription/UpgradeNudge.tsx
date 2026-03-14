import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, X, TrendingUp } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface UpgradeNudgeProps {
  candidateId?: string;
  onDismiss?: () => void;
}

export function UpgradeNudge({ candidateId, onDismiss }: UpgradeNudgeProps) {
  const navigate = useNavigate();
  const { subscription, candidateCount, getRemainingInteractions, getPlanLimits, interactionCount } = useSubscription();

  if (!subscription) return null;
  // Don't show for unlimited users — they have no limits
  if (subscription.plan === "unlimited") return null;

  const limits = getPlanLimits(subscription.plan as any);

  // Calculate usage percentages
  const candidateUsage = limits.candidates > 0 ? candidateCount / limits.candidates : 0;
  const interactionUsage = limits.updates > 0 ? interactionCount / limits.updates : 0;

  const nearCandidateLimit = candidateUsage >= 0.8 && candidateCount > 0;
  const nearInteractionLimit = interactionUsage >= 0.8 && interactionCount > 0;

  if (!nearCandidateLimit && !nearInteractionLimit) return null;

  const candidatesRemaining = Math.max(0, limits.candidates - candidateCount);
  const interactionsRemaining = getRemainingInteractions();

  // Pick the most urgent message
  let message: string;
  let urgent = false;

  if (nearInteractionLimit && nearCandidateLimit) {
    message = "You're approaching your plan limits";
    urgent = true;
  } else if (nearInteractionLimit) {
    if (interactionsRemaining <= 0) {
      message = "You've used all your interactions";
      urgent = true;
    } else {
      message = `${interactionsRemaining} interaction${interactionsRemaining === 1 ? "" : "s"} remaining`;
    }
  } else {
    if (candidatesRemaining <= 0) {
      message = "You've reached your candidate limit";
      urgent = true;
    } else {
      message = `${candidatesRemaining} candidate slot${candidatesRemaining === 1 ? "" : "s"} remaining`;
    }
  }

  const nextPlan = subscription.plan === "free" ? "Basic" 
    : subscription.plan === "basic" ? "Starter" 
    : "Unlimited";

  return (
    <div className={`rounded-lg p-3 flex items-center justify-between gap-3 ${
      urgent 
        ? "bg-destructive/10 border border-destructive/20" 
        : "bg-primary/10 border border-primary/20"
    }`}>
      <div className="flex items-center gap-2 text-sm min-w-0">
        {urgent ? (
          <TrendingUp className="w-4 h-4 text-destructive shrink-0" />
        ) : (
          <Zap className="w-4 h-4 text-primary shrink-0" />
        )}
        <span className="text-foreground truncate">{message}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="default"
          className="text-xs h-7"
          onClick={() => navigate("/subscription")}
        >
          Upgrade to {nextPlan}
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
