import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import authBg from "@/assets/auth-bg.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const getPasswordStrength = () => {
    if (password.length === 0) return { strength: 0, label: "" };
    let strength = 0;
    if (password.length >= 12) strength += 25;
    else if (password.length >= 8) strength += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
    
    const label = strength < 50 ? "Weak" : strength < 75 ? "Medium" : "Strong";
    return { strength, label };
  };

  const { strength, label } = getPasswordStrength();

  const checkOnboardingStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, onboarding_step")
      .eq("user_id", userId)
      .single();
    
    return profile;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      if (password !== confirmPassword) {
        toast({ title: "Passwords don't match", variant: "destructive" });
        return;
      }
      if (!termsAccepted || !privacyAccepted) {
        toast({ title: "Please accept terms and privacy policy", variant: "destructive" });
        return;
      }
      if (strength < 50) {
        toast({ title: "Password is too weak", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    
    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);
      
      if (error) {
        toast({ 
          title: error.message.includes("already registered") 
            ? "Account already exists. Please sign in."
            : error.message,
          variant: "destructive" 
        });
      } else {
        toast({ title: isSignUp ? "Account created! Welcome to dateBetter" : "Welcome back!" });
        
        // Check onboarding status for returning users
        if (!isSignUp) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const profile = await checkOnboardingStatus(user.id);
            if (profile?.onboarding_completed) {
              navigate("/dashboard");
              return;
            }
          }
        }
        navigate("/setup");
      }
    } catch (error) {
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="bg-background/50 backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          dateBetter
        </h1>
      </header>

      <main className="relative z-10 container max-w-md mx-auto px-6 py-8">
        <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {isSignUp ? "Create Your Account" : "Welcome Back"}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp 
                ? "Start your journey to better dating" 
                : "Sign in to continue your journey"}
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {isSignUp ? "Create strong password" : "Password"}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {isSignUp && password.length > 0 && (
              <>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      strength < 50 ? "bg-destructive" : strength < 75 ? "bg-caution-foreground" : "bg-success"
                    }`}
                    style={{ width: `${strength}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Password strength: <span className="font-medium">{label}</span>
                </p>
              </>
            )}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords don't match</p>
              )}
            </div>
          )}

          {/* Checkboxes (Sign Up only) */}
          {isSignUp && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I accept the <span className="text-primary hover:underline">Terms of Service</span>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                />
                <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                  I accept the <span className="text-primary hover:underline">Privacy Policy</span>
                </Label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
            disabled={loading}
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        {/* Toggle Sign In/Up */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
