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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserPlus, Sparkles, Heart, Pencil, User, Brain, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SliderInput } from "@/components/onboarding/SliderInput";
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
  "Hinge", "Bumble", "Tinder", "Raya", "The League",
  "Coffee Meets Bagel", "OkCupid", "Feeld", "Her", "Other",
];

const GENDER_OPTIONS: { value: Enums<"gender_identity">; label: string }[] = [
  { value: "woman_cis", label: "Woman" },
  { value: "woman_trans", label: "Woman (Trans)" },
  { value: "man_cis", label: "Man" },
  { value: "man_trans", label: "Man (Trans)" },
  { value: "non_binary", label: "Non-Binary" },
  { value: "gender_fluid", label: "Gender Fluid" },
  { value: "self_describe", label: "Other" },
];

const PRONOUN_OPTIONS: { value: Enums<"pronouns">; label: string }[] = [
  { value: "she_her", label: "She/Her" },
  { value: "he_him", label: "He/Him" },
  { value: "they_them", label: "They/Them" },
  { value: "other", label: "Other" },
];

const RELIGION_OPTIONS: { value: Enums<"religion">; label: string }[] = [
  { value: "none", label: "None/Atheist" },
  { value: "spiritual", label: "Spiritual" },
  { value: "christian_catholic", label: "Christian (Catholic)" },
  { value: "christian_protestant", label: "Christian (Protestant)" },
  { value: "christian_other", label: "Christian (Other)" },
  { value: "jewish", label: "Jewish" },
  { value: "muslim", label: "Muslim" },
  { value: "hindu", label: "Hindu" },
  { value: "buddhist", label: "Buddhist" },
  { value: "other", label: "Other" },
];

const POLITICS_OPTIONS: { value: Enums<"politics">; label: string }[] = [
  { value: "progressive", label: "Progressive" },
  { value: "liberal", label: "Liberal" },
  { value: "moderate", label: "Moderate" },
  { value: "conservative", label: "Conservative" },
  { value: "traditional", label: "Traditional" },
];

const RELATIONSHIP_GOAL_OPTIONS: { value: Enums<"relationship_goal">; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Serious Relationship" },
  { value: "marriage", label: "Marriage" },
  { value: "unsure", label: "Unsure" },
];

const RELATIONSHIP_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "recently_divorced", label: "Recently Divorced" },
  { value: "ethical_non_monogamy", label: "Ethical Non-Monogamy" },
];

const KIDS_DESIRE_OPTIONS: { value: Enums<"kids_desire">; label: string }[] = [
  { value: "definitely_yes", label: "Wants Kids" },
  { value: "maybe", label: "Maybe/Open" },
  { value: "definitely_no", label: "Doesn't Want Kids" },
  { value: "already_have", label: "Already Has Kids" },
];

const KIDS_STATUS_OPTIONS: { value: Enums<"kids_status">; label: string }[] = [
  { value: "no_kids", label: "No Kids" },
  { value: "has_young_kids", label: "Has Young Kids" },
  { value: "has_adult_kids", label: "Has Adult Kids" },
];

const ATTACHMENT_STYLE_OPTIONS: { value: Enums<"attachment_style">; label: string }[] = [
  { value: "secure", label: "Secure" },
  { value: "anxious", label: "Anxious" },
  { value: "avoidant", label: "Avoidant" },
  { value: "disorganized", label: "Disorganized" },
];

const EDUCATION_OPTIONS = [
  { value: "high_school", label: "High School" },
  { value: "some_college", label: "Some College" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate/PhD" },
  { value: "trade_school", label: "Trade School" },
];

const SOCIAL_STYLE_OPTIONS = [
  { value: "homebody", label: "Homebody" },
  { value: "social_butterfly", label: "Social Butterfly" },
  { value: "balanced", label: "Balanced" },
  { value: "mood_dependent", label: "Depends on Mood" },
];

const LIFESTYLE_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "socially", label: "Socially" },
  { value: "regularly", label: "Regularly" },
];

const EXERCISE_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "Sometimes" },
  { value: "regularly", label: "Regularly" },
  { value: "daily", label: "Daily" },
];

const CAREER_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "entry_level", label: "Entry Level" },
  { value: "mid_career", label: "Mid-Career" },
  { value: "senior", label: "Senior/Manager" },
  { value: "executive", label: "Executive" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "freelance", label: "Freelance" },
  { value: "between_jobs", label: "Between Jobs" },
];

