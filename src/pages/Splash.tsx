import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Sparkles, ArrowRight, Brain, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ModernLogo = () => (
  <div className="relative w-24 h-24 sm:w-28 sm:h-28">
    {/* Glow effect */}
    <div className="absolute inset-0 rounded-3xl bg-[image:var(--gradient-hero)] blur-2xl opacity-50 animate-pulse" />

    {/* Main logo container */}
    <div className="relative w-full h-full rounded-3xl bg-[image:var(--gradient-hero)] shadow-[var(--shadow-elegant)] flex items-center justify-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white/40" />
        <div className="absolute top-4 right-3 w-2 h-2 rounded-full bg-white/30" />
        <div className="absolute bottom-3 left-4 w-2 h-2 rounded-full bg-white/30" />
        <div className="absolute bottom-5 right-2 w-1.5 h-1.5 rounded-full bg-white/40" />
      </div>

      {/* Heart with chart line */}
      <svg viewBox="0 0 64 64" className="w-14 h-14 sm:w-16 sm:h-16 relative z-10">
        {/* Heart shape */}
        <path
          d="M32 56 C16 44 8 34 8 24 C8 16 14 10 22 10 C26 10 30 12 32 16 C34 12 38 10 42 10 C50 10 56 16 56 24 C56 34 48 44 32 56Z"
          fill="white"
          fillOpacity="0.95"
        />
        {/* Data line through heart */}
        <path
          d="M12 32 L22 32 L26 24 L30 38 L34 28 L38 34 L42 30 L52 30"
          stroke="url(#lineGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(340, 75%, 55%)" />
            <stop offset="50%" stopColor="hsl(320, 70%, 58%)" />
            <stop offset="100%" stopColor="hsl(280, 60%, 60%)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

const Splash = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        }
      });
      if (error) {
        toast({ title: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Redirect logged-in users to dashboard or setup
  React.useEffect(() => {
    const checkUserStatus = async () => {
      if (authLoading || !user) return;
      
      setCheckingOnboarding(true);
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile?.onboarding_completed) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/setup", { replace: true });
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // If there's an error, let user stay on splash and try logging in again
        setCheckingOnboarding(false);
      }
    };

    checkUserStatus();
  }, [user, authLoading, navigate]);

  // Attempt video autoplay on mount and user interaction
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const attemptPlay = () => {
      video.play().catch(() => {
        // Silently fail - poster image is visible as fallback
      });
    };

    // Try to play immediately
    attemptPlay();

    // Listen for first user interaction to trigger play (mobile browsers)
    const handleInteraction = () => {
      attemptPlay();
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };

    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction);

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, []);

  // Show loading state while checking auth
  if (authLoading || checkingOnboarding) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        x-webkit-airplay="deny"
        webkit-playsinline="true"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        style={{ objectFit: "cover" }}
      >
        <source
          src="/videos/splash-video.mp4"
          type="video/mp4; codecs=avc1.42E01E,mp4a.40.2"
        />
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/40 via-background/30 to-background/90" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />

      {/* Decorative elements - hidden on mobile */}
      <div className="hidden sm:block absolute top-1/4 -right-20 z-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="hidden sm:block absolute bottom-1/3 -left-20 z-10 w-48 h-48 rounded-full bg-secondary/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-20 min-h-[100dvh] flex flex-col items-center justify-center px-5 py-6 pt-safe-top pb-safe-bottom">
        {/* Modern Logo */}
        <div className="mb-5">
          <ModernLogo />
        </div>

        {/* Logo Text */}
        <div className="text-center mb-2">
          <h1 className="font-poppins text-4xl sm:text-5xl md:text-7xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent mb-1 tracking-tight drop-shadow-lg">
            dateBetter
          </h1>
          <p className="font-poppins text-base sm:text-lg md:text-xl text-white font-semibold tracking-wide drop-shadow-lg">
            Data for Dating
          </p>
        </div>

        {/* Tagline */}
        <p className="font-poppins text-center text-white/90 text-sm mb-3 max-w-xs sm:max-w-sm font-semibold drop-shadow-lg">
          AI-backed app helping you select better partners
        </p>
        
        {/* D.E.V.I. Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/20 mb-5 shadow-[var(--shadow-soft)]">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <span className="text-xs sm:text-sm font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">D.E.V.I.</span>
          <span className="text-[10px] sm:text-xs text-white font-semibold">Dating Evaluation & Vetting Intelligence</span>
        </div>

        {/* Features - Clean list style */}
        <div className="w-full max-w-xs sm:max-w-sm mb-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <FeatureItem icon={Sparkles} text="AI scoring" />
            <FeatureItem icon={Brain} text="Pattern insights" />
            <FeatureItem icon={MessageCircle} text="24/7 AI assistant" />
            <FeatureItem icon={Users} text="Private community" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-center gap-3 mb-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">
          <span className="text-xs text-white font-semibold drop-shadow-md">Female-built</span>
          <span className="w-1 h-1 rounded-full bg-white/60" />
          <span className="text-xs text-white font-semibold drop-shadow-md">100% private</span>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-xs sm:max-w-sm space-y-2.5">
          <Button
            onClick={() => navigate("/onboarding")}
            variant="hero"
            className="w-full font-poppins font-semibold h-12"
            size="lg"
          >
            Create Account
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full border-white/50 bg-white text-gray-700 hover:bg-gray-100 font-poppins font-semibold h-12"
            size="lg"
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>
          
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full border-white/50 bg-black/30 text-white hover:bg-white/20 font-poppins font-semibold backdrop-blur-sm h-12 drop-shadow-md"
            size="lg"
          >
            Login with Email
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-black/50 backdrop-blur-sm">
    <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center shrink-0">
      <Icon className="w-3 h-3 text-primary" />
    </div>
    <span className="text-white text-sm font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{text}</span>
  </div>
);

export default Splash;
