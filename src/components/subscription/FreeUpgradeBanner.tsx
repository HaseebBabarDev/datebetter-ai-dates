import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function FreeUpgradeBanner() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  // Only show for free plan users
  if (!subscription || subscription.plan !== "free") return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Upgrade Your Plan</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track more candidates & get unlimited updates
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-primary" />
                More candidates
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-primary" />
                More updates
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-primary" />
                No contact mode
              </span>
            </div>
            <Button
              size="sm"
              className="mt-3 gap-1.5"
              onClick={() => navigate("/settings?tab=billing")}
            >
              <Sparkles className="w-3.5 h-3.5" />
              View Plans
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
