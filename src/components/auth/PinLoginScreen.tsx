import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PinInput } from "./PinInput";
import { KeyRound, User, ArrowLeft, Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import authBg from "@/assets/auth-bg.jpg";
import {
  decryptSessionWithPin,
  encryptSessionWithPin,
  PIN_SESSION_STORAGE_KEY,
} from "@/lib/pinCrypto";

interface PinLoginScreenProps {
  email: string;
  onSuccess: () => void;
  onSwitchAccount: () => void;
}

export const PinLoginScreen: React.FC<PinLoginScreenProps> = ({
  email,
  onSuccess,
  onSwitchAccount,
}) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (pin.length === 4) void handlePinLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handlePinLogin = async () => {
    if (pin.length !== 4) return;

    const encrypted = localStorage.getItem(PIN_SESSION_STORAGE_KEY);
    if (!encrypted) {
      // Silently redirect to password login - no error toast needed
      onSwitchAccount();
      return;
    }

    setLoading(true);
    try {
      const { accessToken, refreshToken } = await decryptSessionWithPin(pin, encrypted);

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        localStorage.removeItem(PIN_SESSION_STORAGE_KEY);
        toast({
          title: "Session expired",
          description: "Please sign in with your password again.",
          variant: "destructive",
        });
        onSwitchAccount();
        return;
      }

      // Re-encrypt the new session tokens for future PIN logins
      // (tokens may have been refreshed by setSession)
      if (data.session.access_token && data.session.refresh_token) {
        const newEncrypted = await encryptSessionWithPin(pin, {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        });
        localStorage.setItem(PIN_SESSION_STORAGE_KEY, newEncrypted);
      }

      toast({ title: "Welcome back!" });
      onSuccess();
    } catch (e) {
      const next = attempts + 1;
      setAttempts(next);
      setPin("");

      toast({ title: "Incorrect PIN", variant: "destructive" });

      if (next >= 3) {
        localStorage.removeItem(PIN_SESSION_STORAGE_KEY);
        localStorage.removeItem("datebetter_pin_enabled");
        toast({
          title: "Too many attempts",
          description: "Please sign in with your password.",
          variant: "destructive",
        });
        onSwitchAccount();
      }
    } finally {
      setLoading(false);
    }
  };

  const displayName = email.split("@")[0];

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/70 to-secondary/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <header className="relative z-10 px-4 pt-safe-top py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
            dateBetter
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 pb-safe-bottom pb-4 max-w-md mx-auto w-full pt-8">
        <div className="bg-[image:var(--gradient-glass)] backdrop-blur-xl rounded-3xl p-6 shadow-[var(--shadow-elegant)] border border-border/30">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[image:var(--gradient-hero)] mb-4 shadow-[var(--shadow-glow)]">
              <KeyRound className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-1 text-foreground">Welcome Back</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm">{displayName}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-center text-sm text-muted-foreground mb-4">Enter your 4-digit PIN</p>
              <PinInput value={pin} onChange={setPin} disabled={loading} />
            </div>

            {attempts > 0 && (
              <p className="text-center text-xs text-destructive">
                {3 - attempts} attempt{3 - attempts !== 1 ? "s" : ""} remaining
              </p>
            )}

            {loading && (
              <div className="flex justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <Button variant="ghost" className="w-full" onClick={onSwitchAccount}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Use password instead
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
