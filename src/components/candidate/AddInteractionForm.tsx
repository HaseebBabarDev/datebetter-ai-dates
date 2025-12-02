import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, AlertTriangle, Lightbulb, Phone, Heart, Lock, Shield } from "lucide-react";
import { toast } from "sonner";
import { detectCrisisContent, CRISIS_RESOURCES, CrisisDetectionResult } from "@/lib/crisisDetection";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeLimitDialog } from "@/components/subscription/UpgradeLimitDialog";

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
  const { canUseUpdate, getRemainingUpdates, subscription, refetch } = useSubscription();
  const [open, setOpen] = useState(false);
  const [showBrokeContactDialog, setShowBrokeContactDialog] = useState(false);
  const [showPendingAdviceDialog, setShowPendingAdviceDialog] = useState(false);
  const [showCrisisDialog, setShowCrisisDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [crisisResult, setCrisisResult] = useState<CrisisDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const PRIVACY_ACKNOWLEDGED_KEY = "devi_interaction_privacy_acknowledged";

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

  const handleSubmit = async (e: React.FormEvent, skipCrisisCheck = false) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    // Check for crisis content in notes and gut feeling
    if (!skipCrisisCheck) {
      const textToCheck = `${notes} ${gutFeeling}`;
      const crisis = detectCrisisContent(textToCheck);
      if (crisis.detected) {
        setCrisisResult(crisis);
        setShowCrisisDialog(true);
        return;
      }
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
      
      // Refresh subscription usage data
      refetch();
      
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

  const handleCrisisAcknowledged = async () => {
    setShowCrisisDialog(false);
    // Continue with saving the interaction
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(fakeEvent, true);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const hasAcknowledgedPrivacy = localStorage.getItem(PRIVACY_ACKNOWLEDGED_KEY);
      if (!hasAcknowledgedPrivacy) {
        setShowPrivacyDialog(true);
        return;
      }
    }
    
    if (newOpen && hasPendingAdvice) {
      setShowPendingAdviceDialog(true);
    } else if (newOpen && isNoContact) {
      setShowBrokeContactDialog(true);
    } else if (newOpen && !canUseUpdate(candidateId)) {
      setShowUpgradeDialog(true);
    } else {
      setOpen(newOpen);
    }
  };

  const handlePrivacyAcknowledged = () => {
    localStorage.setItem(PRIVACY_ACKNOWLEDGED_KEY, "true");
    setShowPrivacyDialog(false);
    
    // Continue with the normal flow
    if (hasPendingAdvice) {
      setShowPendingAdviceDialog(true);
    } else if (isNoContact) {
      setShowBrokeContactDialog(true);
    } else if (!canUseUpdate(candidateId)) {
      setShowUpgradeDialog(true);
    } else {
      setOpen(true);
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
      {/* First-time Privacy Reassurance Dialog */}
      <AlertDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Your Secrets Are Safe With Us
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-foreground">
                  Everything you share here is <strong>completely private</strong> and encrypted.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Your notes and feelings are only visible to you
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We never share your data with anyone
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Be honest — raw data leads to better insights
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  This is your safe space to reflect on your dating journey.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handlePrivacyAcknowledged}>
              I Understand, Let's Go
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Crisis Detection Dialog */}
      <AlertDialog open={showCrisisDialog} onOpenChange={setShowCrisisDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Heart className="w-5 h-5" />
              {crisisResult?.severity === "severe" ? "We Care About Your Safety" : "Concerning Content Detected"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-foreground font-medium">
                  {crisisResult?.severity === "severe" 
                    ? "We noticed some concerning language in your notes. Your safety matters to us."
                    : "We detected some language that suggests a difficult situation."}
                </p>
                
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-destructive">If you or someone you know is in crisis:</p>
                  
                  <div className="space-y-2">
                    <a 
                      href={`tel:${CRISIS_RESOURCES.suicide.phone}`}
                      className="flex items-center gap-2 text-sm bg-background rounded-md p-2 hover:bg-muted transition-colors"
                    >
                      <Phone className="w-4 h-4 text-destructive" />
                      <span><strong>988</strong> - Suicide & Crisis Lifeline</span>
                    </a>
                    
                    <a 
                      href={`tel:${CRISIS_RESOURCES.domesticViolence.phone}`}
                      className="flex items-center gap-2 text-sm bg-background rounded-md p-2 hover:bg-muted transition-colors"
                    >
                      <Phone className="w-4 h-4 text-destructive" />
                      <span><strong>1-800-799-7233</strong> - Domestic Violence Hotline</span>
                    </a>
                    
                    <p className="text-xs text-muted-foreground">
                      Or text HOME to 741741 for the Crisis Text Line
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Your notes will still be saved. We just wanted to make sure you have these resources.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCrisisAcknowledged}>
              I Understand, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          {triggerButton ? (
            canUseUpdate(candidateId) ? triggerButton : (
              <Button className="w-full gap-2" variant="outline">
                <Lock className="h-4 w-4" />
                Upgrade to Log More
              </Button>
            )
          ) : (
            canUseUpdate(candidateId) ? (
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Log Interaction
              </Button>
            ) : (
              <Button className="w-full gap-2" variant="outline">
                <Lock className="h-4 w-4" />
                Upgrade to Log More
              </Button>
            )
          )}
        </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Interaction</SheetTitle>
          <SheetDescription>
            Record a date, call, or hangout
          </SheetDescription>
          <Badge variant="outline" className="mt-3 text-xs py-1.5 border-accent/30 bg-accent/5 text-foreground">
            Honesty is key - This is a judgment-free zone. Share exactly what you feel, no need to be perfect.
          </Badge>
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
                  max={new Date().toISOString().split("T")[0]}
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
      <UpgradeLimitDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        limitType="updates"
        currentPlan={subscription?.plan}
      />
    </>
  );
};
