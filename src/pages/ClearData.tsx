import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, AlertTriangle, Cookie, Database, History, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ClearData() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAccountDeleteDialog, setShowAccountDeleteDialog] = useState(false);
  const [cleared, setCleared] = useState(false);
  
  const [options, setOptions] = useState({
    localStorage: true,
    sessionData: true,
    candidates: false,
    interactions: false,
    fullAccount: false,
  });

  const handleClearLocalData = () => {
    // Clear localStorage
    if (options.localStorage) {
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith("devi_") || key.startsWith("datebetter_") || key.startsWith("candidate_")
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // Clear session storage
    if (options.sessionData) {
      sessionStorage.clear();
    }

    toast.success("Local data cleared successfully");
    setCleared(true);
  };

  const handleClearDatabaseData = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);
    setShowDeleteDialog(false);

    try {
      if (options.interactions) {
        await supabase
          .from("interactions")
          .delete()
          .eq("user_id", user.id);
      }

      if (options.candidates) {
        // Delete related data first
        await supabase
          .from("behavioral_patterns")
          .delete()
          .eq("user_id", user.id);
        
        await supabase
          .from("advice_tracking")
          .delete()
          .eq("user_id", user.id);
        
        await supabase
          .from("usage_tracking")
          .delete()
          .eq("user_id", user.id);

        await supabase
          .from("candidates")
          .delete()
          .eq("user_id", user.id);
      }

      toast.success("Your data has been deleted");
      setCleared(true);
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Failed to clear some data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setLoading(true);
    setShowAccountDeleteDialog(false);

    try {
      // Delete all user data
      await supabase.from("interactions").delete().eq("user_id", user.id);
      await supabase.from("behavioral_patterns").delete().eq("user_id", user.id);
      await supabase.from("advice_tracking").delete().eq("user_id", user.id);
      await supabase.from("usage_tracking").delete().eq("user_id", user.id);
      await supabase.from("no_contact_progress").delete().eq("user_id", user.id);
      await supabase.from("candidates").delete().eq("user_id", user.id);
      await supabase.from("user_subscriptions").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);

      toast.success("Account deletion initiated. Signing out...");
      
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  if (cleared) {
    return (
      <div className="min-h-screen bg-background safe-area-inset">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Clear Data</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          <div className="p-4 rounded-full bg-green-500/10 mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Data Cleared!</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Your selected data has been successfully cleared.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="min-h-[44px]">
            Back to App
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Clear Data</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Warning */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-foreground">Please be careful</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Deleting your data is permanent and cannot be undone. Make sure you understand what you're deleting.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Local Data */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Local Data</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Clear data stored on this device. This won't affect your account.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="localStorage" 
                  checked={options.localStorage}
                  onCheckedChange={(checked) => setOptions({ ...options, localStorage: !!checked })}
                />
                <Label htmlFor="localStorage" className="text-sm cursor-pointer">
                  Local preferences & cache
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="sessionData" 
                  checked={options.sessionData}
                  onCheckedChange={(checked) => setOptions({ ...options, sessionData: !!checked })}
                />
                <Label htmlFor="sessionData" className="text-sm cursor-pointer">
                  Session data
                </Label>
              </div>
            </div>

            <Button 
              onClick={handleClearLocalData}
              variant="outline"
              className="w-full gap-2 min-h-[44px]"
              disabled={!options.localStorage && !options.sessionData}
            >
              <Trash2 className="w-4 h-4" />
              Clear Local Data
            </Button>
          </CardContent>
        </Card>

        {/* Account Data */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Account Data</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Delete data stored in your account. This is permanent.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="interactions" 
                  checked={options.interactions}
                  onCheckedChange={(checked) => setOptions({ ...options, interactions: !!checked })}
                />
                <div>
                  <Label htmlFor="interactions" className="text-sm cursor-pointer">
                    Interaction history
                  </Label>
                  <p className="text-xs text-muted-foreground">All logged dates and interactions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="candidates" 
                  checked={options.candidates}
                  onCheckedChange={(checked) => setOptions({ ...options, candidates: !!checked })}
                />
                <div>
                  <Label htmlFor="candidates" className="text-sm cursor-pointer">
                    All candidates
                  </Label>
                  <p className="text-xs text-muted-foreground">Including all their data and photos</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="w-full gap-2 min-h-[44px]"
              disabled={(!options.candidates && !options.interactions) || loading}
            >
              <Trash2 className="w-4 h-4" />
              Delete Account Data
            </Button>
          </CardContent>
        </Card>

        {/* Full Account Deletion */}
        <Card className="border-destructive/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              <h2 className="text-base font-semibold text-foreground">Delete Account</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Permanently delete your entire account and all associated data. This action cannot be undone.
            </p>

            <Button 
              onClick={() => setShowAccountDeleteDialog(true)}
              variant="outline"
              className="w-full gap-2 min-h-[44px] border-destructive/50 text-destructive hover:bg-destructive/10"
              disabled={loading}
            >
              <Trash2 className="w-4 h-4" />
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Delete Data Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearDatabaseData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showAccountDeleteDialog} onOpenChange={setShowAccountDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Entire Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and ALL data, including your profile, candidates, interactions, and subscription. You will be signed out and cannot recover this data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
