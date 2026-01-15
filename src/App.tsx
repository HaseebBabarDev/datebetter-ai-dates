import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TourProvider, TourOverlay } from "@/components/tour";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import HelpButton from "@/components/HelpButton";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useState, useEffect, lazy, Suspense } from "react";

// Eagerly load critical paths
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Offline from "./pages/Offline";

// Lazy load non-critical routes
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Setup = lazy(() => import("./pages/Setup"));
const CandidateDetail = lazy(() => import("./pages/CandidateDetail"));
const Patterns = lazy(() => import("./pages/Patterns"));
const AddCandidate = lazy(() => import("./pages/AddCandidate"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Devi = lazy(() => import("./pages/Devi"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const TestSetup = lazy(() => import("./pages/TestSetup"));
const Subscription = lazy(() => import("./pages/Subscription"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const Support = lazy(() => import("./pages/Support"));
const ErrorPage = lazy(() => import("./pages/Error"));
const ClearData = lazy(() => import("./pages/ClearData"));
const AppVersion = lazy(() => import("./pages/AppVersion"));
const Community = lazy(() => import("./pages/Community"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Minimal loading fallback for lazy routes
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

function AppContent() {
  const isOnline = useOnlineStatus();
  const [showLoading, setShowLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // Check if current path is an admin route - skip loading screen for admin
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    // Skip loading screen for admin routes or if already loaded
    const hasLoaded = sessionStorage.getItem("app_loaded");
    if (hasLoaded || isAdminRoute) {
      setShowLoading(false);
      setAppReady(true);
    }
  }, [isAdminRoute]);

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
      {showLoading && <LoadingScreen minDuration={800} onComplete={handleLoadingComplete} />}
      {appReady && (
        <Suspense fallback={<RouteLoader />}>
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
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
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
            <Route path="/community" element={<Community />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNavigation />
          <HelpButton />
        </Suspense>
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
            <BrowserRouter>
              <TourOverlay />
              <AppContent />
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </TourProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
