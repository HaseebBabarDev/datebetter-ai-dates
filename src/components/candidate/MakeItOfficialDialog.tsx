import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Heart, PartyPopper, Users, XCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const RELATIONSHIP_TYPES = [
  { value: "monogamous", label: "Monogamous", emoji: "💑", desc: "Just the two of you" },
  { value: "open", label: "Open Relationship", emoji: "🔓", desc: "Together with room to explore" },
  { value: "polyamorous", label: "Polyamorous", emoji: "💞", desc: "Multiple loving partnerships" },
  { value: "other", label: "Other / It's Complicated", emoji: "✨", desc: "Your own definition" },
];

const RELATIONSHIP_INTENTIONS = [
  { value: "marriage", label: "Marriage", emoji: "💍", desc: "Walking down the aisle" },
  { value: "long_term", label: "Long-Term Partnership", emoji: "🏡", desc: "Building a life together" },
  { value: "committed_no_marriage", label: "Committed, No Marriage", emoji: "🤝", desc: "Dedicated without the paperwork" },
  { value: "exploring", label: "Exploring Together", emoji: "🌱", desc: "Seeing where it goes" },
  { value: "unsure", label: "Not Sure Yet", emoji: "🤷", desc: "And that's totally okay" },
];

interface MakeItOfficialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  userId: string;
  onComplete: () => void;
}

type Step = "confirm" | "type" | "intention" | "celebrate" | "archive-others";

