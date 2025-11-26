import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Shield, Lock, Heart, Sparkles } from "lucide-react";

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
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/90" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-8">
        {/* Logo Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            dateBetter
          </h1>
          <p className="text-lg md:text-xl text-foreground/90 font-medium">
            Data for Dating
          </p>
        </div>

        {/* Tagline */}
        <p className="text-center text-foreground/80 text-sm md:text-base mb-6 max-w-sm">
          AI-backed app helping women select better partners
        </p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-2 mb-8">
          <FeatureItem icon={Brain} text="AI scores every candidate for you" />
          <FeatureItem icon={Shield} text="Cycle-aware dating guidance" />
          <FeatureItem icon={Lock} text="Your privacy is completely protected" />
          <FeatureItem icon={Sparkles} text="Learning algorithms that improve with each interaction" />
          <FeatureItem icon={Heart} text="Built for women, by women" />
        </div>

        {/* Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <Button
            onClick={() => navigate("/auth")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            Create Account
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full border-primary/50 text-foreground hover:bg-primary/10"
            size="lg"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ElementType; text: string }> = ({
  icon: Icon,
  text,
}) => (
  <div className="flex items-center gap-3 p-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/30">
    <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <span className="text-foreground/90 text-sm">{text}</span>
  </div>
);

export default Splash;
