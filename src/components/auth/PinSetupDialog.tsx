import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PinInput } from "./PinInput";
import { KeyRound, Shield, ArrowRight, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { encryptSessionWithPin, PIN_SESSION_STORAGE_KEY } from "@/lib/pinCrypto";

interface PinSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  onSkip: () => void;
}

// Hash function for PIN (must match PinManagement and PinLoginScreen)
const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "datebetter_pin_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const PinSetupDialog: React.FC<PinSetupDialogProps> = ({
  open,
  onOpenChange,
  onComplete,
  onSkip,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreatePin = () => {
    if (pin.length !== 4) {
      toast({ title: "Please enter a 4-digit PIN", variant: "destructive" });
      return;
    }
    setStep("confirm");
  };

  const handleConfirmPin = async () => {
    if (confirmPin !== pin) {
      toast({ title: "PINs don't match. Please try again.", variant: "destructive" });
      setConfirmPin("");
      return;
    }

    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const pinHash = await hashPin(pin);

      // Check if user already has a PIN
      const { data: existingPin } = await supabase
        .from("user_pins")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingPin) {
        // Update existing PIN
        const { error } = await supabase
          .from("user_pins")
          .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new PIN
        const { error } = await supabase.from("user_pins").insert({
          user_id: user.id,
          pin_hash: pinHash,
        });

        if (error) throw error;
      }

      // Save encrypted session for PIN quick login on this device
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token && session?.refresh_token) {
        const encrypted = await encryptSessionWithPin(pin, {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        });
        localStorage.setItem(PIN_SESSION_STORAGE_KEY, encrypted);
      }

      // Save email to localStorage for quick login
      if (user.email) {
        localStorage.setItem("datebetter_saved_email", user.email);
        localStorage.setItem("datebetter_pin_enabled", "true");
      }

      toast({ title: "PIN set up successfully!" });
      onComplete();
    } catch (error) {
      console.error("Error setting up PIN:", error);
      toast({ title: "Failed to set up PIN", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem("datebetter_pin_enabled");
    localStorage.removeItem("datebetter_saved_email");
    localStorage.removeItem(PIN_SESSION_STORAGE_KEY);
    onSkip();
  };

  const resetDialog = () => {
    setStep("create");
    setPin("");
    setConfirmPin("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetDialog();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[image:var(--gradient-hero)] flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">
            {step === "create" ? "Set Up Quick PIN" : "Confirm Your PIN"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "create"
              ? "Create a 4-digit PIN for faster logins"
              : "Enter your PIN again to confirm"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === "create" ? (
            <div className="space-y-6">
              <PinInput value={pin} onChange={setPin} />

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Your PIN is encrypted & secure</span>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCreatePin}
                  disabled={pin.length !== 4}
                  className="w-full bg-[image:var(--gradient-hero)]"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <PinInput value={confirmPin} onChange={setConfirmPin} />

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleConfirmPin}
                  disabled={confirmPin.length !== 4 || loading}
                  className="w-full bg-[image:var(--gradient-hero)]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Setting up...
                    </span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirm PIN
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep("create");
                    setConfirmPin("");
                  }}
                >
                  Go back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
