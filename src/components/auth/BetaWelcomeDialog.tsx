import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Heart, Shield, Target } from "lucide-react";

interface BetaWelcomeDialogProps {
  open: boolean;
  onContinue: () => void;
}

export function BetaWelcomeDialog({ open, onContinue }: BetaWelcomeDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 bg-gradient-to-b from-background to-muted/30">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Thank You for Beta Testing
              </h2>
              <p className="text-muted-foreground text-sm">
                You're helping shape the future of intentional dating
              </p>
            </div>

            {/* Why Your Feedback Matters */}
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                Why Your Daily Use Matters
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every interaction you have helps us refine D.E.V.I.'s understanding of real dating situations. 
                Your consistent use—logging interactions, asking questions, and sharing feedback—directly 
                shapes how we serve women navigating modern dating.
              </p>
            </div>

            {/* The Gap We're Filling */}
            <div className="space-y-4">
              <h3 className="font-medium text-center">The Gap We're Bridging</h3>
              
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">❌</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">General AI Tools</p>
                    <p className="text-xs text-muted-foreground">
                      People use ChatGPT for deeply personal relationship decisions, despite it being designed for academic tasks—not emotional intelligence.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">❌</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dating Apps</p>
                    <p className="text-xs text-muted-foreground">
                      Optimized for matches and engagement, not successful relationship outcomes. Their business model depends on you staying single.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">✨</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">DateBetter</p>
                    <p className="text-xs text-muted-foreground">
                      Not a dating app—a dedicated AI agent designed specifically for relationships. We succeed when <span className="italic">you</span> succeed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Meet DEVI */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Meet D.E.V.I.</h3>
                  <p className="text-xs text-muted-foreground">Your AI Dating Intelligence</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                At the core of DateBetter is <span className="font-medium text-foreground">D.E.V.I.</span>—an AI dating assistant built to act as a trusted voice of reason and intuitive best friend. Her mission: helping you navigate dating decisions with clarity, logic, and emotional intelligence.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <p className="text-xs font-medium">Private</p>
                  <p className="text-[10px] text-muted-foreground">by design</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <p className="text-xs font-medium">Context</p>
                  <p className="text-[10px] text-muted-foreground">aware</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <p className="text-xs font-medium">Outcome</p>
                  <p className="text-[10px] text-muted-foreground">focused</p>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground italic pt-2">
                "Devi" means goddess in Hindi and Nepali—symbolizing intuition, wisdom, and inner authority.
              </p>
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <Button 
                onClick={onContinue} 
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                <Target className="w-4 h-4 mr-2" />
                Let's Get Started
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Your feedback shapes our roadmap. We're listening.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
