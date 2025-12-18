import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, MessageCircle, Camera, Instagram, Heart, ArrowRight } from "lucide-react";

interface AskDeviCTAProps {
  candidateName?: string;
  candidateId?: string;
}

const EXAMPLE_QUESTIONS = [
  "Why isn't he texting me back?",
  "Is this a red flag or am I overreacting?",
  "How do I set boundaries without seeming needy?",
  "Should I bring up exclusivity?",
];

export const AskDeviCTA: React.FC<AskDeviCTAProps> = ({ candidateName, candidateId }) => {
  const navigate = useNavigate();

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
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Got dating questions? Women everywhere are asking AI for relationship advice. 
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
          className="w-full gap-2 bg-[image:var(--gradient-hero)] hover:opacity-90"
          onClick={() => navigate("/devi", { state: { candidateName, candidateId } })}
        >
          <MessageCircle className="w-4 h-4" />
          Chat with D.E.V.I.
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </div>
  );
};
