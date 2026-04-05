import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Sparkles, Heart, Shield, CheckCircle2, Bot, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import authBg from "@/assets/auth-bg.jpg";
import { BetaNdaDialog } from "@/components/auth/BetaNdaDialog";
import { BetaWelcomeDialog } from "@/components/auth/BetaWelcomeDialog";
import { useNdaAgreement } from "@/hooks/useNdaAgreement";
import { useBetaWelcome } from "@/hooks/useBetaWelcome";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setupMode = searchParams.get("setup");
  const referralCode = searchParams.get("ref");
  const { signIn, signUp, user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup" || !!referralCode);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  // Beta NDA state
  const { hasAcceptedNda, acceptNda, loading: ndaLoading } = useNdaAgreement();
  const { hasSeenWelcome, markWelcomeSeen, loading: welcomeLoading } = useBetaWelcome();
  const [showBetaNda, setShowBetaNda] = useState(false);
  const [showBetaWelcome, setShowBetaWelcome] = useState(false);

  // Check for Beta NDA and Welcome acceptance on mount
  useEffect(() => {
    if (!ndaLoading && !welcomeLoading) {
      if (hasAcceptedNda === false) {
        setShowBetaNda(true);
      } else if (hasAcceptedNda === true && hasSeenWelcome === false) {
        setShowBetaWelcome(true);
      }
    }
  }, [ndaLoading, welcomeLoading, hasAcceptedNda, hasSeenWelcome]);

  const getPasswordStrength = () => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 12) strength += 25;
    else if (password.length >= 8) strength += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
    
    const label = strength < 50 ? "Weak" : strength < 75 ? "Good" : "Strong";
    const color = strength < 50 ? "bg-destructive" : strength < 75 ? "bg-caution" : "bg-success";
    return { strength, label, color };
  };

  const { strength, label, color } = getPasswordStrength();

  const checkOnboardingStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, onboarding_step")
      .eq("user_id", userId)
      .single();
    
    return profile;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({ title: "Please enter your email address", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) {
        toast({ title: error.message, variant: "destructive" });
      } else {
        toast({ 
          title: "Password reset email sent!",
          description: "Check your inbox for the reset link."
        });
        setIsForgotPassword(false);
      }
    } catch (error) {
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      return handlePasswordReset(e);
    }
    
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
      if (isSignUp) {
        const { error, data } = await signUp(email, password);
        
        if (error) {
          toast({ 
            title: error.message.includes("already registered") 
              ? "Account already exists. Please sign in."
              : error.message,
            variant: "destructive" 
          });
        } else {
          const hasReferral = !!referralCode;
          toast({ 
            title: hasReferral 
              ? "Account created! You got 30 days free 🎉" 
              : "Account created! Welcome to dateBetter" 
          });
          // Handle referral
          if (referralCode && data?.user) {
            const referrerIdPrefix = referralCode.replace("DEVI-", "").toLowerCase();
            const { data: referrers } = await supabase
              .from("profiles")
              .select("user_id")
              .ilike("user_id", `${referrerIdPrefix}%`)
              .limit(1);
            
            if (referrers && referrers.length > 0) {
              // Record referral as converted
              await supabase.from("referrals").insert({
                referrer_id: referrers[0].user_id,
                referred_id: data.user.id,
                referral_code: referralCode,
                status: "converted",
                converted_at: new Date().toISOString()
              });
              
              // Grant 30-day free trial to the referred user
              const trialEnd = new Date();
              trialEnd.setDate(trialEnd.getDate() + 30);
              
              // Small delay to ensure the trigger has created the subscription row
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const { error: trialError } = await supabase
                .from("user_subscriptions")
                .update({ trial_ends_at: trialEnd.toISOString() })
                .eq("user_id", data.user.id);
              
              // If update failed (row not yet created), try upsert
              if (trialError) {
                await supabase.from("user_subscriptions").upsert({
                  user_id: data.user.id,
                  plan: "free",
                  candidates_limit: 1,
                  updates_per_candidate: 5,
                  trial_ends_at: trialEnd.toISOString(),
                }, { onConflict: "user_id" });
              }
              
              await supabase.functions.invoke("notify-referrer", {
                body: { 
                  referrerId: referrers[0].user_id, 
                  referredId: data.user.id 
                }
              });
            }
          }
          
          if (setupMode === "quick") {
            // Quick setup: save name + goal to profile, then go straight to D.E.V.I.
            const quickName = localStorage.getItem("onboarding_name") || "";
            const quickGoal = localStorage.getItem("onboarding_goal") || "";
            
            if (data?.user) {
              await supabase.from("profiles").update({
                name: quickName || null,
                dating_motivation: quickGoal ? [quickGoal] : null,
                onboarding_completed: true,
                onboarding_step: 0,
              }).eq("user_id", data.user.id);
            }
            
            navigate("/devi?firstTime=true");
          } else {
            const setupQuery = setupMode ? `?setup=${encodeURIComponent(setupMode)}` : "";
            navigate(`/setup${setupQuery}`);
          }
        }
      } else {
        // Sign in flow
        const { error } = await signIn(email, password);
        
        if (error) {
          toast({ 
            title: error.message,
            variant: "destructive" 
          });
        } else {
          toast({ title: "Welcome back!" });
          
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const profile = await checkOnboardingStatus(currentUser.id);
            if (profile?.onboarding_completed) {
              navigate("/dashboard");
              return;
            }
            
            if (setupMode === "quick") {
              navigate("/devi?firstTime=true");
            } else {
              const setupQuery = setupMode ? `?setup=${encodeURIComponent(setupMode)}` : "";
              navigate(`/setup${setupQuery}`);
            }
          }
        }
      }
    } catch (error) {
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = isSignUp 
    ? email && password && confirmPassword && password === confirmPassword && termsAccepted && privacyAccepted && strength >= 50
    : email && password;

  return (
    <>
    <div className="fixed inset-0 overflow-hidden">
      {/* Background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/70 to-secondary/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Decorative elements - hidden on small screens */}
      <div className="hidden sm:block absolute top-20 right-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />
      <div className="hidden sm:block absolute bottom-40 left-10 w-40 h-40 rounded-full bg-secondary/10 blur-3xl" />

      {/* Scrollable content container */}
      <div className="absolute inset-0 overflow-y-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)', paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
        {/* Header */}
        <header className="relative z-10 px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")} 
            className="bg-background/60 backdrop-blur-md border border-border/50 hover:bg-background/80 rounded-xl h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              dateBetter
            </span>
          </div>
        </header>

        <main className="relative z-10 flex-1 px-4 pb-24 max-w-md mx-auto w-full">
          {/* Glass card */}
          <div className="bg-[image:var(--gradient-glass)] backdrop-blur-xl rounded-3xl p-6 shadow-[var(--shadow-elegant)] border border-border/30">
            
            {/* Header section */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[image:var(--gradient-hero)] mb-4 shadow-[var(--shadow-glow)]">
                {isForgotPassword ? (
                  <Mail className="w-7 h-7 text-primary-foreground" />
                ) : isSignUp ? (
                  <Sparkles className="w-7 h-7 text-primary-foreground" />
                ) : (
                  <Heart className="w-7 h-7 text-primary-foreground" />
                )}
              </div>
              <h2 className="text-2xl font-bold mb-1 text-foreground">
                {isForgotPassword ? "Reset Password" : isSignUp ? "Join dateBetter" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isForgotPassword
                  ? "We'll send you a reset link"
                  : isSignUp 
                    ? "Your journey to better dating starts here" 
                    : "Sign in to continue your journey"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              {!isForgotPassword && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      {isSignUp ? "Create Password" : "Password"}
                    </Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password strength indicator */}
                  {isSignUp && password.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div 
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              strength >= i * 25 ? color : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>Password strength: <span className="font-medium text-foreground">{label}</span></span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password */}
              {isSignUp && !isForgotPassword && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
                      required
                    />
                    {confirmPassword && password === confirmPassword && (
                      <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                    )}
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      Passwords don't match
                    </p>
                  )}
                </div>
              )}

              {/* Terms & Privacy - Modern toggle style */}
              {isSignUp && !isForgotPassword && (
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 text-left ${
                      termsAccepted 
                        ? "border-primary bg-primary/5" 
                        : "border-border/50 bg-background/30 hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      termsAccepted 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted border border-border"
                    }`}>
                      {termsAccepted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm">
                      I agree to the{" "}
                      <span 
                        className="text-primary font-medium hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/terms");
                        }}
                      >
                        Terms of Service
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacyAccepted(!privacyAccepted)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 text-left ${
                      privacyAccepted 
                        ? "border-primary bg-primary/5" 
                        : "border-border/50 bg-background/30 hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      privacyAccepted 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted border border-border"
                    }`}>
                      {privacyAccepted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm">
                      I agree to the{" "}
                      <span 
                        className="text-primary font-medium hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/privacy-policy");
                        }}
                      >
                        Privacy Policy
                      </span>
                    </span>
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-[image:var(--gradient-hero)] hover:opacity-90 transition-all duration-300 shadow-[var(--shadow-soft)] text-base font-semibold mt-4"
                disabled={loading || (isSignUp && !canSubmit)}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Please wait...
                  </span>
                ) : isForgotPassword ? (
                  "Send Reset Link"
                ) : isSignUp ? (
                  <span className="flex items-center gap-2">
                    Create Account
                    <Sparkles className="w-4 h-4" />
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>

            </form>

            {/* Divider */}
            {!isForgotPassword && (
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
            )}

            {/* Apple Sign In */}
            {!isForgotPassword && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 border-0 text-base font-semibold gap-2"
                disabled={appleLoading}
                onClick={async () => {
                  setAppleLoading(true);
                  try {
                    const { error } = await lovable.auth.signInWithOAuth("apple", {
                      redirect_uri: window.location.origin,
                    });
                    if (error) {
                      toast({ title: error.message || "Apple sign in failed", variant: "destructive" });
                    }
                  } catch (err) {
                    toast({ title: "Apple sign in failed", variant: "destructive" });
                  } finally {
                    setAppleLoading(false);
                  }
                }}
              >
                {appleLoading ? (
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Apple className="w-5 h-5" />
                )}
                Sign in with Apple
              </Button>
            )}

            {/* Toggle Sign In/Up */}
            <div className="mt-6 pt-4 border-t border-border/30">
              {!isForgotPassword ? (
                <p className="text-center text-sm text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "New to dateBetter?"}{" "}
                  <button
                    type="button"
                    className="text-primary font-semibold hover:text-primary/80 transition-colors"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? "Sign in" : "Create account"}
                  </button>
                </p>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <button
                    type="button"
                    className="text-primary font-semibold hover:text-primary/80 transition-colors"
                    onClick={() => setIsForgotPassword(false)}
                  >
                    Back to sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </main>

        {/* Security and AI badges - fixed at bottom for App Store compliance */}
        <div className="fixed bottom-0 left-0 right-0 z-20 pb-safe-bottom bg-gradient-to-t from-background via-background/95 to-transparent pt-4 pb-3">
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground max-w-md mx-auto px-4">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-xs">Your data is encrypted & secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5" />
              <span className="text-xs">AI-powered features for personalized insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <BetaNdaDialog
      open={showBetaNda}
      onAccept={async () => {
        await acceptNda();
        setShowBetaNda(false);
        setShowBetaWelcome(true);
      }}
    />
    
    <BetaWelcomeDialog
      open={showBetaWelcome}
      onContinue={async () => {
        await markWelcomeSeen();
        setShowBetaWelcome(false);
      }}
    />
    </>
  );
};

export default Auth;
