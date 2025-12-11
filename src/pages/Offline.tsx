import React from "react";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";
import logo from "@/assets/logo.jpg";

export default function Offline() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset flex flex-col items-center justify-center px-6 py-8">
      {/* Logo */}
      <img 
        src={logo} 
        alt="dateBetter logo" 
        className="w-20 h-20 rounded-full shadow-lg ring-2 ring-primary/30 object-cover mb-6 opacity-80"
      />

      {/* Icon */}
      <div className="p-4 rounded-full bg-muted mb-4">
        <WifiOff className="w-10 h-10 text-muted-foreground" />
      </div>

      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground mb-2 text-center">
        You're Offline
      </h1>

      {/* Description */}
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-8">
        It looks like you're not connected to the internet. Please check your connection and try again.
      </p>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <Button 
          onClick={handleRetry}
          className="w-full gap-2 min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Some features may work offline. Your data will sync when you're back online.
        </p>
      </div>

      {/* Offline Features */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-xs">
        <h3 className="text-sm font-medium text-foreground mb-2">Available Offline:</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• View cached candidate data</li>
          <li>• Draft interaction notes</li>
          <li>• Access saved insights</li>
        </ul>
      </div>
    </div>
  );
}
