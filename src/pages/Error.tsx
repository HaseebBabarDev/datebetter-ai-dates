import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";
import logo from "@/assets/logo.jpg";

interface ErrorPageProps {
  error?: Error;
  resetError?: () => void;
}

export default function ErrorPage({ error, resetError }: ErrorPageProps) {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    navigate("/dashboard");
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
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>

      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground mb-2 text-center">
        Something Went Wrong
      </h1>

      {/* Description */}
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-2">
        We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
      </p>

      {/* Error Details (if available) */}
      {error && (
        <div className="p-3 bg-muted/50 rounded-lg max-w-xs mb-6 w-full">
          <p className="text-xs text-muted-foreground font-mono break-all">
            {error.message || "Unknown error"}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <Button 
          onClick={handleRetry}
          className="w-full gap-2 min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>

        <Button 
          onClick={handleGoHome}
          variant="outline"
          className="w-full gap-2 min-h-[44px]"
        >
          <Home className="w-4 h-4" />
          Go to Home
        </Button>

        <Button 
          onClick={() => navigate("/support")}
          variant="ghost"
          className="w-full gap-2 min-h-[44px]"
        >
          <Mail className="w-4 h-4" />
          Contact Support
        </Button>
      </div>

      {/* Help Text */}
      <p className="mt-6 text-xs text-center text-muted-foreground max-w-xs">
        If this keeps happening, try closing and reopening the app, or reach out to our support team.
      </p>
    </div>
  );
}
