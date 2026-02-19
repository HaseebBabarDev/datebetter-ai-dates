import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const SESSION_KEY = "admin_calc_unlocked";

interface Props {
  children: React.ReactNode;
}

export const CalculatorPasswordGate = ({ children }: Props) => {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Persist unlock for the browser session only
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-calculator-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setUnlocked(true);
        toast.success("Access granted");
      } else {
        toast.error("Incorrect password");
        setPassword("");
      }
    } catch {
      toast.error("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-lg">Restricted Access</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Enter the calculator password to continue
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="calc-pw" className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  id="calc-pw"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !password}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              {loading ? "Verifying…" : "Unlock Calculators"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
