import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Mail, Trash2 } from "lucide-react";
import logo from "@/assets/logo.jpg";

interface ErrorPageProps {
  error?: Error;
  resetError?: () => void;
}

export default function ErrorPage({ error, resetError }: ErrorPageProps) {
  const isModuleError = error?.message?.toLowerCase().includes("module") || 
                        error?.message?.toLowerCase().includes("import") ||
                        error?.message?.toLowerCase().includes("chunk") ||
                        error?.message?.toLowerCase().includes("failed to fetch");

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleClearCacheAndReload = async () => {
    try {
      // Unregister all service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
      // Clear caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Hard reload
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  const handleSupport = () => {
    window.location.href = "/support";
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset flex flex-col items-center justify-center px-6 py-8">
      <img 
        src={logo} 
        alt="dateBetter logo" 
        className="w-20 h-20 rounded-full shadow-lg ring-2 ring-primary/30 object-cover mb-6 opacity-80"
      />

      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>

      <h1 className="text-xl font-semibold text-foreground mb-2 text-center">
        {isModuleError ? "App Update Available" : "Something Went Wrong"}
      </h1>

      <p className="text-sm text-muted-foreground text-center max-w-xs mb-2">
        {isModuleError 
          ? "A new version of dateBetter is available. Clear your cache to get the latest update."
          : "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists."}
      </p>

      {error && !isModuleError && (
        <div className="p-3 bg-muted/50 rounded-lg max-w-xs mb-6 w-full">
          <p className="text-xs text-muted-foreground font-mono break-all">
            {error.message || "Unknown error"}
          </p>
        </div>
      )}

      <div className="w-full max-w-xs space-y-3 mt-4">
        {isModuleError ? (
          <Button 
            onClick={handleClearCacheAndReload}
            className="w-full gap-2 min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache & Reload
          </Button>
        ) : (
          <Button 
            onClick={handleRetry}
            className="w-full gap-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}

        <Button 
          onClick={handleGoHome}
          variant="outline"
          className="w-full gap-2 min-h-[44px]"
        >
          <Home className="w-4 h-4" />
          Go to Home
        </Button>

        <Button 
          onClick={handleSupport}
          variant="ghost"
          className="w-full gap-2 min-h-[44px]"
        >
          <Mail className="w-4 h-4" />
          Contact Support
        </Button>
      </div>

      <p className="mt-6 text-xs text-center text-muted-foreground max-w-xs">
        {isModuleError
          ? "This happens after app updates. Clearing the cache will fix it instantly."
          : "If this keeps happening, try closing and reopening the app, or reach out to our support team."}
      </p>
    </div>
  );
}
