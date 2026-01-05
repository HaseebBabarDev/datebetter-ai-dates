import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Trash2, RefreshCw, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PinInput } from "@/components/auth/PinInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PinManagementProps {
  userId: string;
}

// Hash function for PIN (same as in PinSetupDialog)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "datebetter_pin_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const PinManagement: React.FC<PinManagementProps> = ({ userId }) => {
  const [hasPin, setHasPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [resetStep, setResetStep] = useState<"enter" | "confirm">("enter");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, [userId]);

  const checkPinStatus = async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from("user_pins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking PIN status:", error);
        // Don't throw - just set hasPin to false and continue
        setHasPin(false);
      } else {
        setHasPin(!!data);
      }
    } catch (error) {
      console.error("Error checking PIN status:", error);
      setHasPin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePin = async () => {
    if (!confirm("Are you sure you want to remove your PIN? You'll need to use your password to log in.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("user_pins")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      // Clear localStorage
      localStorage.removeItem("datebetter_pin_enabled");
      localStorage.removeItem("datebetter_saved_email");
      sessionStorage.removeItem("datebetter_temp_session");

      setHasPin(false);
      toast.success("PIN removed successfully");
    } catch (error) {
      console.error("Error removing PIN:", error);
      toast.error("Failed to remove PIN");
    }
  };

  const handleResetPin = () => {
    setNewPin("");
    setConfirmPin("");
    setResetStep("enter");
    setShowResetDialog(true);
  };

  const handlePinEntered = (pin: string) => {
    if (resetStep === "enter") {
      setNewPin(pin);
      setResetStep("confirm");
    } else {
      setConfirmPin(pin);
    }
  };

  const handleSaveNewPin = async () => {
    if (newPin !== confirmPin) {
      toast.error("PINs don't match. Please try again.");
      setNewPin("");
      setConfirmPin("");
      setResetStep("enter");
      return;
    }

    setSaving(true);
    try {
      const pinHash = await hashPin(newPin);

      // Check if PIN exists
      const { data: existing } = await supabase
        .from("user_pins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_pins")
          .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_pins")
          .insert({ user_id: userId, pin_hash: pinHash });

        if (error) throw error;
      }

      // Update localStorage
      localStorage.setItem("datebetter_pin_enabled", "true");

      setHasPin(true);
      setShowResetDialog(false);
      toast.success(existing ? "PIN updated successfully" : "PIN set up successfully");
    } catch (error) {
      console.error("Error saving PIN:", error);
      toast.error("Failed to save PIN");
    } finally {
      setSaving(false);
    }
  };

  const canSave = confirmPin.length === 4 && newPin.length === 4;

  if (loading) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Quick Login PIN
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-3">
            {hasPin 
              ? "You have a 4-digit PIN set up for quick login."
              : "Set up a 4-digit PIN for faster login on this device."
            }
          </p>
          <div className="flex gap-2">
            {hasPin ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPin}
                  className="flex-1 h-9 text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Change PIN
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePin}
                  className="h-9 text-sm text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleResetPin}
                className="flex-1 h-9 text-sm"
              >
                <Lock className="w-4 h-4 mr-2" />
                Set Up PIN
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              {hasPin ? "Change PIN" : "Set Up PIN"}
            </DialogTitle>
            <DialogDescription>
              {resetStep === "enter" 
                ? "Enter a new 4-digit PIN"
                : "Confirm your new PIN"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <PinInput
              value={resetStep === "enter" ? newPin : confirmPin}
              onChange={handlePinEntered}
              disabled={saving}
            />
            {resetStep === "confirm" && canSave && (
              <Button
                onClick={handleSaveNewPin}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm PIN
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
