import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Lock, Sparkles, Heart, Stars } from "lucide-react";
import logo from "@/assets/logo.jpg";

const Splash = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/85" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-8">
        {/* Logo */}
        <div className="relative mb-4">
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-primary/30 blur-xl animate-pulse" />
          <img 
            src={logo} 
            alt="dateBetter logo" 
            className="relative w-24 h-24 rounded-full shadow-xl ring-2 ring-primary/40 ring-offset-2 ring-offset-background/50 object-cover"
          />
        </div>

        {/* Logo Text */}
        <div className="text-center mb-4">
          <h1 className="font-poppins text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2 tracking-tight">
            dateBetter
          </h1>
          <p className="font-poppins text-lg md:text-xl text-foreground font-medium tracking-wide drop-shadow-md">
            Data for Dating
          </p>
        </div>

        {/* Tagline */}
        <p className="font-poppins text-center text-foreground text-sm md:text-base mb-2 max-w-sm font-medium drop-shadow-md">
          AI-backed app helping women select better partners
        </p>
        
        {/* D.E.V.I. Badge */}
        <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-background/80 backdrop-blur-sm border border-primary/30 mb-6">
          <Stars className="w-3 h-3 md:w-4 md:h-4 text-primary" />
          <span className="text-xs md:text-sm font-medium text-foreground">D.E.V.I.</span>
          <span className="text-[10px] md:text-xs text-foreground/70">Dating Evaluation & Vetting Intelligence</span>
        </div>

        {/* Features */}
        <div className="w-full max-w-sm space-y-2 mb-8">
          <FeatureItem icon={Stars} text="Our AI scores every candidate for you" />
          <FeatureItem icon={Moon} text="Cycle-aware dating guidance" />
          <FeatureItem icon={Lock} text="Your privacy is completely protected" />
          <FeatureItem icon={Stars} text="AI detects red flags & patterns automatically" />
          <FeatureItem icon={Heart} text="Built for women, by women" />
        </div>

        {/* Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <Button
            onClick={() => navigate("/onboarding")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-poppins font-medium"
            size="lg"
          >
            Create Account
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full border-primary/50 text-foreground hover:bg-primary/10 font-poppins font-medium"
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
  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-card/40 backdrop-blur-sm border border-border/20">
    <Icon className="w-4 h-4 text-primary shrink-0" />
    <span className="font-inter text-foreground/90 text-sm font-light">{text}</span>
  </div>
);

export default Splash;