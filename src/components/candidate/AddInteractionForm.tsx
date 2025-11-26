import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SliderInput } from "@/components/onboarding/SliderInput";
import { Plus, AlertTriangle, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface AddInteractionFormProps {
  candidateId: string;
  onSuccess: () => void;
  onRescore?: () => void;
  isNoContact?: boolean;
  onBrokeContact?: () => void;
  hasPendingAdvice?: boolean;
  defaultType?: Enums<"interaction_type">;
  triggerButton?: React.ReactNode;
}

const INTERACTION_TYPES: { value: Enums<"interaction_type">; label: string; highlight?: boolean }[] = [
  { value: "intimate", label: "💕 Intimate", highlight: true },
  { value: "coffee", label: "Coffee Date" },
  { value: "dinner", label: "Dinner" },
  { value: "drinks", label: "Drinks" },
  { value: "movie", label: "Movie" },
  { value: "facetime", label: "Video Call" },
  { value: "phone_call", label: "Phone Call" },
  { value: "texting", label: "Texting Session" },
  { value: "activity", label: "Activity/Sport" },
  { value: "home_hangout", label: "Home Hangout" },
  { value: "group_hang", label: "Group Hang" },
  { value: "trip", label: "Trip Together" },
  { value: "event", label: "Event/Concert" },
];

const DURATION_OPTIONS = [
  "< 1 hour",
  "1-2 hours",
  "2-4 hours",
  "Half day",
  "Full day",
  "Overnight",
  "Multiple days",
];

export const AddInteractionForm: React.FC<AddInteractionFormProps> = ({
  candidateId,
  onSuccess,
  onRescore,
  isNoContact = false,
  onBrokeContact,
  hasPendingAdvice = false,
  defaultType = "coffee",
  triggerButton,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showBrokeContactDialog, setShowBrokeContactDialog] = useState(false);
  const [showPendingAdviceDialog, setShowPendingAdviceDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [interactionType, setInteractionType] = useState<Enums<"interaction_type">>(defaultType);
  const [interactionDate, setInteractionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [duration, setDuration] = useState("");
  const [whoInitiated, setWhoInitiated] = useState("");
  const [overallFeeling, setOverallFeeling] = useState(3);
  const [gutFeeling, setGutFeeling] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setInteractionType("coffee");
    setInteractionDate(new Date().toISOString().split("T")[0]);
    setDuration("");
    setWhoInitiated("");
    setOverallFeeling(3);
    setGutFeeling("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("interactions").insert({
        user_id: user.id,
        candidate_id: candidateId,
        interaction_type: interactionType,
        interaction_date: interactionDate,
        duration: duration || null,
        who_initiated: whoInitiated || null,
        overall_feeling: overallFeeling,
        gut_feeling: gutFeeling || null,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Interaction logged! Updating compatibility...");
      resetForm();
      setOpen(false);
      onSuccess();
      
      // Trigger rescore after logging interaction
      if (onRescore) {
        onRescore();
      }
    } catch (error) {
      console.error("Error adding interaction:", error);
      toast.error("Failed to log interaction");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && hasPendingAdvice) {
      setShowPendingAdviceDialog(true);
    } else if (newOpen && isNoContact) {
      setShowBrokeContactDialog(true);
    } else {
      setOpen(newOpen);
    }
  };

  const handleBrokeContact = () => {
    setShowBrokeContactDialog(false);
    if (onBrokeContact) {
      onBrokeContact();
    }
    setOpen(true);
  };

  return (
    <>
      <AlertDialog open={showPendingAdviceDialog} onOpenChange={setShowPendingAdviceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Respond to AI Advice First
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You have pending AI advice that needs your attention before logging a new interaction.</p>
              <p>Please go to the <strong>Insights</strong> tab and accept or decline the advice to continue.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBrokeContactDialog} onOpenChange={setShowBrokeContactDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              You're in No Contact Mode
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Logging an interaction means you've had contact. This will end your No Contact streak.</p>
              <p>Are you sure you want to continue? It's okay if you slipped — healing isn't linear.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep No Contact</AlertDialogCancel>
            <AlertDialogAction onClick={handleBrokeContact}>
              Yes, I Broke Contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          {triggerButton || (
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Log Interaction
            </Button>
          )}
        </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Interaction</SheetTitle>
          <SheetDescription>
            Record a date, call, or hangout
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type of Interaction</Label>
              <Select
                value={interactionType}
                onValueChange={(v) => setInteractionType(v as Enums<"interaction_type">)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      className={type.highlight ? "text-pink-600 font-medium" : ""}
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={interactionDate}
                  onChange={(e) => setInteractionDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Who initiated?</Label>
              <Select value={whoInitiated} onValueChange={setWhoInitiated}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">I did</SelectItem>
                  <SelectItem value="them">They did</SelectItem>
                  <SelectItem value="mutual">Mutual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <SliderInput
              label="How did it feel overall?"
              value={overallFeeling}
              onChange={setOverallFeeling}
              leftLabel="Not great"
              rightLabel="Amazing"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gut feeling (one word)</Label>
              <Input
                placeholder="e.g., excited, uncertain, comfortable"
                value={gutFeeling}
                onChange={(e) => setGutFeeling(e.target.value)}
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="What happened? How did you feel? Any memorable moments?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Log Interaction"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
    </>
  );
};
