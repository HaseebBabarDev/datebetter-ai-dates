import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, Lock, ChevronRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export const DeviCTA = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  
  const isPaidPlan = subscription?.plan && subscription.plan !== "free";

  return (
    <Card className="overflow-hidden border-border bg-gradient-to-br from-primary/10 via-accent/5 to-background">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Meet D.E.V.I.</h3>
              {!isPaidPlan && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your AI assistant for navigating the dating world with confidence.
            </p>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3 text-primary" />
                <span>Get personalized advice based on your profile</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3 text-primary" />
                <span>Analyze conversations & decode mixed signals</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3 text-primary" />
                <span>Red flag detection & pattern insights</span>
              </li>
            </ul>
            <Button
              onClick={() => isPaidPlan ? navigate("/devi") : navigate("/settings?tab=billing")}
              className={`mt-3 w-full h-9 gap-2 ${isPaidPlan ? "bg-primary hover:bg-primary/90" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
            >
              {isPaidPlan ? (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Chat with D.E.V.I.
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Upgrade to Unlock
                </>
              )}
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
