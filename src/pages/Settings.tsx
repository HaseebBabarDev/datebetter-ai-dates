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
import { ArrowLeft, LogOut, User, Settings2, CreditCard, Check, Home, Trash2, Mail, Loader2, Shield, Key, FileText, HelpCircle, Info, Smartphone, ChevronRight, RotateCcw, Gift, Copy, Share2, Users, ScrollText, Sparkles, Heart, Brain, MessageCircle, Crown } from "lucide-react";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { ZodiacModeSettings } from "@/components/settings/ZodiacModeSettings";
import { DeviSettings } from "@/components/settings/DeviSettings";
import { AutoDisqualifySettings } from "@/components/settings/AutoDisqualifySettings";
import { toast } from "sonner";
import { ProfilePreferencesEditor } from "@/components/settings/ProfilePreferencesEditor";
import { ProfilePhotoUpload } from "@/components/settings/ProfilePhotoUpload";
import { Badge } from "@/components/ui/badge";
import { STRIPE_PLANS } from "@/lib/stripeConfig";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { format, parse } from "date-fns";
import { useTour, SETTINGS_TOUR_STEPS, TourRestartButton } from "@/components/tour";
import { BetaNdaDialog } from "@/components/auth/BetaNdaDialog";
import { useNdaAgreement } from "@/hooks/useNdaAgreement";

type Profile = Tables<"profiles">;
type SubscriptionPlan = "free" | "basic" | "starter" | "unlimited";

