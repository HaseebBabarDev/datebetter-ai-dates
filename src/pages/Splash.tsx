import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Brain, Lock } from "lucide-react";

const Splash = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cityIndex, setCityIndex] = useState(0);
  
  const cities = ["Paris", "New York", "London", "Tokyo"];

  useEffect(() => {
    const cityInterval = setInterval(() => {
      setCityIndex((prev) => (prev + 1) % cities.length);
    }, 800);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      clearInterval(cityInterval);
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary-very-light flex flex-col items-center justify-center p-6">
        {/* Animated city illustration placeholder */}
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-8 animate-pulse-soft">
          <Heart className="w-20 h-20 text-primary-foreground" />
        </div>
        
        {/* City name */}
        <p className="text-muted-foreground mb-4 h-6">
          {cities[cityIndex]}
        </p>
        
        {/* Logo */}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          dateBetter
        </h1>
        
        {/* Tagline */}
        <p className="text-muted-foreground text-lg">
          Data-driven dating decisions
        </p>
        
        {/* Loading dots */}
        <div className="flex gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "200ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary-very-light flex flex-col">
      {/* Header */}
      <header className="px-6 py-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          dateBetter
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          We put the data in dating
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-lg mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-glow">
            <Heart className="w-16 h-16 text-primary-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            AI-backed app helping women select better partners
          </h2>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-10">
          <FeatureItem icon={Brain} text="AI scores every candidate for you" />
          <FeatureItem icon={Shield} text="Cycle-aware dating guidance" />
          <FeatureItem icon={Lock} text="Your privacy is completely protected" />
          <FeatureItem icon={Heart} text="Learning algorithms that improve with each interaction" />
          <FeatureItem icon={Shield} text="Built for women, by women" />
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate("/auth")}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
          size="lg"
        >
          Get Started
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </main>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ElementType; text: string }> = ({
  icon: Icon,
  text,
}) => (
  <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50">
    <div className="w-10 h-10 rounded-lg bg-primary-very-light flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <span className="text-foreground">{text}</span>
  </div>
);

export default Splash;