interface SelectionCardProps {
  emoji: string;
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
  index: number;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ emoji, label, desc, selected, onClick, index }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
    whileTap={{ scale: 0.97 }}
    className={`w-full rounded-xl border-2 px-3 py-2.5 text-left transition-colors duration-200 relative overflow-hidden ${
      selected
        ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
        : "border-border/40 bg-card hover:border-primary/30 hover:bg-primary/[0.02]"
    }`}
  >
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute inset-0 bg-gradient-to-r from-primary/[0.06] to-transparent pointer-events-none"
        />
      )}
    </AnimatePresence>

    <div className="flex gap-3 items-center w-full relative z-10">
      <motion.div
        animate={selected ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-xl shrink-0"
      >
        {emoji}
      </motion.div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium leading-tight block transition-colors duration-200 ${
          selected ? "text-primary" : "text-foreground"
        }`}>
          {label}
        </span>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{desc}</p>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.button>
);

export const MakeItOfficialDialog: React.FC<MakeItOfficialDialogProps> = ({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  userId,
  onComplete,
}) => {
  const [step, setStep] = useState<Step>("confirm");
  const [relationshipType, setRelationshipType] = useState("");
  const [relationshipIntention, setRelationshipIntention] = useState("");
  const [archiving, setArchiving] = useState(false);

  const saveAndCelebrate = async (type: string, intention: string) => {
    try {
      const { error } = await supabase
        .from("candidates")
        .update({
          status: "serious_relationship",
          relationship_type: type,
          relationship_intention: intention,
          relationship_started_at: new Date().toISOString(),
        } as any)
        .eq("id", candidateId);

      if (error) throw error;
      setStep("celebrate");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleArchiveOthers = async () => {
    setArchiving(true);
    try {
      const { error } = await supabase
        .from("candidates")
        .update({
          status: "archived",
          end_reason: "Met someone else",
          relationship_ended_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .neq("id", candidateId)
        .neq("status", "archived");

      if (error) throw error;
      toast.success("All other candidates have been archived. Focus on your love! 💕");
      resetAndClose();
    } catch {
      toast.error("Something went wrong archiving candidates.");
    } finally {
      setArchiving(false);
    }
  };

  const handleSkipArchive = () => {
    toast.success(`Congrats on making it official with ${candidateName}! 🎉`);
    resetAndClose();
  };

  const resetAndClose = () => {
    onOpenChange(false);
    setStep("confirm");
    setRelationshipType("");
    setRelationshipIntention("");
    onComplete();
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setStep("confirm");
      setRelationshipType("");
      setRelationshipIntention("");
    }
    onOpenChange(val);
  };

  const handleTypeSelect = (value: string) => {
    setRelationshipType(value);
    // Small delay for the selection animation to register visually
    setTimeout(() => setStep("intention"), 250);
  };

  const handleIntentionSelect = (value: string) => {
    setRelationshipIntention(value);
    setTimeout(() => saveAndCelebrate(relationshipType, value), 250);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-sm">
        <AnimatePresence mode="wait">
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <AlertDialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    className="p-2 rounded-full bg-primary/10"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <Heart className="w-5 h-5 text-primary" />
                  </motion.div>
                  <AlertDialogTitle className="text-lg">Make It Official?</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="space-y-3 text-left">
                  <p>
                    Ready to commit to <span className="font-semibold text-foreground">{candidateName}</span>? We'll ask a couple of questions to personalize your relationship advice.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                <AlertDialogCancel className="w-full sm:w-auto">Not Yet</AlertDialogCancel>
                <Button className="w-full sm:w-auto gap-2" onClick={() => setStep("type")}>
                  <Heart className="w-4 h-4" />
                  Let's Go
                </Button>
              </AlertDialogFooter>
            </motion.div>
          )}

          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">What kind of relationship? 💕</AlertDialogTitle>
                <AlertDialogDescription>
                  This helps us give you the right advice.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-3">
                {RELATIONSHIP_TYPES.map((type, i) => (
                  <SelectionCard
                    key={type.value}
                    emoji={type.emoji}
                    label={type.label}
                    desc={type.desc}
                    selected={relationshipType === type.value}
                    onClick={() => handleTypeSelect(type.value)}
                    index={i}
                  />
                ))}
              </div>
              <AlertDialogFooter>
                <Button variant="ghost" onClick={() => setStep("confirm")} className="text-muted-foreground">Back</Button>
              </AlertDialogFooter>
            </motion.div>
          )}

          {step === "intention" && (
            <motion.div
              key="intention"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">What's the goal? 🎯</AlertDialogTitle>
                <AlertDialogDescription>Where do you see this going with {candidateName}?</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-3">
                {RELATIONSHIP_INTENTIONS.map((intention, i) => (
                  <SelectionCard
                    key={intention.value}
                    emoji={intention.emoji}
                    label={intention.label}
                    desc={intention.desc}
                    selected={relationshipIntention === intention.value}
                    onClick={() => handleIntentionSelect(intention.value)}
                    index={i}
                  />
                ))}
              </div>
              <AlertDialogFooter>
                <Button variant="ghost" onClick={() => setStep("type")} className="text-muted-foreground">Back</Button>
              </AlertDialogFooter>
            </motion.div>
          )}

          {step === "celebrate" && (
            <motion.div
              key="celebrate"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <AlertDialogHeader>
                <div className="flex flex-col items-center text-center gap-3 py-2">
                  <motion.div
                    className="p-3 rounded-full bg-primary/10"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                  >
                    <PartyPopper className="w-8 h-8 text-primary" />
                  </motion.div>
                  <AlertDialogTitle className="text-xl">Congratulations! 🎉</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p className="text-base">
                      You and <span className="font-semibold text-foreground">{candidateName}</span> are officially together!
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground text-left">
                          Would you like to <span className="font-medium text-foreground">end things with all other candidates</span>? This will archive them so you can focus on your relationship.
                        </p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2">
                <Button className="w-full gap-2" variant="default" onClick={() => setStep("archive-others")}>
                  <XCircle className="w-4 h-4" />
                  Yes, End Other Candidates
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleSkipArchive}>
                  No, I'll Manage Them Myself
                </Button>
              </AlertDialogFooter>
            </motion.div>
          )}

          {step === "archive-others" && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  Archive All Other Candidates?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  All candidates except <span className="font-semibold text-foreground">{candidateName}</span> will be archived. You can always reopen them later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="ghost" onClick={handleSkipArchive} disabled={archiving}>Cancel</Button>
                <Button variant="destructive" onClick={handleArchiveOthers} disabled={archiving} className="gap-2">
                  {archiving ? "Archiving..." : "Archive All Others"}
                </Button>
              </AlertDialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </AlertDialogContent>
    </AlertDialog>
  );
};
