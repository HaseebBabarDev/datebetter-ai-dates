import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Sparkles, ArrowRight, Brain } from "lucide-react";

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

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      {/* Video Background - optimized for fast loading */}
      <video
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        x-webkit-airplay="deny"
        webkit-playsinline="true"
        preload="metadata"
        poster="/videos/splash-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ objectFit: 'cover' }}
      >
        <source src="/videos/splash-video.mp4" type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
      </video>
      
      {/* Fallback background image if video fails */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center -z-10"
        style={{ backgroundImage: `url('/videos/splash-poster.jpg')` }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/90" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
      
      {/* Decorative elements - hidden on mobile */}
      <div className="hidden sm:block absolute top-1/4 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="hidden sm:block absolute bottom-1/3 -left-20 w-48 h-48 rounded-full bg-secondary/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-5 py-6 pt-safe-top pb-safe-bottom">
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

        {/* Features */}
        <div className="w-full max-w-xs sm:max-w-sm space-y-2 mb-5">
          <FeatureItem icon={Sparkles} text="AI scores candidates & detects red flags" />
          <FeatureItem icon={Brain} text="Help me rewire my dating thoughts" />
          <FeatureItem icon={MessageCircle} text="Chat with D.E.V.I. for personalized advice" />
          <FeatureItem icon={Users} text="Join a private community" />
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
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full border-white/50 bg-black/30 text-white hover:bg-white/20 font-poppins font-semibold backdrop-blur-sm h-12 drop-shadow-md"
            size="lg"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 hover:border-primary/30 transition-all duration-300">
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
    </div>
    <span className="font-inter text-white font-semibold text-xs sm:text-sm drop-shadow-md">{text}</span>
  </div>
);

export default Splash;
