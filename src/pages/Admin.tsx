import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Shield, 
  Key, 
  Loader2, 
  ArrowLeft, 
  Users, 
  UserCog,
  Home,
  UserPlus,
  Trash2,
  Calendar,
  MessageSquareOff,
  Gift,
  CheckCircle2,
  ScrollText,
  ClipboardList
} from "lucide-react";
import { RevenueAnalytics } from "@/components/admin/RevenueAnalytics";
import { AIUsageAnalytics } from "@/components/admin/AIUsageAnalytics";
import { WTPSurveyAnalytics } from "@/components/admin/WTPSurveyAnalytics";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState<string | null>(null);
  const [removingFromCommunity, setRemovingFromCommunity] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [grantingTrial, setGrantingTrial] = useState<string | null>(null);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const fetchReferrals = async () => {
    setLoadingReferrals(true);
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profiles for referrers and referred users
      const userIds = new Set<string>();
      data?.forEach(r => {
        userIds.add(r.referrer_id);
        if (r.referred_id) userIds.add(r.referred_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", Array.from(userIds));

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      const enrichedReferrals = data?.map(r => ({
        ...r,
        referrer_name: profilesMap.get(r.referrer_id) || "Unknown",
        referred_name: r.referred_id ? profilesMap.get(r.referred_id) || "Unknown" : null
      })) || [];

      setReferrals(enrichedReferrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("Failed to load referrals");
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleGrantReferralTrial = async (referralId: string, referrerId: string) => {
    setGrantingTrial(referralId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      // Grant 30-day trial to referrer
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ targetUserId: referrerId, trialDays: 30 }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to grant trial");
      }

      // Mark referral as trial granted
      await supabase
        .from("referrals")
        .update({ trial_granted: true })
        .eq("id", referralId);

      toast.success("1 month free trial granted to referrer!");
      fetchReferrals();
      fetchAllUsers();
    } catch (error) {
      console.error("Error granting trial:", error);
      toast.error(error instanceof Error ? error.message : "Failed to grant trial");
    } finally {
      setGrantingTrial(null);
    }
  };

  const fetchAgreements = async () => {
    setLoadingAgreements(true);
    try {
      const { data, error } = await supabase
        .from("user_agreements")
        .select("*")
        .order("accepted_at", { ascending: false });

      if (error) throw error;

      // Get profiles for users
      const userIds = new Set<string>();
      data?.forEach(a => userIds.add(a.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", Array.from(userIds));

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      const enrichedAgreements = data?.map(a => ({
        ...a,
        user_name: profilesMap.get(a.user_id) || "Unknown"
      })) || [];

      setAgreements(enrichedAgreements);
    } catch (error) {
      console.error("Error fetching agreements:", error);
      toast.error("Failed to load agreements");
    } finally {
      setLoadingAgreements(false);
    }
  };

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
        fetchAllUsers();
        fetchReferrals();
        fetchAgreements();
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

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch admin roles for all users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "admin");

      const adminUserIds = new Set(roles?.map(r => r.user_id) || []);
      
      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan, trial_ends_at");

      const subscriptionsMap = new Map(subscriptions?.map(s => [s.user_id, s]) || []);
      
      const usersWithRoles = profiles?.map(p => ({
        ...p,
        isAdmin: adminUserIds.has(p.user_id),
        subscription: subscriptionsMap.get(p.user_id)
      })) || [];

      setAllUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === user?.id) {
      toast.error("Cannot modify your own admin role");
      return;
    }

    const action = currentlyAdmin ? "remove" : "add";
    const confirmMessage = currentlyAdmin 
      ? "Are you sure you want to remove admin access from this user?"
      : "Are you sure you want to grant admin access to this user?";

    if (!confirm(confirmMessage)) return;

    setTogglingRole(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ targetUserId: userId, action }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update role");
      }

      toast.success(result.message);
      fetchAllUsers();
    } catch (error) {
      console.error("Error toggling admin role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setTogglingRole(null);
    }
  };

  const handleCreateUser = async () => {
    const email = prompt("Enter user email:");
    if (!email) return;
    
    const password = prompt("Enter password for this user (minimum 6 characters):");
    if (!password) return;
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    const name = prompt("Enter user name (optional):");

    setCreatingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email, password, name: name || null }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      toast.success(`User created successfully: ${email}`);
      fetchAllUsers(); // Refresh user list
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("Enter new password for this user (minimum 6 characters):");
    
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setResettingPassword(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId, newPassword }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      toast.success("Password reset successfully");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setResettingPassword(null);
    }
  };

  const handleSetTrial = async (userId: string, days: number) => {
    setManagingSubscription(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ targetUserId: userId, trialDays: days }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to set trial");
      }

      toast.success(result.message);
      fetchAllUsers();
    } catch (error) {
      console.error("Error setting trial:", error);
      toast.error(error instanceof Error ? error.message : "Failed to set trial");
    } finally {
      setManagingSubscription(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      toast.error("Cannot delete your own account");
      return;
    }

    const confirmed = confirm(`Are you sure you want to permanently delete ${userName || 'this user'}? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingUser(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ targetUserId: userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      fetchAllUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeletingUser(null);
    }
  };

  const handleRemoveFromCommunity = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      toast.error("Cannot remove yourself from community");
      return;
    }

    const confirmed = confirm(`Remove ${userName || 'this user'} from community? This will delete all their posts, comments, and messages.`);
    if (!confirmed) return;

    setRemovingFromCommunity(userId);
    try {
      // Delete all forum posts by user
      const { error: postsError } = await supabase
        .from("forum_posts")
        .delete()
        .eq("user_id", userId);

      if (postsError) throw postsError;

      // Delete all forum comments by user
      const { error: commentsError } = await supabase
        .from("forum_comments")
        .delete()
        .eq("user_id", userId);

      if (commentsError) throw commentsError;

      // Delete all direct messages sent by user
      const { error: dmError } = await supabase
        .from("direct_messages")
        .delete()
        .eq("sender_id", userId);

      if (dmError) throw dmError;

      // Clear screen_name to prevent future community access
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ screen_name: null, screen_name_set_at: null })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      toast.success(`${userName || 'User'} removed from community`);
    } catch (error) {
      console.error("Error removing from community:", error);
      toast.error("Failed to remove user from community");
    } finally {
      setRemovingFromCommunity(null);
    }
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
    return <Navigate to="/auth" replace />;
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
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
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
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <Home className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Admin Portal</h1>
                  <p className="text-xs text-muted-foreground">User Management</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                <span className="text-3xl font-bold">{allUsers.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admin Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                <span className="text-3xl font-bold">
                  {allUsers.filter(u => u.isAdmin).length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Regular Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserCog className="w-8 h-8 text-primary" />
                <span className="text-3xl font-bold">
                  {allUsers.filter(u => !u.isAdmin).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Analytics */}
        <div className="mb-8">
          <RevenueAnalytics />
        </div>

        {/* AI Usage Analytics */}
        <div className="mb-8">
          <AIUsageAnalytics />
        </div>

        {/* WTP Survey Analytics */}
        <div className="mb-8">
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
        </div>

        {/* Referrals Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Referrals
              </CardTitle>
              {loadingReferrals && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 && !loadingReferrals ? (
              <p className="text-sm text-muted-foreground text-center py-8">No referrals yet</p>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div 
                    key={referral.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm">
                            {referral.referrer_name} → {referral.referred_name || "Pending"}
                          </p>
                          <Badge 
                            variant={referral.status === "converted" ? "default" : "secondary"}
                            className={`text-xs ${referral.status === "converted" ? "bg-success/10 text-success" : ""}`}
                          >
                            {referral.status}
                          </Badge>
                          {referral.trial_granted && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Trial Granted
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Code: {referral.referral_code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(referral.created_at).toLocaleDateString()}
                          {referral.converted_at && ` • Converted: ${new Date(referral.converted_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      {referral.status === "converted" && !referral.trial_granted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGrantReferralTrial(referral.id, referral.referrer_id)}
                          disabled={grantingTrial === referral.id}
                          className="text-xs"
                        >
                          {grantingTrial === referral.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Gift className="w-3 h-3 mr-1" />
                              Grant Trial
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NDA Agreements Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-primary" />
                NDA Agreements ({agreements.length})
              </CardTitle>
              {loadingAgreements && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </CardHeader>
          <CardContent>
            {agreements.length === 0 && !loadingAgreements ? (
              <p className="text-sm text-muted-foreground text-center py-8">No agreements yet</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {agreements.map((agreement) => (
                  <div 
                    key={agreement.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm">{agreement.user_name}</p>
                          <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {agreement.agreement_type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            v{agreement.agreement_version}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Accepted: {new Date(agreement.accepted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                User Management
              </CardTitle>
              <div className="flex items-center gap-2">
                {loadingUsers && <Loader2 className="w-4 h-4 animate-spin" />}
                <Button 
                  size="sm" 
                  onClick={handleCreateUser}
                  disabled={creatingUser}
                >
                  {creatingUser ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Create User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {allUsers.length === 0 && !loadingUsers ? (
              <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
            ) : (
              <div className="space-y-3">
                {allUsers.map((userProfile) => (
                  <div 
                    key={userProfile.user_id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* User Info Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm">
                            {userProfile.name || "Unnamed User"}
                          </p>
                          {userProfile.isAdmin && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {userProfile.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {userProfile.subscription && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {userProfile.subscription.plan}
                            </Badge>
                          )}
                          {userProfile.subscription?.trial_ends_at && new Date(userProfile.subscription.trial_ends_at) > new Date() && (
                            <Badge variant="secondary" className="bg-accent/10 text-accent-foreground text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {Math.ceil((new Date(userProfile.subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d trial
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(userProfile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      <Select
                        disabled={managingSubscription === userProfile.user_id}
                        onValueChange={(value) => handleSetTrial(userProfile.user_id, parseInt(value))}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Trial" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="60">60 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                          <SelectItem value="0">Remove</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="sm"
                        variant={userProfile.isAdmin ? "destructive" : "default"}
                        onClick={() => handleToggleAdminRole(userProfile.user_id, userProfile.isAdmin)}
                        disabled={togglingRole === userProfile.user_id || userProfile.user_id === user?.id}
                        className="h-9 text-xs"
                      >
                        {togglingRole === userProfile.user_id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            {userProfile.isAdmin ? "Revoke" : "Admin"}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetPassword(userProfile.user_id)}
                        disabled={resettingPassword === userProfile.user_id}
                        className="h-9 text-xs"
                      >
                        {resettingPassword === userProfile.user_id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Key className="w-3 h-3 mr-1" />
                            Password
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromCommunity(userProfile.user_id, userProfile.name)}
                        disabled={removingFromCommunity === userProfile.user_id || userProfile.user_id === user?.id}
                        className="h-9 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                      >
                        {removingFromCommunity === userProfile.user_id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <MessageSquareOff className="w-3 h-3 mr-1" />
                            Ban
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(userProfile.user_id, userProfile.name)}
                        disabled={deletingUser === userProfile.user_id || userProfile.user_id === user?.id}
                        className="h-9 text-xs"
                      >
                        {deletingUser === userProfile.user_id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
