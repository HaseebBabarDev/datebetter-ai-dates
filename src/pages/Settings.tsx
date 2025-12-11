import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, LogOut, User, Settings2, CreditCard, Check, Home, Trash2, Mail, Loader2, Shield, Key, FileText, HelpCircle, Info, Smartphone, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ProfilePreferencesEditor } from "@/components/settings/ProfilePreferencesEditor";
import { Badge } from "@/components/ui/badge";

type Profile = Tables<"profiles">;
type SubscriptionPlan = "free" | "new_to_dating" | "dating_often" | "dating_more";

const PLAN_LIMITS: Record<SubscriptionPlan, { candidates: number; updates: number }> = {
  free: { candidates: 1, updates: 1 },
  new_to_dating: { candidates: 3, updates: 5 },
  dating_often: { candidates: 7, updates: 12 },
  dating_more: { candidates: 12, updates: 20 },

};

const PLAN_DISPLAY: Record<SubscriptionPlan, { name: string; price: string }> = {
  free: { name: "Free", price: "$0" },
  new_to_dating: { name: "New to Dating", price: "$9.99" },
  dating_often: { name: "Dating Often", price: "$19.99" },
  dating_more: { name: "Dating More", price: "$29.99" },
};

const GENDER_OPTIONS = [
  { value: "woman_cis", label: "Woman" },
  { value: "woman_trans", label: "Woman (transgender)" },
  { value: "man_cis", label: "Man" },
  { value: "man_trans", label: "Man (transgender)" },
  { value: "non_binary", label: "Non-binary" },
  { value: "gender_fluid", label: "Gender fluid" },
  { value: "self_describe", label: "Prefer to self-describe" },
];

const PRONOUN_OPTIONS = [
  { value: "she_her", label: "She/Her" },
  { value: "he_him", label: "He/Him" },
  { value: "they_them", label: "They/Them" },
  { value: "other", label: "Other" },
];

