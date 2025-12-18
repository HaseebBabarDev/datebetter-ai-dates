import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Lock, Sparkles, Heart, Stars, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.jpg";

const Splash = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/splash-video.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/90" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
      
      {/* Decorative elements - hidden on mobile */}
      <div className="hidden sm:block absolute top-1/4 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="hidden sm:block absolute bottom-1/3 -left-20 w-48 h-48 rounded-full bg-secondary/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-5 py-6 pt-safe-top pb-safe-bottom">
        {/* Logo */}
        <div className="relative mb-5">
          <div className="absolute inset-0 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[image:var(--gradient-hero)] blur-2xl opacity-60 animate-pulse" />
          <img 
            src={logo} 
            alt="dateBetter logo" 
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shadow-[var(--shadow-elegant)] ring-2 ring-primary/30 ring-offset-4 ring-offset-background/50 object-cover"
          />
        </div>

        {/* Logo Text */}
        <div className="text-center mb-2">
          <h1 className="font-poppins text-4xl sm:text-5xl md:text-7xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent mb-1 tracking-tight">
            dateBetter
          </h1>
          <p className="font-poppins text-base sm:text-lg md:text-xl text-foreground font-medium tracking-wide drop-shadow-md">
            Data for Dating
          </p>
        </div>

        {/* Tagline */}
        <p className="font-poppins text-center text-foreground/90 text-sm mb-3 max-w-xs sm:max-w-sm font-medium drop-shadow-md">
          AI-backed app helping women select better partners
        </p>
        
        {/* D.E.V.I. Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[image:var(--gradient-glass)] backdrop-blur-md border border-primary/30 mb-5 shadow-[var(--shadow-soft)]">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <span className="text-xs sm:text-sm font-semibold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">D.E.V.I.</span>
          <span className="text-[10px] sm:text-xs text-foreground/70">Dating Evaluation & Vetting Intelligence</span>
        </div>

        {/* Features */}
        <div className="w-full max-w-xs sm:max-w-sm space-y-2 mb-6">
          <FeatureItem icon={Stars} text="Our AI scores every candidate for you" />
          <FeatureItem icon={Moon} text="Cycle-aware dating guidance" />
          <FeatureItem icon={Lock} text="Your privacy is completely protected" />
          <FeatureItem icon={Sparkles} text="AI detects red flags & patterns automatically" />
          <FeatureItem icon={Heart} text="Built for women, by women" />
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
            className="w-full border-primary/30 text-foreground hover:bg-primary/10 font-poppins font-medium backdrop-blur-sm h-12"
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
  <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 hover:border-primary/30 transition-all duration-300">
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
    </div>
    <span className="font-inter text-foreground/90 text-xs sm:text-sm">{text}</span>
  </div>
);

export default Splash;
