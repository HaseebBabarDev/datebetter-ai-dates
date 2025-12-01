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
import { ArrowLeft, LogOut, User, Settings2, CreditCard, Check, Home, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { ProfilePreferencesEditor } from "@/components/settings/ProfilePreferencesEditor";
import { Badge } from "@/components/ui/badge";

type Profile = Tables<"profiles">;

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

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "account";
  const section = searchParams.get("section");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Account form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [sexualOrientation, setSexualOrientation] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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
        setLocation(data.location || "");
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
          location,
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
          <TabsList className="grid w-full grid-cols-3 mb-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, State"
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

          <TabsContent value="billing" className="space-y-4">
            {/* Current Plan */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">Trial</Badge>
                </div>
                <h3 className="text-xl font-bold">Free</h3>
                <p className="text-sm text-muted-foreground">1 candidate score & 1 update included</p>
              </CardContent>
            </Card>

            {/* Plans */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Upgrade for more candidates & updates</h4>
              
              {/* New to Dating Plan */}
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
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
                  <Button className="w-full mt-4" variant="outline">
                    Upgrade to New to Dating
                  </Button>
                </CardContent>
              </Card>

              {/* Dating Often Plan */}
              <Card className="cursor-pointer hover:border-primary/50 transition-colors border-primary/30 relative overflow-hidden">
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
                  <Button className="w-full mt-4">
                    Upgrade to Dating Often
                  </Button>
                </CardContent>
              </Card>

              {/* Dating More Plan */}
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
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
                  <Button className="w-full mt-4" variant="outline">
                    Upgrade to Dating More
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