const HEIGHT_OPTIONS = [
  { value: "under_5ft", label: "Under 5'0\" (152 cm)" },
  { value: "5ft_5ft3", label: "5'0\" - 5'3\" (152-160 cm)" },
  { value: "5ft4_5ft6", label: "5'4\" - 5'6\" (163-168 cm)" },
  { value: "5ft7_5ft9", label: "5'7\" - 5'9\" (170-175 cm)" },
  { value: "5ft10_6ft", label: "5'10\" - 6'0\" (178-183 cm)" },
  { value: "over_6ft", label: "Over 6'0\" (183+ cm)" },
];

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "OTHER", label: "Other" },
];

const DISTANCE_APPROX_OPTIONS = [
  { value: "same_city", label: "Same City (nearby)" },
  { value: "regional", label: "Same Region (1-2 hrs away)" },
  { value: "far", label: "Far (2-4 hrs away)" },
  { value: "long_distance", label: "Long Distance (different region/country)" },
];

const SCHEDULE_OPTIONS = [
  { value: "remote_flexible", label: "Remote / Fully Flexible" },
  { value: "hybrid", label: "Hybrid" },
  { value: "office_9_5", label: "Office 9-5" },
  { value: "shift_work", label: "Shift Work" },
  { value: "on_call", label: "On-Call / Variable" },
  { value: "overnight", label: "Overnight / Night Shift" },
  { value: "student", label: "Student" },
  { value: "self_employed", label: "Self-Employed" },
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
  const [activeTab, setActiveTab] = useState("basics");
  const TABS = ["basics", "about", "chemistry"] as const;

  // Basic Info
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [metVia, setMetVia] = useState("");
  const [metApp, setMetApp] = useState("");
  const [status, setStatus] = useState<Enums<"candidate_status">>("just_matched");
  const [notes, setNotes] = useState("");
  const [height, setHeight] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [distanceApprox, setDistanceApprox] = useState("");
  const [theirSchedule, setTheirSchedule] = useState("");

  // About Them
  const [theirReligion, setTheirReligion] = useState("");
  const [theirPolitics, setTheirPolitics] = useState("");
  const [theirRelationshipStatus, setTheirRelationshipStatus] = useState("");
  const [theirRelationshipGoal, setTheirRelationshipGoal] = useState("");
  const [theirKidsDesire, setTheirKidsDesire] = useState("");
  const [theirKidsStatus, setTheirKidsStatus] = useState("");
  const [theirAttachmentStyle, setTheirAttachmentStyle] = useState("");
  const [theirAmbitionLevel, setTheirAmbitionLevel] = useState(3);
  const [theirCareerStage, setTheirCareerStage] = useState("");
  const [theirEducationLevel, setTheirEducationLevel] = useState("");
  const [theirSocialStyle, setTheirSocialStyle] = useState("");
  const [theirDrinking, setTheirDrinking] = useState("");
  const [theirSmoking, setTheirSmoking] = useState("");
  const [theirExercise, setTheirExercise] = useState("");

  // Chemistry
  const [overallChemistry, setOverallChemistry] = useState(3);
  const [physicalAttraction, setPhysicalAttraction] = useState(3);
  const [intellectualConnection, setIntellectualConnection] = useState(3);
  const [humorCompatibility, setHumorCompatibility] = useState(3);
  const [energyMatch, setEnergyMatch] = useState(3);

  // Intimacy
  const [beenIntimate, setBeenIntimate] = useState(false);
  const [firstIntimacyDate, setFirstIntimacyDate] = useState("");

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
        setGenderIdentity(data.gender_identity || "");
        setPronouns(data.pronouns || "");
        setMetVia(data.met_via || "");
        setMetApp(data.met_app || "");
        setStatus(data.status || "just_matched");
        setNotes(data.notes || "");
        setHeight((data as any).height || "");
        setCountry((data as any).country || "");
        setCity((data as any).city || "");
        setDistanceApprox((data as any).distance_approximation || "");
        setTheirSchedule((data as any).their_schedule_flexibility || "");
        setTheirReligion(data.their_religion || "");
        setTheirPolitics(data.their_politics || "");
        setTheirRelationshipStatus((data as any).their_relationship_status || "");
        setTheirRelationshipGoal(data.their_relationship_goal || "");
        setTheirKidsDesire(data.their_kids_desire || "");
        setTheirKidsStatus(data.their_kids_status || "");
        setTheirAttachmentStyle(data.their_attachment_style || "");
        setTheirAmbitionLevel(data.their_ambition_level || 3);
        setTheirCareerStage(data.their_career_stage || "");
        setTheirEducationLevel((data as any).their_education_level || "");
        setTheirSocialStyle((data as any).their_social_style || "");
        setTheirDrinking((data as any).their_drinking || "");
        setTheirSmoking((data as any).their_smoking || "");
        setTheirExercise((data as any).their_exercise || "");
        setOverallChemistry(data.overall_chemistry || 3);
        setPhysicalAttraction(data.physical_attraction || 3);
        setIntellectualConnection(data.intellectual_connection || 3);
        setHumorCompatibility(data.humor_compatibility || 3);
        setEnergyMatch(data.energy_match || 3);
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
      const candidateData: any = {
        nickname: nickname.trim(),
        age: age ? parseInt(age) : null,
        gender_identity: genderIdentity || null,
        pronouns: pronouns || null,
        met_via: metVia || null,
        met_app: metVia === "dating_app" ? metApp : null,
        status,
        notes: notes || null,
        height: height || null,
        country: country || null,
        city: city || null,
        distance_approximation: distanceApprox || null,
        their_schedule_flexibility: theirSchedule || null,
        their_religion: theirReligion || null,
        their_politics: theirPolitics || null,
        their_relationship_status: theirRelationshipStatus || null,
        their_relationship_goal: theirRelationshipGoal || null,
        their_kids_desire: theirKidsDesire || null,
        their_kids_status: theirKidsStatus || null,
        their_attachment_style: theirAttachmentStyle || null,
        their_ambition_level: theirAmbitionLevel,
        their_career_stage: theirCareerStage || null,
        their_education_level: theirEducationLevel || null,
        their_social_style: theirSocialStyle || null,
        their_drinking: theirDrinking || null,
        their_smoking: theirSmoking || null,
        their_exercise: theirExercise || null,
        overall_chemistry: overallChemistry,
        physical_attraction: physicalAttraction,
        intellectual_connection: intellectualConnection,
        humor_compatibility: humorCompatibility,
        energy_match: energyMatch,
        first_intimacy_date: beenIntimate && firstIntimacyDate ? firstIntimacyDate : null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("candidates")
          .update(candidateData)
          .eq("id", editId!)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success(`${nickname} updated!`);
        navigate(`/candidate/${editId}`);
      } else {
        // Check if this is the user's first candidate
        const { count: existingCount } = await supabase
          .from("candidates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        const isFirstCandidate = (existingCount ?? 0) === 0;

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

        if (beenIntimate && firstIntimacyDate) {
          await supabase.from("interactions").insert({
            user_id: user.id,
            candidate_id: data.id,
            interaction_type: "intimate",
            interaction_date: firstIntimacyDate,
            overall_feeling: 4,
          });
        }

        // Auto-calculate compatibility score
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-compatibility`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ candidateId: data.id }),
              }
            );
          }
        } catch (e) {
          console.error("Auto-score failed:", e);
        }

        toast.success(`${nickname} added!`);
        navigate(`/candidate/${data.id}`, { state: { isNewCandidate: true, isFirstCandidate } });
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
          {isEditMode ? <Pencil className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basics" className="gap-1 text-xs">
                <User className="w-3.5 h-3.5" />
                Basics
              </TabsTrigger>
              <TabsTrigger value="about" className="gap-1 text-xs">
                <Brain className="w-3.5 h-3.5" />
                About
              </TabsTrigger>
              <TabsTrigger value="chemistry" className="gap-1 text-xs">
                <Zap className="w-3.5 h-3.5" />
                Chemistry
              </TabsTrigger>
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
                      <Select value={status} onValueChange={(v) => setStatus(v as Enums<"candidate_status">)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="just_matched">Just Matched</SelectItem>
                          <SelectItem value="texting">Texting</SelectItem>
                          <SelectItem value="planning_date">Planning Date</SelectItem>
                          <SelectItem value="dating">Dating</SelectItem>
                          <SelectItem value="dating_casually">Dating Casually</SelectItem>
                          <SelectItem value="getting_serious">Getting Serious</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={genderIdentity} onValueChange={setGenderIdentity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pronouns</Label>
                      <Select value={pronouns} onValueChange={setPronouns}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRONOUN_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Select value={height} onValueChange={setHeight}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {HEIGHT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        placeholder="Their city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Distance</Label>
                      <Select value={distanceApprox} onValueChange={setDistanceApprox}>
                        <SelectTrigger>
                          <SelectValue placeholder="How far?" />
                        </SelectTrigger>
                        <SelectContent>
                          {DISTANCE_APPROX_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Their Schedule</Label>
                      <Select value={theirSchedule} onValueChange={setTheirSchedule}>
                        <SelectTrigger>
                          <SelectValue placeholder="Work style" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHEDULE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Where did you meet?</Label>
                    <Select value={metVia} onValueChange={setMetVia}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MET_VIA_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                            <SelectItem key={app} value={app}>{app}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Anything else you want to remember..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
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
                      <p className="text-xs text-muted-foreground">Helps track oxytocin bonding alerts</p>
                    </div>
                    <Switch checked={beenIntimate} onCheckedChange={setBeenIntimate} />
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
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Values & Beliefs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Religion</Label>
                      <Select value={theirReligion} onValueChange={setTheirReligion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {RELIGION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Politics</Label>
                      <Select value={theirPolitics} onValueChange={setTheirPolitics}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {POLITICS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Relationship Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Their Relationship Status</Label>
                      <Select value={theirRelationshipStatus} onValueChange={setTheirRelationshipStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>What are they looking for?</Label>
                      <Select value={theirRelationshipGoal} onValueChange={setTheirRelationshipGoal}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_GOAL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kids Desire</Label>
                      <Select value={theirKidsDesire} onValueChange={setTheirKidsDesire}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {KIDS_DESIRE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kids Status</Label>
                      <Select value={theirKidsStatus} onValueChange={setTheirKidsStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {KIDS_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Personality & Career</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Attachment Style</Label>
                      <Select value={theirAttachmentStyle} onValueChange={setTheirAttachmentStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ATTACHMENT_STYLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Social Style</Label>
                      <Select value={theirSocialStyle} onValueChange={setTheirSocialStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_STYLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Education</Label>
                      <Select value={theirEducationLevel} onValueChange={setTheirEducationLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Career Stage</Label>
                      <Select value={theirCareerStage} onValueChange={setTheirCareerStage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CAREER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <SliderInput
                    label="Ambition Level"
                    value={theirAmbitionLevel}
                    onChange={setTheirAmbitionLevel}
                    leftLabel="Laid back"
                    rightLabel="Driven"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Lifestyle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Drinking</Label>
                      <Select value={theirDrinking} onValueChange={setTheirDrinking}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LIFESTYLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Smoking</Label>
                      <Select value={theirSmoking} onValueChange={setTheirSmoking}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LIFESTYLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Exercise</Label>
                      <Select value={theirExercise} onValueChange={setTheirExercise}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="..." />
                        </SelectTrigger>
                        <SelectContent>
                          {EXERCISE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chemistry" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Chemistry Ratings
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Rate your chemistry to improve AI compatibility scores</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SliderInput
                    label="Overall Chemistry"
                    value={overallChemistry}
                    onChange={setOverallChemistry}
                    leftLabel="Low"
                    rightLabel="Off the charts"
                  />
                  <SliderInput
                    label="Physical Attraction"
                    value={physicalAttraction}
                    onChange={setPhysicalAttraction}
                    leftLabel="Not my type"
                    rightLabel="Very attracted"
                  />
                  <SliderInput
                    label="Intellectual Connection"
                    value={intellectualConnection}
                    onChange={setIntellectualConnection}
                    leftLabel="Surface level"
                    rightLabel="Deep connection"
                  />
                  <SliderInput
                    label="Humor Compatibility"
                    value={humorCompatibility}
                    onChange={setHumorCompatibility}
                    leftLabel="Different humor"
                    rightLabel="Same wavelength"
                  />
                  <SliderInput
                    label="Energy Match"
                    value={energyMatch}
                    onChange={setEnergyMatch}
                    leftLabel="Mismatched"
                    rightLabel="Perfect match"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="space-y-2 pt-2">
            {isEditMode ? (
              <div className="flex flex-col gap-2">
                {activeTab !== "chemistry" && (
                  <Button 
                    type="button" 
                    className="w-full text-xs h-9" 
                    disabled={loading}
                    onClick={() => {
                      const currentIndex = TABS.indexOf(activeTab as typeof TABS[number]);
                      if (currentIndex < TABS.length - 1) {
                        setActiveTab(TABS[currentIndex + 1]);
                      }
                    }}
                  >
                    Add More Info →
                  </Button>
                )}
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full text-xs h-9" 
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Saving..." : <><UserPlus className="w-5 h-5 mr-2" />Add Candidate</>}
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground">
              <Sparkles className="w-3 h-3 inline mr-1" />
              {isEditMode ? "More details = better compatibility insights" : "More details = better AI compatibility analysis"}
            </p>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddCandidate;
