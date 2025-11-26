import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Enums, Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserPlus, Sparkles, Heart, Pencil, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const MET_VIA_OPTIONS = [
  { value: "dating_app", label: "Dating App" },
  { value: "social_media", label: "Social Media" },
  { value: "friends", label: "Through Friends" },
  { value: "work", label: "Work/Professional" },
  { value: "school", label: "School/Education" },
  { value: "event", label: "Event/Party" },
  { value: "gym", label: "Gym/Fitness" },
  { value: "coffee_shop", label: "Coffee Shop/Public" },
  { value: "other", label: "Other" },
];

const APP_OPTIONS = [
  "Hinge",
  "Bumble",
  "Tinder",
  "Raya",
  "The League",
  "Coffee Meets Bagel",
  "OkCupid",
  "Feeld",
  "Her",
  "Other",
];

type Candidate = Tables<"candidates">;

const AddCandidate = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [loading, setLoading] = useState(false);
  const [fetchingCandidate, setFetchingCandidate] = useState(isEditMode);

  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [metVia, setMetVia] = useState("");
  const [metApp, setMetApp] = useState("");
  const [status, setStatus] = useState<Enums<"candidate_status">>("just_matched");
  const [beenIntimate, setBeenIntimate] = useState(false);
  const [firstIntimacyDate, setFirstIntimacyDate] = useState("");

  // Fetch candidate for edit mode
  useEffect(() => {
    if (editId && user) {
      fetchCandidate();
    }
  }, [editId, user]);

  const fetchCandidate = async () => {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", editId!)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      if (data) {
        setNickname(data.nickname);
        setAge(data.age?.toString() || "");
        setMetVia(data.met_via || "");
        setMetApp(data.met_app || "");
        setStatus(data.status || "just_matched");
        setBeenIntimate(!!data.first_intimacy_date);
        setFirstIntimacyDate(data.first_intimacy_date || "");
      }
    } catch (error) {
      console.error("Error fetching candidate:", error);
      toast.error("Failed to load candidate");
      navigate("/dashboard");
    } finally {
      setFetchingCandidate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    setLoading(true);

    try {
      const candidateData = {
        nickname: nickname.trim(),
        age: age ? parseInt(age) : null,
        met_via: metVia || null,
        met_app: metVia === "dating_app" ? metApp : null,
        status,
        first_intimacy_date: beenIntimate && firstIntimacyDate ? firstIntimacyDate : null,
      };

      if (isEditMode) {
        // Update existing candidate
        const { error } = await supabase
          .from("candidates")
          .update(candidateData)
          .eq("id", editId!)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success(`${nickname} updated!`);
        navigate(`/candidate/${editId}`);
      } else {
        // Insert new candidate
        const { data, error } = await supabase
          .from("candidates")
          .insert({
            user_id: user.id,
            ...candidateData,
            first_contact_date: new Date().toISOString().split("T")[0],
          })
          .select()
          .single();

        if (error) throw error;

        // If they've been intimate, also log an intimate interaction
        if (beenIntimate && firstIntimacyDate) {
          await supabase.from("interactions").insert({
            user_id: user.id,
            candidate_id: data.id,
            interaction_type: "intimate",
            interaction_date: firstIntimacyDate,
            overall_feeling: 4,
          });
        }

        toast.success(`${nickname} added to your roster!`);
        navigate(`/candidate/${data.id}`);
      }
    } catch (error) {
      console.error("Error saving candidate:", error);
      toast.error(isEditMode ? "Failed to update candidate" : "Failed to add candidate");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetchingCandidate) {
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
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="container mx-auto px-4 py-3 max-w-lg flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(isEditMode ? `/candidate/${editId}` : "/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">
              {isEditMode ? "Edit Candidate" : "Add New Candidate"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditMode ? "Update their info" : "Start tracking someone new"}
            </p>
          </div>
          {isEditMode ? (
            <Pencil className="w-5 h-5 text-primary" />
          ) : (
            <UserPlus className="w-5 h-5 text-primary" />
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname *</Label>
                    <Input
                      id="nickname"
                      placeholder="What do you call them?"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use a nickname to keep things anonymous
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Their age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min={18}
                        max={99}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={status}
                        onValueChange={(v) => setStatus(v as Enums<"candidate_status">)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="just_matched">Just Matched</SelectItem>
                          <SelectItem value="texting">Texting</SelectItem>
                          <SelectItem value="planning_date">Planning Date</SelectItem>
                          <SelectItem value="dating">Dating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-xs text-center text-muted-foreground">
                Swipe to "Details" tab for more options <ChevronRight className="w-3 h-3 inline" />
              </p>
            </TabsContent>

            <TabsContent value="details" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">How You Met</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Where did you meet?</Label>
                    <Select value={metVia} onValueChange={setMetVia}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MET_VIA_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {metVia === "dating_app" && (
                    <div className="space-y-2">
                      <Label>Which app?</Label>
                      <Select value={metApp} onValueChange={setMetApp}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select app..." />
                        </SelectTrigger>
                        <SelectContent>
                          {APP_OPTIONS.map((app) => (
                            <SelectItem key={app} value={app}>
                              {app}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    Intimacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Been intimate?</p>
                      <p className="text-xs text-muted-foreground">
                        Helps track oxytocin bonding alerts
                      </p>
                    </div>
                    <Switch
                      checked={beenIntimate}
                      onCheckedChange={setBeenIntimate}
                    />
                  </div>

                  {beenIntimate && (
                    <div className="space-y-2">
                      <Label htmlFor="intimacyDate">First intimacy date</Label>
                      <Input
                        id="intimacyDate"
                        type="date"
                        value={firstIntimacyDate}
                        onChange={(e) => setFirstIntimacyDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                      />
                      <p className="text-xs text-muted-foreground">
                        We'll remind you about hormone-bonding effects for 48-72 hours after intimacy
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="space-y-3 pt-2">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                "Saving..."
              ) : isEditMode ? (
                <>
                  <Pencil className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add to Roster
                </>
              )}
            </Button>
            {!isEditMode && (
              <p className="text-xs text-center text-muted-foreground">
                <Sparkles className="w-3 h-3 inline mr-1" />
                You can add more details and calculate compatibility after
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddCandidate;
