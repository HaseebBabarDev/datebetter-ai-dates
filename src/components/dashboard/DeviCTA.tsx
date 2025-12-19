import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, Lock, ArrowRight, Camera, Instagram, Heart } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const EXAMPLE_QUESTIONS = [
  "Why isn't he texting me back?",
  "Is this a red flag or am I overreacting?",
  "How do I set boundaries without seeming needy?",
];

export const DeviCTA = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  
  const isPaidPlan = subscription?.plan && subscription.plan !== "free";

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-[image:var(--gradient-hero)] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-foreground">Ask D.E.V.I.</h3>
            <p className="text-xs text-primary-foreground/80">Your AI assistant</p>
          </div>
          {!isPaidPlan && (
            <span className="ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/20 text-primary-foreground">
              <Lock className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Got dating questions? People everywhere are asking AI for relationship advice. 
          D.E.V.I. is trained specifically for dating — ask anything!
        </p>

        {/* Example questions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q, i) => (
              <span 
                key={i}
                className="text-xs px-2.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                "{q}"
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/50">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-center text-muted-foreground leading-tight">Screenshot Analysis</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/50">
            <Instagram className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-center text-muted-foreground leading-tight">IG Profile Insights</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/50">
            <Heart className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-center text-muted-foreground leading-tight">Dating Profile Review</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          className={`w-full gap-2 ${isPaidPlan ? "bg-[image:var(--gradient-hero)] hover:opacity-90" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
          onClick={() => isPaidPlan ? navigate("/devi") : navigate("/settings?tab=billing")}
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
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </div>
  );
};
