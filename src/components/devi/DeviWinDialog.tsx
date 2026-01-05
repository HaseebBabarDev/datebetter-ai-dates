import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Clock, Heart, PhoneOff, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviWinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  candidateId?: string;
  conversationId?: string;
  onWinLogged?: () => void;
}

const WIN_TYPES = [
  {
    value: "saved_time",
    label: "Saved me time",
    icon: Clock,
    description: "Got clarity faster than figuring it out alone",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  {
    value: "avoided_crash_out",
    label: "Stopped a crash-out",
    icon: Heart,
    description: "Helped me stay calm instead of spiraling",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10 border-rose-500/20",
  },
  {
    value: "resisted_contact",
    label: "Didn't contact them",
    icon: PhoneOff,
    description: "Helped me resist reaching out when I shouldn't",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10 border-violet-500/20",
  },
  {
    value: "other",
    label: "Another win",
    icon: Sparkles,
    description: "D.E.V.I. helped in a different way",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
];

export const DeviWinDialog: React.FC<DeviWinDialogProps> = ({
  open,
  onOpenChange,
  userId,
  candidateId,
  conversationId,
  onWinLogged,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [journalNote, setJournalNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"select" | "journal" | "success">("select");

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setStep("journal");
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      scalar: 0.8,
      colors: ["#ec4899", "#f472b6", "#f9a8d4"],
    });

    fire(0.2, {
      spread: 60,
      scalar: 1.2,
      colors: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ["#ec4899", "#8b5cf6", "#f472b6"],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ["#fbbf24", "#f59e0b"],
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ["#ec4899", "#8b5cf6", "#fbbf24"],
    });
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setSaving(true);

    try {
      const { error } = await supabase.from("devi_wins").insert({
        user_id: userId,
        win_type: selectedType,
        journal_note: journalNote.trim() || null,
        candidate_id: candidateId || null,
        conversation_id: conversationId || null,
      });

      if (error) throw error;

      triggerConfetti();
      setStep("success");
      onWinLogged?.();

      // Auto close after celebration
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (error) {
      console.error("Error logging win:", error);
      toast.error("Couldn't save your win. Try again?");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setSelectedType(null);
      setJournalNote("");
      setStep("select");
    }, 300);
  };

  const handleBack = () => {
    setStep("select");
    setJournalNote("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "select" && (
          <>
            <DialogHeader className="text-center pb-2">
              <DialogTitle className="text-xl font-semibold flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Did D.E.V.I. help?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Celebrate your win! What did this chat help you with?
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              {WIN_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleSelectType(type.value)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                      type.bgColor,
                      "hover:shadow-md"
                    )}
                  >
                    <div className={cn("mt-0.5", type.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{type.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full text-muted-foreground"
            >
              Not this time
            </Button>
          </>
        )}

        {step === "journal" && (
          <>
            <DialogHeader className="text-center pb-2">
              <DialogTitle className="text-xl font-semibold">
                Capture this moment
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Optional: Write a quick note about what happened
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <Textarea
                placeholder="e.g., Was about to double text but talked it through with D.E.V.I. instead..."
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
                className="min-h-[100px] resize-none rounded-xl"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {journalNote.length}/500
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Log this win
                  </span>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Win logged!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Every small win counts. You're doing great!
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Prompt component to show after conversation
interface DeviWinPromptProps {
  onLogWin: () => void;
  className?: string;
}

export const DeviWinPrompt: React.FC<DeviWinPromptProps> = ({
  onLogWin,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/20 rounded-xl animate-fade-in",
        className
      )}
    >
      <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
      <span className="text-sm text-muted-foreground">Did this chat help?</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={onLogWin}
        className="text-primary hover:text-primary hover:bg-primary/10 h-7 px-3"
      >
        Log a win
      </Button>
    </div>
  );
};
