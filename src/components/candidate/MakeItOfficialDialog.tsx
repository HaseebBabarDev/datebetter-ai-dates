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
import { Heart, PartyPopper, Users, XCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const RELATIONSHIP_TYPES = [
  { value: "monogamous", label: "Monogamous", emoji: "💑" },
  { value: "open", label: "Open Relationship", emoji: "🔓" },
  { value: "polyamorous", label: "Polyamorous", emoji: "💞" },
  { value: "other", label: "Other / It's Complicated", emoji: "✨" },
];

const RELATIONSHIP_INTENTIONS = [
  { value: "marriage", label: "Marriage", emoji: "💍" },
  { value: "long_term", label: "Long-Term Partnership", emoji: "🏡" },
  { value: "committed_no_marriage", label: "Committed, No Marriage", emoji: "🤝" },
  { value: "exploring", label: "Exploring Together", emoji: "🌱" },
  { value: "unsure", label: "Not Sure Yet", emoji: "🤷" },
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
    onComplete();
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setStep("confirm");
      setRelationshipType("");
    }
    onOpenChange(val);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-sm">
        {step === "confirm" && (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <AlertDialogTitle className="text-lg">
                  Make It Official?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-3 text-left">
                <p>
                  Ready to commit to <span className="font-semibold text-foreground">{candidateName}</span>? We'll ask a couple of questions to personalize your relationship advice.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">Not Yet</AlertDialogCancel>
              <Button className="w-full sm:w-auto gap-2" onClick={() => setStep("type")}>
                <Heart className="w-4 h-4" />
                Let's Go
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "type" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">What kind of relationship?</AlertDialogTitle>
              <AlertDialogDescription>
                This helps us give you the right advice for your relationship style.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-2">
              {RELATIONSHIP_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => { setRelationshipType(type.value); setStep("intention"); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <span className="text-xl">{type.emoji}</span>
                  <span className="flex-1 font-medium text-sm text-foreground">{type.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
            <AlertDialogFooter>
              <Button variant="ghost" onClick={() => setStep("confirm")} className="text-muted-foreground">Back</Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "intention" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">What's the goal?</AlertDialogTitle>
              <AlertDialogDescription>Where do you see this going with {candidateName}?</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-2">
              {RELATIONSHIP_INTENTIONS.map((intention) => (
                <button
                  key={intention.value}
                  onClick={() => saveAndCelebrate(relationshipType, intention.value)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <span className="text-xl">{intention.emoji}</span>
                  <span className="flex-1 font-medium text-sm text-foreground">{intention.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
            <AlertDialogFooter>
              <Button variant="ghost" onClick={() => setStep("type")} className="text-muted-foreground">Back</Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "celebrate" && (
          <>
            <AlertDialogHeader>
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <PartyPopper className="w-8 h-8 text-primary" />
                </div>
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
          </>
        )}

        {step === "archive-others" && (
          <>
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
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
