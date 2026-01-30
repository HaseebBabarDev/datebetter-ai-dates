import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, Camera, Instagram, Heart, ArrowRight, X } from "lucide-react";

interface DeviIntroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

const EXAMPLE_PROMPTS = [
  "Why isn't he texting me back?",
  "Is this a red flag?",
  "How do I set boundaries?",
];

export const DeviIntroDialog: React.FC<DeviIntroDialogProps> = ({
  open,
  onOpenChange,
  onDismiss,
}) => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    onOpenChange(false);
    navigate("/devi");
  };

  const handleDismiss = () => {
    onDismiss();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-[image:var(--gradient-hero)] p-6 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-primary-foreground" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-primary-foreground mb-1">
                Meet D.E.V.I.
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 text-sm">
                Your AI Dating Assistant
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Everyone's asking AI for dating advice now. D.E.V.I. is specifically trained for 
            relationships — ask anything about your dating life!
          </p>

          {/* Example prompts */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Try asking things like:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  "{prompt}"
                </span>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50">
              <Camera className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                Screenshot Analysis
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50">
              <Instagram className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                IG Profile Insights
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50">
              <Heart className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                Dating Profile Review
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full gap-2 bg-[image:var(--gradient-hero)] hover:opacity-90 h-11"
              onClick={handleStartChat}
            >
              <MessageCircle className="w-4 h-4" />
              Start Chatting with D.E.V.I.
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground text-sm"
              onClick={handleDismiss}
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
