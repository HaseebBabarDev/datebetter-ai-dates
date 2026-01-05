import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinInput } from "./PinInput";
import { KeyRound, User, ArrowLeft, Heart, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import authBg from "@/assets/auth-bg.jpg";

interface PinLoginScreenProps {
  email: string;
  onSuccess: () => void;
  onSwitchAccount: () => void;
  onNeedPassword?: () => void;
}

// Hash function for PIN verification (must match PinManagement)
const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "datebetter_pin_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const PinLoginScreen: React.FC<PinLoginScreenProps> = ({
  email,
  onSuccess,
  onSwitchAccount,
  onNeedPassword,
}) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      handlePinLogin();
    }
  }, [pin]);

  const handlePinLogin = async (passwordToUse?: string) => {
    if (pin.length !== 4) return;

    setLoading(true);
    try {
      const pinHash = await hashPin(pin);
      
      // Try to sign in with email and use PIN as password verification
      const savedPassword = passwordToUse || sessionStorage.getItem("datebetter_temp_session");
      
      if (!savedPassword) {
        // No cached session, need password
        setNeedsPassword(true);
        setLoading(false);
        return;
      }

      // Sign in with saved credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: savedPassword,
      });

      if (error) {
        if (needsPassword) {
          toast({ 
            title: "Invalid password", 
            variant: "destructive" 
          });
          setPassword("");
        } else {
          setNeedsPassword(true);
        }
        sessionStorage.removeItem("datebetter_temp_session");
        setLoading(false);
        return;
      }

      // Save password for future quick logins
      sessionStorage.setItem("datebetter_temp_session", savedPassword);

      // Now verify PIN
      const { data: pinData, error: pinError } = await supabase
        .from("user_pins")
        .select("pin_hash")
        .eq("user_id", data.user.id)
        .single();

      if (pinError || !pinData) {
        toast({ title: "PIN not found. Please sign in with password.", variant: "destructive" });
        await supabase.auth.signOut();
        onSwitchAccount();
        return;
      }

      if (pinData.pin_hash !== pinHash) {
        await supabase.auth.signOut();
        setAttempts((prev) => prev + 1);
        setPin("");
        
        if (attempts >= 2) {
          toast({ 
            title: "Too many attempts", 
            description: "Please sign in with your password",
            variant: "destructive" 
          });
          sessionStorage.removeItem("datebetter_temp_session");
          localStorage.removeItem("datebetter_pin_enabled");
          onSwitchAccount();
          return;
        }
        
        toast({ title: "Incorrect PIN", variant: "destructive" });
        return;
      }

      // PIN verified successfully
      toast({ title: "Welcome back!" });
      onSuccess();
    } catch (error) {
      console.error("PIN login error:", error);
      toast({ title: "An error occurred", variant: "destructive" });
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      handlePinLogin(password);
    }
  };

  const handleSwitchAccount = () => {
    sessionStorage.removeItem("datebetter_temp_session");
    onSwitchAccount();
  };

  // Get display name from email
  const displayName = email.split("@")[0];

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      {/* Background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/70 to-secondary/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Header */}
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
        {/* Glass card */}
        <div className="bg-[image:var(--gradient-glass)] backdrop-blur-xl rounded-3xl p-6 shadow-[var(--shadow-elegant)] border border-border/30">
          
          {/* Header section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[image:var(--gradient-hero)] mb-4 shadow-[var(--shadow-glow)]">
              <KeyRound className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-1 text-foreground">
              Welcome Back
            </h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm">{displayName}</span>
            </div>
          </div>

          <div className="space-y-6">
            {!needsPassword ? (
              <>
                <div className="space-y-2">
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    Enter your 4-digit PIN
                  </p>
                  <PinInput 
                    value={pin} 
                    onChange={setPin} 
                    disabled={loading}
                  />
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
              </>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  Enter your password to verify
                </p>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl bg-background/50 border-border/50"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[image:var(--gradient-hero)]"
                  disabled={loading || !password}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleSwitchAccount}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Use password instead
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
