import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: "candidates" | "updates" | "interactions";
  currentPlan?: string;
}

const PLAN_OPTIONS = [
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    candidates: 1,
    updates: "Unlimited",
    aiMessages: 5,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$15.99",
    candidates: 10,
    updates: "Unlimited",
    aiMessages: 1000,
    recommended: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "$29.99",
    candidates: "Unlimited",
    updates: "Unlimited",
    aiMessages: "Unlimited",
  },
];

export function UpgradeLimitDialog({
  open,
  onOpenChange,
  limitType,
  currentPlan = "free",
}: UpgradeLimitDialogProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/subscription");
  };

  const availablePlans = PLAN_OPTIONS.filter((plan) => {
    if (currentPlan === "free") return true;
    if (currentPlan === "basic") return plan.id !== "basic";
    if (currentPlan === "starter") return plan.id === "unlimited";
    return false;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {limitType === "candidates"
              ? "Candidate Limit Reached"
              : "Free Interaction Limit Reached"}
          </DialogTitle>
          <DialogDescription>
            {limitType === "candidates"
              ? "You've reached your maximum number of candidates. Upgrade to add more."
              : "You've used all your free interactions. Upgrade to a paid plan or purchase a Day Pass to continue logging interactions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-lg border ${
                plan.recommended
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{plan.name}</h4>
                  {plan.recommended && (
                    <span className="text-xs text-primary">Best Value</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>{plan.candidates} candidate{plan.candidates !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>{plan.updates} updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>{plan.aiMessages} AI messages</span>
                </div>
              </div>
              <Button
                onClick={handleUpgrade}
                className="w-full"
                variant={plan.recommended ? "default" : "outline"}
                size="sm"
              >
                Upgrade to {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
