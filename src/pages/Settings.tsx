import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Droplet, LogOut, User } from "lucide-react";
import { toast } from "sonner";

type Profile = Tables<"profiles">;

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [trackCycle, setTrackCycle] = useState(false);
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  const [cycleLength, setCycleLength] = useState(28);

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
        setTrackCycle(data.track_cycle || false);
        setLastPeriodDate(data.last_period_date || "");
        setCycleLength(data.cycle_length || 28);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          track_cycle: trackCycle,
          last_period_date: lastPeriodDate || null,
          cycle_length: cycleLength,
        })
        .eq("user_id", user!.id);

      if (error) throw error;
      toast.success("Settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {/* Profile Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile
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
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>
          </CardContent>
        </Card>

        {/* Cycle Tracking Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplet className="w-5 h-5 text-pink-500" />
              Hormone Cycle Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Track my cycle</p>
                <p className="text-xs text-muted-foreground">
                  Get hormone-aware dating insights
                </p>
              </div>
              <Switch
                checked={trackCycle}
                onCheckedChange={setTrackCycle}
              />
            </div>

            {trackCycle && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="lastPeriod">Last Period Start Date</Label>
                  <Input
                    id="lastPeriod"
                    type="date"
                    value={lastPeriodDate}
                    onChange={(e) => setLastPeriodDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to calculate your current cycle phase
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cycleLength">Average Cycle Length (days)</Label>
                  <Input
                    id="cycleLength"
                    type="number"
                    min={21}
                    max={40}
                    value={cycleLength}
                    onChange={(e) => setCycleLength(parseInt(e.target.value) || 28)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Typically 21-35 days. Default is 28.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
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
      </main>
    </div>
  );
};

export default Settings;
