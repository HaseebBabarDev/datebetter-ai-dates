import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Shield, 
  Users, 
  BarChart3,
  MessageSquare,
  Heart,
  Brain,
  Gift,
  ScrollText,
  ClipboardList,
  LogOut,
  Loader2,
  DollarSign,
  Activity,
  TrendingUp,
  Calendar,
  Calculator,
  Presentation
} from "lucide-react";
import { RevenueAnalytics } from "@/components/admin/RevenueAnalytics";
import { AICostAnalytics } from "@/components/admin/AICostAnalytics";
import { CACCalculator } from "@/components/admin/CACCalculator";
import { PricingModelCalculator } from "@/components/admin/PricingModelCalculator";
import { CalculatorPasswordGate } from "@/components/admin/CalculatorPasswordGate";
import { AIUsageAnalytics } from "@/components/admin/AIUsageAnalytics";
import { WTPSurveyAnalytics } from "@/components/admin/WTPSurveyAnalytics";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { AdminCommunitySection } from "@/components/admin/AdminCommunitySection";
import { AdminCandidatesSection } from "@/components/admin/AdminCandidatesSection";
import { AdminReferralsSection } from "@/components/admin/AdminReferralsSection";
import { AdminAgreementsSection } from "@/components/admin/AdminAgreementsSection";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminMessaging } from "@/components/admin/AdminMessaging";
import { PitchDeckAnalytics } from "@/components/admin/PitchDeckAnalytics";
import { AdminConversionSection } from "@/components/admin/AdminConversionSection";

const AdminDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Get active tab from URL or default to overview
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab") || "overview";

  const setActiveTab = (tab: string) => {
    navigate(`/admin/dashboard?tab=${tab}`, { replace: true });
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    setCheckingAdmin(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have admin privileges to access this portal.
              </p>
            </div>
            <Button onClick={() => navigate("/admin/login")} className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Return to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">dateBetter Admin</h1>
                <p className="text-xs text-muted-foreground">Management Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-primary/10 text-primary hidden sm:flex">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-13 h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">

              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Conversion</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">AI Usage</span>
            </TabsTrigger>
            <TabsTrigger value="ai-costs" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">AI Costs</span>
            </TabsTrigger>
            <TabsTrigger value="calculators" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Calculators</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Candidates</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="legal" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <ScrollText className="w-4 h-4" />
              <span className="hidden sm:inline">Legal</span>
            </TabsTrigger>
            <TabsTrigger value="pitch-deck" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
              <Presentation className="w-4 h-4" />
              <span className="hidden sm:inline">Pitch Deck</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUserManagement />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <AdminMessaging />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueAnalytics />
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <AdminConversionSection />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AIUsageAnalytics />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Willingness to Pay Survey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WTPSurveyAnalytics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-costs" className="space-y-6">
            <AICostAnalytics />
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <AdminCommunitySection />
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            <AdminCandidatesSection />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <AdminReferralsSection />
          </TabsContent>

          <TabsContent value="legal" className="space-y-6">
            <AdminAgreementsSection />
          </TabsContent>

          <TabsContent value="calculators" className="space-y-6">
            <CalculatorPasswordGate>
              <div className="space-y-10">
                <CACCalculator />
                <div className="border-t border-border pt-8">
                  <PricingModelCalculator />
                </div>
              </div>
            </CalculatorPasswordGate>
          </TabsContent>

          <TabsContent value="pitch-deck" className="space-y-6">
            <PitchDeckAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
