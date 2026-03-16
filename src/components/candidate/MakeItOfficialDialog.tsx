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
import { Heart, PartyPopper, Users, XCircle } from "lucide-react";
import { toast } from "sonner";

interface MakeItOfficialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  userId: string;
  onComplete: () => void;
}

export const MakeItOfficialDialog: React.FC<MakeItOfficialDialogProps> = ({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  userId,
  onComplete,
}) => {
  const [step, setStep] = useState<"confirm" | "celebrate" | "archive-others">("confirm");
  const [archiving, setArchiving] = useState(false);

  const handleConfirm = async () => {
    try {
      const { error } = await supabase
        .from("candidates")
        .update({ status: "serious_relationship" })
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
      onOpenChange(false);
      setStep("confirm");
      onComplete();
    } catch {
      toast.error("Something went wrong archiving candidates.");
    } finally {
      setArchiving(false);
    }
  };

  const handleSkipArchive = () => {
    toast.success(`Congrats on making it official with ${candidateName}! 🎉`);
    onOpenChange(false);
    setStep("confirm");
    onComplete();
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setStep("confirm");
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
                <div className="p-2 rounded-full bg-pink-500/10">
                  <Heart className="w-5 h-5 text-pink-500" />
                </div>
                <AlertDialogTitle className="text-lg">
                  Make It Official?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-3 text-left">
                <p>
                  Ready to commit to <span className="font-semibold text-foreground">{candidateName}</span>? This will move them to <span className="font-medium text-foreground">Serious Relationship</span> status.
                </p>
                <p className="text-sm text-muted-foreground">
                  Your advice and insights will shift to focus on building and maintaining a healthy relationship.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">Not Yet</AlertDialogCancel>
              <Button
                className="w-full sm:w-auto gap-2 bg-pink-500 hover:bg-pink-600 text-white"
                onClick={handleConfirm}
              >
                <Heart className="w-4 h-4" />
                Make It Official
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "celebrate" && (
          <>
            <AlertDialogHeader>
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <div className="p-3 rounded-full bg-pink-500/10">
                  <PartyPopper className="w-8 h-8 text-pink-500" />
                </div>
                <AlertDialogTitle className="text-xl">
                  Congratulations! 🎉
                </AlertDialogTitle>
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
              <Button
                className="w-full gap-2"
                variant="default"
                onClick={() => setStep("archive-others")}
              >
                <XCircle className="w-4 h-4" />
                Yes, End Other Candidates
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleSkipArchive}
              >
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
                All candidates except <span className="font-semibold text-foreground">{candidateName}</span> will be archived with "Met someone else" as the reason. You can always reopen them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={handleSkipArchive}
                disabled={archiving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleArchiveOthers}
                disabled={archiving}
                className="gap-2"
              >
                {archiving ? "Archiving..." : "Archive All Others"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
