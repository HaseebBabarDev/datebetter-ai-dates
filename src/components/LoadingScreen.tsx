import React, { useEffect, useState } from "react";
import logo from "@/assets/logo-splash.png";

interface LoadingScreenProps {
  minDuration?: number;
  onComplete?: () => void;
}

export function LoadingScreen({ minDuration = 800, onComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    // Faster progress animation
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDuration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 30);

    // Complete after minimum duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, minDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [minDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center safe-area-inset animate-fade-in">
      {/* Logo with pulse animation */}
      <div className="relative mb-8">
        <div className="absolute inset-0 w-28 h-28 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <img 
          src={logo} 
          alt="dateBetter" 
          className="relative w-28 h-28 drop-shadow-lg object-contain"
        />
      </div>

      {/* App Name */}
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
        dateBetter
      </h1>
      <p className="text-sm text-muted-foreground mb-8">Data for Dating</p>

      {/* Progress Bar */}
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-100 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading Text */}
      <p className="text-xs text-muted-foreground mt-4 animate-pulse">
        Loading...
      </p>
    </div>
  );
}
