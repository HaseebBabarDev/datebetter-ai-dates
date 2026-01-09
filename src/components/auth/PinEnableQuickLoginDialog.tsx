import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/auth/PinInput";
import { KeyRound, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { encryptSessionWithPin, getPinStorageKey, getPinEnabledKey } from "@/lib/pinCrypto";

interface PinEnableQuickLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  email?: string | null;
  onComplete: () => void;
  onSkip: () => void;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "datebetter_pin_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const PinEnableQuickLoginDialog: React.FC<PinEnableQuickLoginDialogProps> = ({
  open,
  onOpenChange,
  userId,
  email,
  onComplete,
  onSkip,
}) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!open) {
      setPin("");
      setLoading(false);
      setAttempts(0);
    }
  }, [open]);

  const handleEnable = async () => {
    if (pin.length !== 4) return;

    setLoading(true);
    try {
      const enteredHash = await hashPin(pin);

      const { data: pinRow, error: pinError } = await supabase
        .from("user_pins")
        .select("pin_hash")
        .eq("user_id", userId)
        .single();

      if (pinError || !pinRow?.pin_hash) {
        toast({ title: "PIN not found", variant: "destructive" });
        onSkip();
        return;
      }

      if (pinRow.pin_hash !== enteredHash) {
        const next = attempts + 1;
        setAttempts(next);
        setPin("");
        toast({ title: "Incorrect PIN", variant: "destructive" });
        if (next >= 3) {
          toast({ title: "Too many attempts", description: "Try again later", variant: "destructive" });
          onSkip();
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token || !session?.refresh_token) {
        toast({ title: "Session missing", description: "Please sign in again", variant: "destructive" });
        onSkip();
        return;
      }

      if (!email) {
        toast({ title: "Email required", description: "Cannot enable PIN without email", variant: "destructive" });
        onSkip();
        return;
      }

      const storageKey = getPinStorageKey(email);
      const encrypted = await encryptSessionWithPin(pin, {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });
      localStorage.setItem(storageKey, encrypted);

      localStorage.setItem("datebetter_saved_email", email);
      localStorage.setItem(getPinEnabledKey(email), "true");

      toast({ title: "PIN quick sign-in enabled" });
      onComplete();
    } catch (e) {
      console.error(e);
      toast({ title: "Could not enable PIN login", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const canEnable = pin.length === 4;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[image:var(--gradient-hero)] flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">Enable Quick PIN Sign-In</DialogTitle>
          <DialogDescription className="text-center">
            Enter your current 4-digit PIN to enable quick sign-in on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <PinInput value={pin} onChange={setPin} disabled={loading} />

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleEnable}
              disabled={!canEnable || loading}
              className="w-full bg-[image:var(--gradient-hero)]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Enabling...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={onSkip} disabled={loading}>
              Not now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
