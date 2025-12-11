import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TourProvider, TourOverlay } from "@/components/tour";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useState, useEffect } from "react";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import CandidateDetail from "./pages/CandidateDetail";
import Patterns from "./pages/Patterns";
import AddCandidate from "./pages/AddCandidate";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Devi from "./pages/Devi";
import Admin from "./pages/Admin";
import TestSetup from "./pages/TestSetup";
import Subscription from "./pages/Subscription";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Support from "./pages/Support";
import Offline from "./pages/Offline";
import ErrorPage from "./pages/Error";
import ClearData from "./pages/ClearData";
import AppVersion from "./pages/AppVersion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const isOnline = useOnlineStatus();
  const [showLoading, setShowLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Check if this is the first load in this session
    const hasLoaded = sessionStorage.getItem("app_loaded");
    if (hasLoaded) {
      setShowLoading(false);
      setAppReady(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    sessionStorage.setItem("app_loaded", "true");
    setShowLoading(false);
    setAppReady(true);
  };

  if (!isOnline) {
    return <Offline />;
  }

  return (
    <>
      {showLoading && <LoadingScreen minDuration={1800} onComplete={handleLoadingComplete} />}
      {appReady && (
        <>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/candidate/:id" element={<CandidateDetail />} />
            <Route path="/patterns" element={<Patterns />} />
            <Route path="/add-candidate" element={<AddCandidate />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/devi" element={<Devi />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/test-setup" element={<TestSetup />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/support" element={<Support />} />
            <Route path="/offline" element={<Offline />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/clear-data" element={<ClearData />} />
            <Route path="/app-version" element={<AppVersion />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNavigation />
        </>
      )}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TourProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <TourOverlay />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </TourProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
