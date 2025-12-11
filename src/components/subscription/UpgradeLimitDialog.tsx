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
  limitType: "candidates" | "updates";
  currentPlan?: string;
}

const PLAN_OPTIONS = [
  {
    id: "new_to_dating",
    name: "New to Dating",
    price: "$9.99",
    candidates: 3,
    updates: 5,
  },
  {
    id: "dating_often",
    name: "Dating Often",
    price: "$19.99",
    candidates: 7,
    updates: 12,
    recommended: true,
  },
  {
    id: "dating_more",
    name: "Dating More",
    price: "$29.99",
    candidates: 12,
    updates: 20,
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
    if (currentPlan === "new_to_dating") return plan.id !== "new_to_dating";
    if (currentPlan === "dating_often") return plan.id === "dating_more";
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
              : "Update Limit Reached"}
          </DialogTitle>
          <DialogDescription>
            {limitType === "candidates"
              ? "You've reached your maximum number of candidates. Upgrade to add more."
              : "You've used all updates for this candidate. Upgrade for more updates."}
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
                  <span>{plan.candidates} candidates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>{plan.updates} updates each</span>
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