const ORIENTATION_OPTIONS = [
  { value: "straight", label: "Straight" },
  { value: "lesbian", label: "Lesbian" },
  { value: "bisexual", label: "Bisexual" },
  { value: "pansexual", label: "Pansexual" },
  { value: "queer", label: "Queer" },
  { value: "asexual", label: "Asexual" },
  { value: "no_label", label: "Prefer not to label" },
  { value: "self_describe", label: "Self-describe" },
];

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "NL", label: "Netherlands" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "IN", label: "India" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "SG", label: "Singapore" },
  { value: "OTHER", label: "Other" },
];

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "account";
  const section = searchParams.get("section");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>("free");
  const [changingPlan, setChangingPlan] = useState<SubscriptionPlan | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);

  // Account form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [sexualOrientation, setSexualOrientation] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubscription();
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
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
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
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
      
      const usersWithRoles = profiles?.map(p => ({
        ...p,
        isAdmin: adminUserIds.has(p.user_id)
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
      fetchAllUsers(); // Refresh the list
    } catch (error) {
      console.error("Error toggling admin role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setTogglingRole(null);
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

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCurrentPlan(data.plan as SubscriptionPlan);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const handleChangePlan = async (newPlan: SubscriptionPlan) => {
    if (newPlan === currentPlan) return;
    
    setChangingPlan(newPlan);
    try {
      const limits = PLAN_LIMITS[newPlan];
      
      // Check if subscription exists
      const { data: existing } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            plan: newPlan,
            candidates_limit: limits.candidates,
            updates_per_candidate: limits.updates,
          })
          .eq("user_id", user!.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: user!.id,
            plan: newPlan,
            candidates_limit: limits.candidates,
            updates_per_candidate: limits.updates,
          });

        if (error) throw error;
      }

      setCurrentPlan(newPlan);
      toast.success(`Upgraded to ${PLAN_DISPLAY[newPlan].name}!`);
    } catch (error) {
      console.error("Error changing plan:", error);
      toast.error("Failed to change plan");
    } finally {
      setChangingPlan(null);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setName(data.name || "");
        setCity(data.city || "");
        setState(data.state || "");
        setCountry(data.country || "");
        setGenderIdentity(data.gender_identity || "");
        setPronouns(data.pronouns || "");
        setSexualOrientation(data.sexual_orientation || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          city,
          state,
          country,
          gender_identity: (genderIdentity || null) as Enums<"gender_identity"> | null,
          pronouns: (pronouns || null) as Enums<"pronouns"> | null,
          sexual_orientation: (sexualOrientation || null) as Enums<"sexual_orientation"> | null,
        })
        .eq("user_id", user!.id);

      if (error) throw error;
      toast.success("Account saved!");
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} mb-4`}>
            <TabsTrigger value="account" className="gap-1.5 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1.5 text-xs sm:text-sm">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5 text-xs sm:text-sm">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-1.5 text-xs sm:text-sm">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            {/* Profile Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Identity & Basics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender Identity</Label>
                    <Select value={genderIdentity} onValueChange={setGenderIdentity}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pronouns</Label>
                    <Select value={pronouns} onValueChange={setPronouns}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {PRONOUN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sexual Orientation</Label>
                  <Select value={sexualOrientation} onValueChange={setSexualOrientation}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {ORIENTATION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  {user.email}
                </p>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button 
              onClick={handleSaveAccount} 
              className="w-full" 
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>

            {/* Sign Out */}
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>

            {/* Delete Account */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">Delete Account</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Want to delete your account? Your plan will be downgraded to Free and all your data will be permanently removed.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    window.location.href = `mailto:support@datebetterapp.com?subject=Account Deletion Request&body=Hi, I would like to delete my account.%0D%0A%0D%0AEmail: ${user?.email}%0D%0A%0D%0APlease confirm once my account has been deleted.`;
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Request Account Deletion
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <ProfilePreferencesEditor defaultSection={section} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-4">
              {/* Quick Access to Admin Portal */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-1">
                        <Shield className="w-5 h-5 text-primary" />
                        Admin Portal
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Access the full admin dashboard with user management and controls
                      </p>
                    </div>
                    <Button onClick={() => navigate("/admin")}>
                      Open Portal
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Admin Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <h4 className="font-medium">User Management</h4>
                    {loadingUsers && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  
                  {allUsers.length === 0 && !loadingUsers ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                  ) : (
                    <div className="space-y-2">
                      {allUsers.map((userProfile) => (
                        <div 
                          key={userProfile.user_id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
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
                            <p className="text-xs text-muted-foreground">
                              ID: {userProfile.user_id.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={userProfile.isAdmin ? "destructive" : "default"}
                              onClick={() => handleToggleAdminRole(userProfile.user_id, userProfile.isAdmin)}
                              disabled={togglingRole === userProfile.user_id || userProfile.user_id === user?.id}
                            >
                              {togglingRole === userProfile.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-1" />
                                  {userProfile.isAdmin ? "Revoke" : "Grant"}
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetPassword(userProfile.user_id)}
                              disabled={resettingPassword === userProfile.user_id}
                            >
                              {resettingPassword === userProfile.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Key className="w-4 h-4 mr-1" />
                                  Reset
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
            </TabsContent>
          )}

          <TabsContent value="billing" className="space-y-4">
            {/* Legal & App Info Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Legal & Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <button
                  onClick={() => navigate("/privacy-policy")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Privacy Policy</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => navigate("/terms")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Terms & Conditions</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => navigate("/about")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">About dateBetter</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => navigate("/support")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Support & Contact</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => navigate("/clear-data")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Clear Data & Privacy</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => navigate("/app-version")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">App Version</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>

            {/* Current Plan */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {currentPlan === "free" ? "Trial" : "Active"}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold">{PLAN_DISPLAY[currentPlan].name}</h3>
                <p className="text-sm text-muted-foreground">
                  {PLAN_LIMITS[currentPlan].candidates} candidate{PLAN_LIMITS[currentPlan].candidates > 1 ? "s" : ""} • {PLAN_LIMITS[currentPlan].updates} update{PLAN_LIMITS[currentPlan].updates > 1 ? "s" : ""} each
                </p>
              </CardContent>
            </Card>

            {/* Plans */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                {currentPlan === "free" ? "Upgrade for more candidates & updates" : "Change your plan"}
              </h4>
              
              {/* New to Dating Plan */}
              <Card className={`cursor-pointer hover:border-primary/50 transition-colors ${currentPlan === "new_to_dating" ? "border-primary bg-primary/5" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">New to Dating</h4>
                      <p className="text-sm text-muted-foreground">3 candidates • 5 updates each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">$9.99</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>3 candidate profiles</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>5 updates per candidate</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>AI compatibility scoring</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant={currentPlan === "new_to_dating" ? "secondary" : "outline"}
                    disabled={currentPlan === "new_to_dating" || changingPlan !== null}
                    onClick={() => handleChangePlan("new_to_dating")}
                  >
                    {changingPlan === "new_to_dating" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Upgrading...</>
                    ) : currentPlan === "new_to_dating" ? (
                      <><Check className="w-4 h-4 mr-2" />Current Plan</>
                    ) : (
                      "Upgrade to New to Dating"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Dating Often Plan */}
              <Card className={`cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden ${currentPlan === "dating_often" ? "border-primary bg-primary/5" : "border-primary/30"}`}>
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-bl">
                  Best Value
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">Dating Often</h4>
                      <p className="text-sm text-muted-foreground">7 candidates • 12 updates each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">$19.99</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>7 candidate profiles</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>12 updates per candidate</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>AI compatibility scoring</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    variant={currentPlan === "dating_often" ? "secondary" : "default"}
                    disabled={currentPlan === "dating_often" || changingPlan !== null}
                    onClick={() => handleChangePlan("dating_often")}
                  >
                    {changingPlan === "dating_often" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Upgrading...</>
                    ) : currentPlan === "dating_often" ? (
                      <><Check className="w-4 h-4 mr-2" />Current Plan</>
                    ) : (
                      "Upgrade to Dating Often"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Dating More Plan */}
              <Card className={`cursor-pointer hover:border-primary/50 transition-colors ${currentPlan === "dating_more" ? "border-primary bg-primary/5" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">Dating More</h4>
                      <p className="text-sm text-muted-foreground">12 candidates • 20 updates each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">$29.99</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>12 candidate profiles</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>20 updates per candidate</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>AI compatibility scoring</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant={currentPlan === "dating_more" ? "secondary" : "outline"}
                    disabled={currentPlan === "dating_more" || changingPlan !== null}
                    onClick={() => handleChangePlan("dating_more")}
                  >
                    {changingPlan === "dating_more" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Upgrading...</>
                    ) : currentPlan === "dating_more" ? (
                      <><Check className="w-4 h-4 mr-2" />Current Plan</>
                    ) : (
                      "Upgrade to Dating More"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
