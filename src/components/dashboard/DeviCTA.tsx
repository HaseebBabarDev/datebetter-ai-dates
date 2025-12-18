import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, ChevronRight, Camera, Instagram, Heart } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export const DeviCTA = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  
  const isPaidPlan = subscription?.plan && subscription.plan !== "free";

  const uploadFeatures = [
    { icon: Camera, label: "Text Screenshots" },
    { icon: Instagram, label: "IG Profiles" },
    { icon: Heart, label: "Dating Profiles" },
  ];

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
            
            {/* Upload Feature Icons */}
            <div className="flex items-center gap-2 mt-3">
              {uploadFeatures.map((feature) => (
                <div 
                  key={feature.label}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border"
                >
                  <feature.icon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">{feature.label}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => isPaidPlan ? navigate("/devi") : navigate("/settings?tab=billing")}
              className={`mt-3 w-full h-9 gap-2 ${isPaidPlan ? "bg-primary hover:bg-primary/90" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
            >
              {isPaidPlan ? (
                <>
                  <Sparkles className="w-4 h-4" />
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