const PLAN_DISPLAY: Record<SubscriptionPlan, { name: string; price: string; stripeKey?: keyof typeof STRIPE_PLANS }> = {
  free: { name: "Free", price: "$0" },
  basic: { name: "Starter", price: "$9.99/mo", stripeKey: "basic" },
  starter: { name: "Plus", price: "$15.99/mo", stripeKey: "starter" },
  unlimited: { name: "Unlimited", price: "$29.99/mo", stripeKey: "unlimited" },
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
  const { startTour, hasCompletedTour, resetAllTours } = useTour();
  const { ndaAcceptance, loading: ndaLoading } = useNdaAgreement();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>("free");
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<{ total: number; converted: number; trialEarned: boolean }>({ total: 0, converted: 0, trialEarned: false });
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [showBetaNda, setShowBetaNda] = useState(false);

  // Account form state
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [sexualOrientation, setSexualOrientation] = useState("");
  const [screenName, setScreenName] = useState("");

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      // Fetch all data in parallel for faster load times
      const [profileRes, subscriptionRes, adminRes, referralRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
        supabase.from("user_subscriptions").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle(),
        supabase.from("referrals").select("*").eq("referrer_id", user!.id),
      ]);

      // Process profile
      if (profileRes.data) {
        const data = profileRes.data;
        setProfile(data);
        setName(data.name || "");
        setAvatarUrl(data.avatar_url || null);
        if (data.birth_date) {
          setBirthDate(parse(data.birth_date, "yyyy-MM-dd", new Date()));
        }
        setCity(data.city || "");
        setState(data.state || "");
        setCountry(data.country || "");
        setGenderIdentity(data.gender_identity || "");
        setPronouns(data.pronouns || "");
        setSexualOrientation(data.sexual_orientation || "");
        setScreenName(data.screen_name || "");
      }

      // Process subscription - map from Stripe plan names
      if (subscriptionRes.data?.plan) {
        const validPlans: SubscriptionPlan[] = ["free", "basic", "starter", "unlimited"];
        const plan = validPlans.includes(subscriptionRes.data.plan as SubscriptionPlan) 
          ? subscriptionRes.data.plan as SubscriptionPlan 
          : "free";
        setCurrentPlan(plan);
      }

      // Process admin status
      if (adminRes.data) {
        setIsAdmin(true);
        fetchAllUsers();
      }

      // Process referrals
      if (referralRes.data) {
        const total = referralRes.data.length;
        const converted = referralRes.data.filter(r => r.status === "converted").length;
        const trialEarned = referralRes.data.some(r => r.trial_granted);
        setReferralStats({ total, converted, trialEarned });
      }
    } catch (error) {
      console.error("Error fetching settings data:", error);
    } finally {
      setLoading(false);
    }
  };


  const referralCode = user?.id ? `DEVI-${user.id.slice(0, 6).toUpperCase()}` : "DEVI-FRIEND";
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedReferral(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Date Better with D.E.V.I.",
          text: "I'm using D.E.V.I. to date smarter. Sign up for a paid plan and we both get 1 month free!",
          url: referralLink,
        });
      } catch (err) {
        handleCopyReferral();
      }
    } else {
      handleCopyReferral();
    }
  };

  // Start tour for new users
  useEffect(() => {
    if (!loading && profile && !hasCompletedTour("settings")) {
      const timer = setTimeout(() => {
        startTour("settings", SETTINGS_TOUR_STEPS);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, profile, startTour, hasCompletedTour]);


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


  const handleChangePlan = async (newPlan: SubscriptionPlan) => {
    if (newPlan === currentPlan) return;
    if (newPlan === "free") {
      // Redirect to customer portal for downgrade
      navigate("/subscription");
      return;
    }

    const planInfo = PLAN_DISPLAY[newPlan];
    if (!planInfo?.stripeKey) return;

    setCheckoutLoading(newPlan);
    try {
      const stripePlan = STRIPE_PLANS[planInfo.stripeKey];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: stripePlan.price_id, mode: "subscription" },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };


  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          screen_name: screenName || null,
          birth_date: birthDate ? format(birthDate, "yyyy-MM-dd") : null,
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
    <div className="min-h-[100dvh] bg-[image:var(--gradient-page)] pb-24">
      <header className="sticky top-0 z-50 bg-[image:var(--gradient-header)] backdrop-blur-xl border-b border-border/50 pt-safe-top">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="shrink-0 rounded-xl hover:bg-primary/10 h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")} 
              className="shrink-0 rounded-xl hover:bg-primary/10 h-9 w-9"
            >
              <Home className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
                <Settings2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold truncate">Settings</h1>
            </div>
            <TourRestartButton tourId="settings" tourSteps={SETTINGS_TOUR_STEPS} />
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="flex w-full mb-4 h-auto p-1 bg-muted/50 backdrop-blur-sm overflow-x-auto scrollbar-hide gap-1">
            <TabsTrigger value="account" className="flex items-center gap-1.5 py-2.5 px-3 min-w-fit rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm shrink-0" data-tour="settings-account">
              <User className="w-4 h-4 shrink-0" />
              <span className="text-[11px] sm:text-sm">Account</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1.5 py-2.5 px-3 min-w-fit rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm shrink-0" data-tour="settings-preferences">
              <Settings2 className="w-4 h-4 shrink-0" />
              <span className="text-[11px] sm:text-sm">Prefs</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1.5 py-2.5 px-3 min-w-fit rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm shrink-0" data-tour="settings-billing">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span className="text-[11px] sm:text-sm">Billing</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-1.5 py-2.5 px-3 min-w-fit rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm shrink-0">
                <Shield className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-sm">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-3">
            {/* Profile Section */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Identity & Basics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <ProfilePhotoUpload
                  userId={user.id}
                  currentPhotoUrl={avatarUrl}
                  userName={name}
                  onPhotoUpdated={setAvatarUrl}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs font-medium">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="screenName" className="text-xs font-medium">Screen Name</Label>
                    <Input
                      id="screenName"
                      value={screenName}
                      onChange={(e) => setScreenName(e.target.value)}
                      placeholder="Community name"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Birth Month</Label>
                    <Select 
                      value={birthDate ? String(birthDate.getMonth() + 1) : ""} 
                      onValueChange={(month) => {
                        const newDate = birthDate ? new Date(birthDate) : new Date(2000, 0, 1);
                        newDate.setMonth(parseInt(month) - 1);
                        setBirthDate(newDate);
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Month" /></SelectTrigger>
                      <SelectContent>
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Birth Day</Label>
                    <Select 
                      value={birthDate ? String(birthDate.getDate()) : ""} 
                      onValueChange={(day) => {
                        const newDate = birthDate ? new Date(birthDate) : new Date(2000, 0, 1);
                        newDate.setDate(parseInt(day));
                        setBirthDate(newDate);
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Day" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Birth Year</Label>
                    <Select 
                      value={birthDate ? String(birthDate.getFullYear()) : ""} 
                      onValueChange={(year) => {
                        const newDate = birthDate ? new Date(birthDate) : new Date(2000, 0, 1);
                        newDate.setFullYear(parseInt(year));
                        setBirthDate(newDate);
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: (new Date().getFullYear() - 18) - 1920 + 1 }, (_, i) => (new Date().getFullYear() - 18) - i).map((year) => (
                          <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-xs font-medium">State</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs font-medium">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Gender</Label>
                    <Select value={genderIdentity} onValueChange={setGenderIdentity}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Pronouns</Label>
                    <Select value={pronouns} onValueChange={setPronouns}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {PRONOUN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Orientation</Label>
                    <Select value={sexualOrientation} onValueChange={setSexualOrientation}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {ORIENTATION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  {user.email}
                </p>
              </CardContent>
            </Card>

            {/* Save & Sign Out */}
            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveAccount} 
                    className="flex-1 h-9 text-sm" 
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="h-9 px-4 text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Theme / Appearance */}

            {/* Theme / Appearance */}
            <ThemeSelector />

            {/* Zodiac Mode */}
            <ZodiacModeSettings />

            {/* D.E.V.I. Preferences */}
            <DeviSettings userId={user.id} />

            {/* Auto-Disqualify Rules */}
            <AutoDisqualifySettings />

            {/* Self-Discovery Quizzes */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate("/self-discovery")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Self-Discovery Quizzes</p>
                      <p className="text-xs text-muted-foreground">
                        Personalize D.E.V.I.'s guidance
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Legal & Agreements */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-primary" />
                  Legal & Agreements
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between h-10 text-sm"
                  onClick={() => setShowBetaNda(true)}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    Beta Tester NDA
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between h-10 text-sm"
                  onClick={() => navigate("/terms")}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Terms of Service
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between h-10 text-sm"
                  onClick={() => navigate("/privacy-policy")}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Privacy Policy
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                {ndaAcceptance?.accepted_at && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Beta NDA accepted on {new Date(ndaAcceptance.accepted_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Trash2 className="w-4 h-4 text-destructive shrink-0" />
                    <span className="text-xs text-muted-foreground">Delete account</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs"
                    onClick={() => {
                      window.location.href = `mailto:support@datebetterapp.com?subject=Account Deletion Request&body=Hi, I would like to delete my account.%0D%0A%0D%0AEmail: ${user?.email}%0D%0A%0D%0APlease confirm once my account has been deleted.`;
                    }}
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Request
                  </Button>
                </div>
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
            {/* Subscription Management */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {currentPlan === "free" ? "Free" : "Active"}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold">{PLAN_DISPLAY[currentPlan]?.name || "Free"}</h3>
                <p className="text-sm text-muted-foreground">
                  {PLAN_DISPLAY[currentPlan]?.price || "$0"}
                </p>
                <div className="flex gap-2">
                  {currentPlan !== "free" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={checkoutLoading === "portal"}
                      onClick={async () => {
                        setCheckoutLoading("portal");
                        try {
                          const { data, error } = await supabase.functions.invoke("customer-portal");
                          if (error) throw error;
                          if (data?.url) {
                            window.location.href = data.url;
                          }
                        } catch (e) {
                          console.error("Portal error:", e);
                          toast.error("Failed to open billing portal.");
                        } finally {
                          setCheckoutLoading(null);
                        }
                      }}
                    >
                      {checkoutLoading === "portal" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      Manage Subscription
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate("/subscription")}
                  >
                    <Crown className="w-4 h-4" />
                    {currentPlan === "free" ? "Upgrade" : "View Plans"}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText("support@datebetterapp.com");
                      toast.success("Email copied! Send us a request to delete your account.");
                    } catch {
                      toast.error("Failed to copy email");
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-destructive/10 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <div>
                      <span className="text-sm text-destructive">Delete Account</span>
                      <p className="text-xs text-muted-foreground">Email support@datebetterapp.com</p>
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
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
                <button
                  onClick={() => {
                    resetAllTours();
                    toast.success("Tours reset! You'll see the tutorials again on each page.");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Restart App Tours</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>



            {/* Referral Section */}
            <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Refer a Friend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Share your unique code! When friends sign up for a paid plan, you both get 1 month free.
                </p>
                
                {/* Referral Code Display */}
                <div className="p-4 rounded-xl bg-background border border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Your referral code</p>
                      <p className="font-mono font-bold text-lg text-primary truncate">{referralCode}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCopyReferral}
                        className="h-9 px-3"
                      >
                        {copiedReferral ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleShareReferral}
                        className="h-9 px-3"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Referral Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{referralStats.total}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Friends referred</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Gift className="w-4 h-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{referralStats.converted}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Converted</p>
                  </div>
                </div>

                {referralStats.trialEarned && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                    <Check className="w-4 h-4 text-success" />
                    <p className="text-sm text-success">You've earned free trial time from referrals!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plans */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                {currentPlan === "free" ? "Upgrade to unlock more features" : "Change your plan"}
              </h4>

              {/* Starter Plan — $9.99 */}
              <Card className={`cursor-pointer hover:border-primary/50 transition-colors ${currentPlan === "basic" ? "border-primary bg-primary/5" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-semibold">Starter</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">5 candidates • 300 D.E.V.I. messages</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">$9.99</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t space-y-1.5">
                    {["Up to 5 candidates", "300 D.E.V.I. messages", "1 text simulator exchange (trial)", "5 compatibility refreshes / candidate", "Red flag detection", "Cycle tracking"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant={currentPlan === "basic" ? "secondary" : "outline"}
                    disabled={currentPlan === "basic" || checkoutLoading !== null}
                    onClick={() => handleChangePlan("basic")}
                  >
                    {checkoutLoading === "basic" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    ) : currentPlan === "basic" ? (
                      <><Check className="w-4 h-4 mr-2" />Current Plan</>
                    ) : (
                      "Get Starter"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Plus Plan — $15.99 */}
              <Card className={`cursor-pointer hover:border-primary/50 transition-colors ${currentPlan === "starter" ? "border-primary bg-primary/5" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold">Plus</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">10 candidates • 1,000 D.E.V.I. messages</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">$15.99</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t space-y-1.5">
                    {["Up to 10 candidates", "1,000 D.E.V.I. messages", "5 text simulator conversations", "10 compatibility refreshes / candidate", "Red flag detection", "Voice playback insights"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant={currentPlan === "starter" ? "secondary" : "outline"}
                    disabled={currentPlan === "starter" || checkoutLoading !== null}
                    onClick={() => handleChangePlan("starter")}
                  >
                    {checkoutLoading === "starter" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    ) : currentPlan === "starter" ? (
                      <><Check className="w-4 h-4 mr-2" />Current Plan</>
                    ) : (
                      "Get Plus"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Unlimited Plan — $29.99 */}
              <Card className={`cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden ${currentPlan === "unlimited" ? "border-primary bg-primary/5" : "border-primary/30"}`}>
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-bl">
                  Most Popular
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold">Unlimited</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">Unlimited candidates & messages</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">$29.99</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t space-y-1.5">
                    {["Unlimited candidates", "Unlimited D.E.V.I. messages", "20 text simulator conversations", "Unlimited compatibility refreshes", "Red flag detection", "Priority support"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant={currentPlan === "unlimited" ? "secondary" : "default"}
                    disabled={currentPlan === "unlimited" || checkoutLoading !== null}
                    onClick={() => handleChangePlan("unlimited")}
                  >
                    {checkoutLoading === "unlimited" ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    ) : currentPlan === "unlimited" ? (
                      <><Check className="w-4 h-4 mr-2" />Current Plan</>
                    ) : (
                      "Get Unlimited"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

          </TabsContent>
        </Tabs>
      </main>

      {/* Payment now handled via Stripe Checkout redirect */}

      {/* Beta NDA Dialog - View Only */}
      <BetaNdaDialog
        open={showBetaNda}
        onAccept={() => setShowBetaNda(false)}
        viewOnly
        acceptedAt={ndaAcceptance?.accepted_at}
      />
    </div>
  );
};

export default Settings;
