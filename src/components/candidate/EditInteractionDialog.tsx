import React, { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Shield, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Interaction = Tables<"interactions">;

interface EditInteractionDialogProps {
  interaction: Interaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditInteractionDialog: React.FC<EditInteractionDialogProps> = ({
  interaction,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [showTruthfulnessReminder, setShowTruthfulnessReminder] = useState(false);
  const [interactionDate, setInteractionDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize form when interaction changes
  useEffect(() => {
    if (interaction) {
      // Parse date string correctly to avoid timezone issues
      // interaction_date is stored as "YYYY-MM-DD" string
      if (interaction.interaction_date) {
        const [year, month, day] = interaction.interaction_date.split("-").map(Number);
        setInteractionDate(new Date(year, month - 1, day));
      } else {
        setInteractionDate(new Date());
      }
      setNotes(interaction.notes || "");
    }
  }, [interaction]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && interaction) {
      // Show truthfulness reminder first
      setShowTruthfulnessReminder(true);
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleTruthfulnessAcknowledged = () => {
    setShowTruthfulnessReminder(false);
    onOpenChange(true);
  };

  const handleSave = async () => {
    if (!user || !interaction) {
      toast.error("Unable to save changes");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("interactions")
        .update({
          interaction_date: format(interactionDate, "yyyy-MM-dd"),
          notes: notes || null,
        })
        .eq("id", interaction.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Interaction updated!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating interaction:", error);
      toast.error("Failed to update interaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Truthfulness Reminder Dialog */}
      <AlertDialog
        open={showTruthfulnessReminder}
        onOpenChange={setShowTruthfulnessReminder}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Be Honest When Editing
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your entries power D.E.V.I.'s insights. Accurate data leads to better advice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Only edit if the original entry was genuinely incorrect
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Don't change notes to make things seem better or worse than they were
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Your raw, honest data helps you see patterns clearly
              </li>
            </ul>
            <p className="text-sm font-medium text-foreground mt-4">
              Remember: This is for <em>you</em>. Honesty here means clarity later.
            </p>
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTruthfulnessReminder(false)}
            >
              Cancel
            </Button>
            <AlertDialogAction onClick={handleTruthfulnessAcknowledged}>
              I'll Be Honest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit Interaction
            </DialogTitle>
            <DialogDescription>
              Update the date or notes for this interaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !interactionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {interactionDate ? (
                      format(interactionDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={interactionDate}
                    onSelect={(date) => {
                      if (date) {
                        // Create a new date at noon to avoid timezone issues
                        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
                        setInteractionDate(normalizedDate);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="What happened? How did it feel?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be honest about what happened — raw details lead to clearer insights
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
