import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import splashImage from "@/assets/splash-couple.jpeg";

const Splash = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Image Background */}
      <img
        src={splashImage}
        alt="Couple walking on beach"
        className="absolute inset-0 w-full h-full object-cover"
      />

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
          <FeatureItem text="AI scores every candidate for you" />
          <FeatureItem text="Cycle-aware dating guidance" />
          <FeatureItem text="Your privacy is completely protected" />
          <FeatureItem text="Learning algorithms that improve with each interaction" />
          <FeatureItem text="Built for women, by women" />
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

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/30">
    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
    <span className="text-foreground/90 text-sm">{text}</span>
  </div>
);

export default Splash;
