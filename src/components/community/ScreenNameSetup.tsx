import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Users, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ScreenNameSetupProps {
  onComplete: (screenName: string) => void;
}

export function ScreenNameSetup({ onComplete }: ScreenNameSetupProps) {
  const { user } = useAuth();
  const [screenName, setScreenName] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateScreenName = (name: string): string | null => {
    if (name.length < 3) return "Screen name must be at least 3 characters";
    if (name.length > 20) return "Screen name must be 20 characters or less";
    if (!/^[a-zA-Z0-9_]+$/.test(name)) return "Only letters, numbers, and underscores allowed";
    return null;
  };

  const checkAvailability = async (name: string) => {
    const validationError = validateScreenName(name);
    if (validationError) {
      setError(validationError);
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("community_profiles" as any)
        .select("screen_name")
        .eq("screen_name", name.toLowerCase())
        .maybeSingle() as { data: { screen_name: string } | null; error: any };

      if (error) throw error;

      setIsAvailable(!data);
      if (data) {
        setError("This screen name is already taken");
      }
    } catch (err) {
      console.error("Error checking availability:", err);
      setError("Failed to check availability");
    } finally {
      setIsChecking(false);
    }
  };

  const handleNameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setScreenName(sanitized);
    setIsAvailable(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!user || !screenName || !isAvailable) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          screen_name: screenName.toLowerCase(),
          screen_name_set_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      onComplete(screenName);
    } catch (err: any) {
      console.error("Error setting screen name:", err);
      if (err.message?.includes("unique")) {
        setError("This screen name was just taken. Please try another.");
      } else {
        toast.error("Failed to set screen name. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Join the Community</CardTitle>
            <CardDescription className="mt-2">
              Create a screen name to connect with other verified members
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-muted-foreground">
                Your real identity stays private
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-muted-foreground">
                Connect with email-verified members only
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-muted-foreground">
                AI-moderated for a safe, supportive space
              </span>
            </div>
          </div>

          {/* Screen Name Input */}
          <div className="space-y-3">
            <Label htmlFor="screenName">Choose your screen name</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="screenName"
                value={screenName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => screenName.length >= 3 && checkAvailability(screenName)}
                placeholder="your_name"
                className="pl-8"
                maxLength={20}
              />
            </div>

            {/* Status Messages */}
            {isChecking && (
              <p className="text-xs text-muted-foreground animate-pulse">
                Checking availability...
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            {isAvailable && !error && (
              <p className="text-xs text-green-500">
                ✓ @{screenName} is available!
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              3-20 characters. Letters, numbers, and underscores only.
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isAvailable || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Creating..." : "Join Community"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Screen names cannot be changed after creation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}