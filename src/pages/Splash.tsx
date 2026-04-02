import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Sparkles, ArrowRight, Brain, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logoDb from "@/assets/logo-db.png";

const Splash = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(false);

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
          const defaultScreen = localStorage.getItem("default_start_screen") || "dashboard";
          if (defaultScreen === "devi") {
            navigate("/devi", { replace: true });
          } else if (defaultScreen === "top-candidate") {
            navigate("/dashboard?tab=candidates&sort=score", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
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
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Video background - covers entire viewport including safe areas */}
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
      >
        <source
          src="/videos/splash-video.mp4"
          type="video/mp4; codecs=avc1.42E01E,mp4a.40.2"
        />
      </video>

      {/* Gradient overlays - extend beyond safe areas */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/40 via-background/30 to-background/90" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-emerald-500/10 via-transparent to-transparent" />

      {/* Decorative elements - hidden on mobile */}
    <div className="hidden sm:block absolute top-1/4 -right-20 z-10 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl" />
    <div className="hidden sm:block absolute bottom-1/3 -left-20 z-10 w-48 h-48 rounded-full bg-teal-500/20 blur-3xl" />

      {/* Content - scrollable within safe areas */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-5 py-6 overflow-y-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)', paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}>
        {/* Logo */}
        <div className="mb-5 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white shadow-lg flex items-center justify-center">
          <img src={logoDb} alt="dateBetter" className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-lg object-contain" />
        </div>

        {/* Logo Text */}
        <div className="text-center mb-2">
          <h1 className="font-poppins text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-1 tracking-tight drop-shadow-lg">
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
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/30 backdrop-blur-md border border-emerald-500/30 mb-5 shadow-[var(--shadow-soft)]">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">D.E.V.I.</span>
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
          <span className="text-xs text-white font-semibold drop-shadow-md">100% private</span>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-xs sm:max-w-sm space-y-2.5">
          <Button
            onClick={() => navigate("/onboarding")}
            className="w-full font-poppins font-semibold h-12 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
            size="lg"
          >
            Create Account
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full border-emerald-500/50 bg-black/30 text-white hover:bg-emerald-500/20 font-poppins font-semibold backdrop-blur-sm h-12 drop-shadow-md"
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
    <div className="w-6 h-6 rounded-full bg-emerald-500/40 flex items-center justify-center shrink-0">
      <Icon className="w-3 h-3 text-emerald-400" />
    </div>
    <span className="text-white text-sm font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{text}</span>
  </div>
);

export default Splash;
