import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { ArrowLeft, UserPlus, Sparkles, Heart, Pencil, User, Brain, Zap, Home, Clock, Layers, ArrowRight, Mic, X, Video, Camera, MessageCircle, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SliderInput } from "@/components/onboarding/SliderInput";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeLimitDialog } from "@/components/subscription/UpgradeLimitDialog";
import { SmartFillForm, ExtractedCandidate } from "@/components/candidate/SmartFillForm";

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
  { value: "man_cis", label: "Man" },
  { value: "woman_cis", label: "Woman" },
  { value: "non_binary", label: "Non-Binary" },
  { value: "gender_fluid", label: "Gender Fluid" },
  { value: "self_describe", label: "Other" },
  { value: "man_trans", label: "Man (Trans)" },
  { value: "woman_trans", label: "Woman (Trans)" },
];

const PRONOUN_OPTIONS: { value: Enums<"pronouns">; label: string }[] = [
  { value: "he_him", label: "He/Him" },
  { value: "she_her", label: "She/Her" },
  { value: "they_them", label: "They/Them" },
  { value: "other", label: "Other" },
];

const RELIGION_OPTIONS: { value: Enums<"religion"> | "unknown"; label: string }[] = [
  { value: "unknown", label: "I don't know" },
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

const POLITICS_OPTIONS: { value: Enums<"politics"> | "unknown"; label: string }[] = [
  { value: "unknown", label: "I don't know" },
  { value: "progressive", label: "Progressive" },
  { value: "liberal", label: "Liberal" },
  { value: "moderate", label: "Moderate" },
  { value: "conservative", label: "Conservative" },
  { value: "traditional", label: "Traditional" },
];

const RELATIONSHIP_GOAL_OPTIONS: { value: Enums<"relationship_goal"> | "unknown"; label: string }[] = [
  { value: "unknown", label: "I don't know" },
  { value: "casual", label: "Casual" },
  { value: "situationship", label: "Situationship" },
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Serious Relationship" },
  { value: "marriage", label: "Marriage" },
  { value: "unsure", label: "Unsure" },
];

const USER_GOAL_OPTIONS = [
  { value: "casual", label: "Casual / Fun" },
  { value: "situationship", label: "Situationship" },
  { value: "dating", label: "Dating / Getting to Know" },
  { value: "serious", label: "Serious Relationship" },
  { value: "marriage", label: "Long-term / Marriage" },
  { value: "unsure", label: "Still Figuring It Out" },
];

const RELATIONSHIP_STATUS_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "recently_divorced", label: "Recently Divorced" },
  { value: "ethical_non_monogamy", label: "Ethical Non-Monogamy" },
];

const KIDS_DESIRE_OPTIONS: { value: Enums<"kids_desire"> | "unknown"; label: string }[] = [
  { value: "unknown", label: "I don't know" },
  { value: "definitely_yes", label: "Wants Kids" },
  { value: "maybe", label: "Maybe/Open" },
  { value: "definitely_no", label: "Doesn't Want Kids" },
  { value: "already_have", label: "Already Has Kids" },
];

const KIDS_STATUS_OPTIONS: { value: Enums<"kids_status"> | "unknown"; label: string }[] = [
  { value: "unknown", label: "I don't know" },
  { value: "no_kids", label: "No Kids" },
  { value: "has_young_kids", label: "Has Young Kids" },
  { value: "has_adult_kids", label: "Has Adult Kids" },
];

const ATTACHMENT_STYLE_OPTIONS: { value: Enums<"attachment_style"> | "unknown"; label: string }[] = [
  { value: "unknown", label: "I don't know" },
  { value: "secure", label: "Secure" },
  { value: "anxious", label: "Anxious" },
  { value: "avoidant", label: "Avoidant" },
  { value: "disorganized", label: "Disorganized" },
];

const EDUCATION_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "high_school", label: "High School" },
  { value: "some_college", label: "Some College" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate/PhD" },
  { value: "trade_school", label: "Trade School" },
];

const SOCIAL_STYLE_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "homebody", label: "Homebody" },
  { value: "social_butterfly", label: "Social Butterfly" },
  { value: "balanced", label: "Balanced" },
  { value: "mood_dependent", label: "Depends on Mood" },
];

const LIFESTYLE_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "socially", label: "Socially" },
  { value: "regularly", label: "Regularly" },
];

const EXERCISE_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "Sometimes" },
  { value: "regularly", label: "Regularly" },
  { value: "daily", label: "Daily" },
];

const CAREER_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "student", label: "Student" },
  { value: "entry_level", label: "Entry Level" },
  { value: "mid_career", label: "Mid-Career" },
  { value: "senior", label: "Senior/Manager" },
  { value: "executive", label: "Executive" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "creative", label: "Creative/Content Creator" },
  { value: "athlete", label: "Professional Athlete" },
  { value: "freelance", label: "Freelance" },
  { value: "between_jobs", label: "Between Jobs" },
];

const HEIGHT_OPTIONS = [
  { value: "unknown", label: "I don't know" },
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
  { value: "unknown", label: "I don't know" },
  { value: "remote_flexible", label: "Remote / Fully Flexible" },
  { value: "hybrid", label: "Hybrid" },
  { value: "office_9_5", label: "Office 9-5" },
  { value: "shift_work", label: "Shift Work" },
  { value: "on_call", label: "On-Call / Variable" },
  { value: "overnight", label: "Overnight / Night Shift" },
  { value: "frequent_traveler", label: "Frequent Traveler" },
  { value: "student", label: "Student" },
  { value: "self_employed", label: "Self-Employed" },
];

const THEIR_PARENT_STATUS_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "married_together", label: "Married Together" },
  { value: "unmarried_together", label: "Unmarried Together" },
  { value: "divorced", label: "Divorced" },
  { value: "separated", label: "Separated" },
  { value: "single_parent", label: "Single Parent" },
  { value: "adopted", label: "Adopted" },
  { value: "orphan_system", label: "Orphan/System" },
  { value: "other_guardians", label: "Other Guardians" },
];

const THEIR_PARENT_PRESENCE_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "deceased", label: "Deceased" },
];

const THEIR_PARENTS_RELATIONSHIP_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "together_healthy", label: "Together & Healthy" },
  { value: "together_unhealthy", label: "Together but Unhealthy" },
  { value: "divorced_amicable", label: "Divorced (Amicable)" },
  { value: "divorced_contentious", label: "Divorced (Contentious)" },
  { value: "single_parent", label: "Single Parent" },
];

const THEIR_FELT_LOVED_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "yes_consistently", label: "Yes, Consistently" },
  { value: "sometimes", label: "Sometimes" },
  { value: "rarely", label: "Rarely" },
  { value: "no", label: "No" },
];

const THEIR_FAMILY_STABILITY_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "very_stable", label: "Very Stable" },
  { value: "mostly_stable", label: "Mostly Stable" },
  { value: "some_instability", label: "Some Instability" },
  { value: "frequent_chaos", label: "Frequent Chaos" },
];

const ZODIAC_OPTIONS = [
  { value: "unknown", label: "I don't know" },
  { value: "aries", label: "♈ Aries" },
  { value: "taurus", label: "♉ Taurus" },
  { value: "gemini", label: "♊ Gemini" },
  { value: "cancer", label: "♋ Cancer" },
  { value: "leo", label: "♌ Leo" },
  { value: "virgo", label: "♍ Virgo" },
  { value: "libra", label: "♎ Libra" },
  { value: "scorpio", label: "♏ Scorpio" },
  { value: "sagittarius", label: "♐ Sagittarius" },
  { value: "capricorn", label: "♑ Capricorn" },
  { value: "aquarius", label: "♒ Aquarius" },
  { value: "pisces", label: "♓ Pisces" },
];

type Candidate = Tables<"candidates">;

const AddCandidate = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const initialMode = searchParams.get("mode");
  const isEditMode = !!editId;
  const { canAddCandidate, subscription } = useSubscription();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingCandidate, setFetchingCandidate] = useState(isEditMode);
  const [activeTab, setActiveTab] = useState("basics");
  const [candidateMode, setCandidateMode] = useState<"quick" | "full" | "smart" | null>(isEditMode ? "full" : initialMode === "smart" ? "smart" : null);
  const [smartFillApplied, setSmartFillApplied] = useState(false);
  const [zodiacModeEnabled, setZodiacModeEnabled] = useState(false);
  const [showSmartFillTip, setShowSmartFillTip] = useState(false);
const TABS = ["basics", "about", "family", "history", "chemistry"] as const;

interface TheirPastRelationship {
  id: string;
  label: string;
  duration: string;
  endReason: string;
  issues: string[];
  notes: string;
}

const THEIR_RELATIONSHIP_DURATION_OPTIONS = [
  { value: "less_than_6_months", label: "Less than 6 months" },
  { value: "6_months_to_1_year", label: "6 months to 1 year" },
  { value: "1_to_2_years", label: "1-2 years" },
  { value: "2_to_5_years", label: "2-5 years" },
  { value: "5_plus_years", label: "5+ years" },
];

const THEIR_END_REASON_OPTIONS = [
  { value: "mutual", label: "Mutual decision" },
  { value: "they_ended_it", label: "They ended it" },
  { value: "partner_ended_it", label: "Partner ended it" },
  { value: "cheating_them", label: "They cheated" },
  { value: "cheating_partner", label: "Partner cheated" },
  { value: "distance", label: "Distance/logistics" },
  { value: "timing", label: "Bad timing" },
  { value: "toxic", label: "Toxic/unhealthy" },
  { value: "other", label: "Other" },
];

const THEIR_ISSUE_OPTIONS = [
  { value: "commitment_issues", label: "Commitment issues" },
  { value: "communication", label: "Communication problems" },
  { value: "trust_issues", label: "Trust issues" },
  { value: "jealousy", label: "Jealousy" },
  { value: "infidelity", label: "Infidelity" },
  { value: "emotional_unavailability", label: "Emotionally unavailable" },
  { value: "controlling", label: "Controlling behavior" },
  { value: "manipulation", label: "Manipulation" },
  { value: "anger_issues", label: "Anger issues" },
  { value: "addiction", label: "Addiction" },
  { value: "financial", label: "Financial issues" },
  { value: "intimacy", label: "Intimacy issues" },
];

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
  const [zodiacSign, setZodiacSign] = useState("");

  // About Them
  const [theirReligion, setTheirReligion] = useState("");
  const [theirPolitics, setTheirPolitics] = useState("");
  const [theirRelationshipStatus, setTheirRelationshipStatus] = useState("");
  const [userGoalForCandidate, setUserGoalForCandidate] = useState("");
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

  // Family & Upbringing
  const [theirParentStatus, setTheirParentStatus] = useState("");
  const [theirMotherStatus, setTheirMotherStatus] = useState("");
  const [theirFatherStatus, setTheirFatherStatus] = useState("");
  const [theirSiblings, setTheirSiblings] = useState("");
  const [theirParentsRelationship, setTheirParentsRelationship] = useState("");
  const [theirFeltLovedAsChild, setTheirFeltLovedAsChild] = useState("");
  const [theirFamilyStability, setTheirFamilyStability] = useState("");
  const [theirHealthyRelationshipModels, setTheirHealthyRelationshipModels] = useState<boolean | null>(null);
  const [theirFamilyNotes, setTheirFamilyNotes] = useState("");

  // Past Relationships
  const [theirPastRelationships, setTheirPastRelationships] = useState<TheirPastRelationship[]>([]);
  const [theirRelationshipNotes, setTheirRelationshipNotes] = useState("");

  // Intimacy
  const [beenIntimate, setBeenIntimate] = useState(false);
  const [firstIntimacyDate, setFirstIntimacyDate] = useState("");

  const createEmptyTheirRelationship = (): TheirPastRelationship => ({
    id: crypto.randomUUID(),
    label: "",
    duration: "",
    endReason: "",
    issues: [],
    notes: "",
  });

  const addTheirRelationship = () => {
    setTheirPastRelationships([...theirPastRelationships, createEmptyTheirRelationship()]);
  };

  const removeTheirRelationship = (id: string) => {
    setTheirPastRelationships(theirPastRelationships.filter(r => r.id !== id));
  };

  const updateTheirRelationship = (id: string, field: keyof TheirPastRelationship, value: any) => {
    setTheirPastRelationships(theirPastRelationships.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const toggleTheirIssue = (relationshipId: string, issue: string) => {
    setTheirPastRelationships(theirPastRelationships.map(r => {
      if (r.id !== relationshipId) return r;
      const issues = r.issues.includes(issue)
        ? r.issues.filter(i => i !== issue)
        : [...r.issues, issue];
      return { ...r, issues };
    }));
  };

  const handleSmartFillExtracted = (data: ExtractedCandidate) => {
    if (data.nickname) setNickname(data.nickname);
    if (data.age) setAge(data.age.toString());
    if (data.gender_identity) setGenderIdentity(data.gender_identity);
    if (data.pronouns) setPronouns(data.pronouns);
    if (data.met_via) setMetVia(data.met_via);
    if (data.met_app) setMetApp(data.met_app);
    if (data.height) setHeight(data.height);
    if (data.country) setCountry(data.country);
    if (data.city) setCity(data.city);
    if (data.distance_approximation) setDistanceApprox(data.distance_approximation);
    if (data.their_religion) setTheirReligion(data.their_religion);
    if (data.their_politics) setTheirPolitics(data.their_politics);
    if (data.their_relationship_status) setTheirRelationshipStatus(data.their_relationship_status);
    if (data.their_relationship_goal) setTheirRelationshipGoal(data.their_relationship_goal);
    if (data.their_kids_desire) setTheirKidsDesire(data.their_kids_desire);
    if (data.their_kids_status) setTheirKidsStatus(data.their_kids_status);
    if (data.their_attachment_style) setTheirAttachmentStyle(data.their_attachment_style);
    if (data.their_career_stage) setTheirCareerStage(data.their_career_stage);
    if (data.their_education_level) setTheirEducationLevel(data.their_education_level);
    if (data.their_social_style) setTheirSocialStyle(data.their_social_style);
    if (data.their_drinking) setTheirDrinking(data.their_drinking);
    if (data.their_smoking) setTheirSmoking(data.their_smoking);
    if (data.their_exercise) setTheirExercise(data.their_exercise);
    if (data.their_schedule_flexibility) setTheirSchedule(data.their_schedule_flexibility);
    if (data.zodiac_sign) setZodiacSign(data.zodiac_sign);
    if (data.their_parent_status) setTheirParentStatus(data.their_parent_status);
    if (data.their_mother_status) setTheirMotherStatus(data.their_mother_status);
    if (data.their_father_status) setTheirFatherStatus(data.their_father_status);
    if (data.their_siblings !== undefined) setTheirSiblings(data.their_siblings.toString());
    if (data.their_parents_relationship) setTheirParentsRelationship(data.their_parents_relationship);
    if (data.their_felt_loved_as_child) setTheirFeltLovedAsChild(data.their_felt_loved_as_child);
    if (data.their_family_stability) setTheirFamilyStability(data.their_family_stability);
    if (data.their_healthy_relationship_models !== undefined) setTheirHealthyRelationshipModels(data.their_healthy_relationship_models);
    if (data.their_family_notes) setTheirFamilyNotes(data.their_family_notes);
    if (data.their_relationship_notes) setTheirRelationshipNotes(data.their_relationship_notes);
    if (data.notes) setNotes(data.notes);
    if (data.their_ambition_level) setTheirAmbitionLevel(data.their_ambition_level);
    if (data.overall_chemistry) setOverallChemistry(data.overall_chemistry);
    if (data.physical_attraction) setPhysicalAttraction(data.physical_attraction);
    if (data.intellectual_connection) setIntellectualConnection(data.intellectual_connection);
    if (data.humor_compatibility) setHumorCompatibility(data.humor_compatibility);
    if (data.energy_match) setEnergyMatch(data.energy_match);
    setSmartFillApplied(true);
    setCandidateMode("full");
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("zodiac_mode_enabled")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setZodiacModeEnabled(data.zodiac_mode_enabled ?? false);
      }
    };
    fetchUserProfile();
  }, [user]);

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
        setZodiacSign((data as any).zodiac_sign || "");
        setTheirReligion(data.their_religion || "");
        setTheirPolitics(data.their_politics || "");
        setTheirRelationshipStatus((data as any).their_relationship_status || "");
        setTheirRelationshipGoal(data.their_relationship_goal || "");
        setUserGoalForCandidate((data as any).user_goal_for_candidate || "");
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
        // Family & Upbringing
        setTheirParentStatus((data as any).their_parent_status || "");
        setTheirMotherStatus((data as any).their_mother_status || "");
        setTheirFatherStatus((data as any).their_father_status || "");
        setTheirSiblings((data as any).their_siblings?.toString() || "");
        setTheirParentsRelationship((data as any).their_parents_relationship || "");
        setTheirFeltLovedAsChild((data as any).their_felt_loved_as_child || "");
        setTheirFamilyStability((data as any).their_family_stability || "");
        setTheirHealthyRelationshipModels((data as any).their_healthy_relationship_models ?? null);
        setTheirFamilyNotes((data as any).their_family_notes || "");
        // Past Relationships
        if ((data as any).their_past_relationships) {
          setTheirPastRelationships((data as any).their_past_relationships as TheirPastRelationship[]);
        }
        setTheirRelationshipNotes((data as any).their_relationship_notes || "");
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

    if (!isEditMode && !canAddCandidate()) {
      setShowUpgradeDialog(true);
      return;
    }

    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    if (age && parseInt(age) < 18) {
      toast.error("Age must be older than 18");
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
        their_schedule_flexibility: theirSchedule && theirSchedule !== "unknown" ? theirSchedule : null,
        zodiac_sign: zodiacSign && zodiacSign !== "unknown" ? zodiacSign : null,
        their_religion: theirReligion && theirReligion !== "unknown" ? theirReligion : null,
        their_politics: theirPolitics && theirPolitics !== "unknown" ? theirPolitics : null,
        their_relationship_status: theirRelationshipStatus && theirRelationshipStatus !== "unknown" ? theirRelationshipStatus : null,
        their_relationship_goal: theirRelationshipGoal && theirRelationshipGoal !== "unknown" ? theirRelationshipGoal : null,
        user_goal_for_candidate: userGoalForCandidate || null,
        their_kids_desire: theirKidsDesire && theirKidsDesire !== "unknown" ? theirKidsDesire : null,
        their_kids_status: theirKidsStatus && theirKidsStatus !== "unknown" ? theirKidsStatus : null,
        their_attachment_style: theirAttachmentStyle && theirAttachmentStyle !== "unknown" ? theirAttachmentStyle : null,
        their_ambition_level: theirAmbitionLevel,
        their_career_stage: theirCareerStage && theirCareerStage !== "unknown" ? theirCareerStage : null,
        their_education_level: theirEducationLevel && theirEducationLevel !== "unknown" ? theirEducationLevel : null,
        their_social_style: theirSocialStyle && theirSocialStyle !== "unknown" ? theirSocialStyle : null,
        their_drinking: theirDrinking && theirDrinking !== "unknown" ? theirDrinking : null,
        their_smoking: theirSmoking && theirSmoking !== "unknown" ? theirSmoking : null,
        their_exercise: theirExercise && theirExercise !== "unknown" ? theirExercise : null,
        overall_chemistry: overallChemistry,
        physical_attraction: physicalAttraction,
        intellectual_connection: intellectualConnection,
        humor_compatibility: humorCompatibility,
        energy_match: energyMatch,
        first_intimacy_date: beenIntimate && firstIntimacyDate ? firstIntimacyDate : null,
        // Family & Upbringing
        their_parent_status: theirParentStatus && theirParentStatus !== "unknown" ? theirParentStatus : null,
        their_mother_status: theirMotherStatus && theirMotherStatus !== "unknown" ? theirMotherStatus : null,
        their_father_status: theirFatherStatus && theirFatherStatus !== "unknown" ? theirFatherStatus : null,
        their_siblings: theirSiblings ? parseInt(theirSiblings) : null,
        their_parents_relationship: theirParentsRelationship && theirParentsRelationship !== "unknown" ? theirParentsRelationship : null,
        their_felt_loved_as_child: theirFeltLovedAsChild && theirFeltLovedAsChild !== "unknown" ? theirFeltLovedAsChild : null,
        their_family_stability: theirFamilyStability && theirFamilyStability !== "unknown" ? theirFamilyStability : null,
        their_healthy_relationship_models: theirHealthyRelationshipModels,
        their_family_notes: theirFamilyNotes || null,
        // Past Relationships
        their_past_relationships: theirPastRelationships.length > 0 ? theirPastRelationships : null,
        their_relationship_notes: theirRelationshipNotes || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("candidates")
          .update(candidateData)
          .eq("id", editId!)
          .eq("user_id", user.id);

        if (error) throw error;

        // Auto-recalculate compatibility score after edit
        try {
          await supabase.functions.invoke("calculate-compatibility", {
            body: { candidateId: editId },
          });
        } catch (e) {
          console.error("Auto-rescore failed:", e);
        }

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
          toast.loading("Calculating compatibility score...", { id: "compat-score" });
          const { data: scoreData, error: scoreError } = await supabase.functions.invoke("calculate-compatibility", {
            body: { candidateId: data.id },
          });
          if (scoreError) {
            console.error("Auto-score error:", scoreError);
            toast.dismiss("compat-score");
          } else {
            const score = scoreData?.compatibility_score ?? scoreData?.score;
            if (score != null) {
              toast.success(`${nickname} scored ${score}% compatibility!`, { id: "compat-score" });
            } else {
              toast.dismiss("compat-score");
            }
          }
        } catch (e) {
          console.error("Auto-score failed:", e);
          toast.dismiss("compat-score");
        }

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
    <div className="min-h-screen bg-background pb-[calc(env(safe-area-inset-bottom)+10rem)]">
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b border-border/30 z-10">
        <div className="container mx-auto px-4 py-3 max-w-lg flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => {
            if (candidateMode && !isEditMode) {
              setCandidateMode(null);
            } else if (isEditMode) {
              navigate(`/candidate/${editId}`);
            } else {
              navigate(-1);
            }
          }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">
              {isEditMode ? "Edit Candidate" : candidateMode === "quick" ? "Quick Add" : candidateMode === "full" ? "Full Profile" : "Add New Candidate"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditMode ? "Update their info" : candidateMode === "quick" ? "Get a score in 30 seconds" : candidateMode === "full" ? "For more accurate AI insights" : "Start tracking someone new"}
            </p>
          </div>
          {isEditMode ? <Pencil className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Mode Selection */}
        {!candidateMode && !isEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.15 }}
                className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3"
              >
                <Sparkles className="w-7 h-7 text-primary" />
              </motion.div>
              <h2 className="text-xl font-semibold mb-1">How much do you know?</h2>
              <p className="text-sm text-muted-foreground">More details = more accurate AI scoring</p>
            </motion.div>

            {/* Smart Fill Tip Banner */}
            <AnimatePresence>
              {!showSmartFillTip && (
                <motion.button
                  type="button"
                  onClick={() => setShowSmartFillTip(true)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: 0.15 }}
                  className="w-full p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-left hover:bg-primary/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">💡 Tip: Let D.E.V.I. fill in the profile for you</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload screenshots, screen recordings, or just talk — tap to learn more</p>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Smart Fill Tip Expanded */}
            <AnimatePresence>
              {showSmartFillTip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl border border-primary/20 bg-card shadow-lg overflow-hidden"
                >
                  <div className="p-4 bg-[image:var(--gradient-hero)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-white" />
                      <h3 className="font-semibold text-white text-sm">How to add a candidate fast</h3>
                    </div>
                    <button onClick={() => setShowSmartFillTip(false)} className="text-white/70 hover:text-white p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Someone new?</p>
                        <p className="text-xs text-muted-foreground">Screen record their dating profile (Hinge, Bumble, etc.) and upload it — D.E.V.I. will extract their details automatically</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Already talking?</p>
                        <p className="text-xs text-muted-foreground">Upload screenshots or screen recordings of your DMs and conversations — D.E.V.I. will analyze them and build the profile</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Just tell D.E.V.I.</p>
                        <p className="text-xs text-muted-foreground">Tell D.E.V.I. their name, how you met, and anything you know — type it out or use voice</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowSmartFillTip(false);
                        if (!canAddCandidate()) { setShowUpgradeDialog(true); return; }
                        setCandidateMode("smart");
                      }}
                      className="w-full gap-2 rounded-xl bg-[image:var(--gradient-hero)]"
                    >
                      <Mic className="w-4 h-4" />
                      Tell D.E.V.I. Everything
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>



            {/* Full Profile Option - Recommended */}
            <motion.button
              type="button"
              onClick={() => { if (!canAddCandidate()) { setShowUpgradeDialog(true); return; } setCandidateMode("full"); }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 rounded-xl bg-[image:var(--gradient-hero)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Full Profile</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-medium">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">
                    Most accurate compatibility score & personalized advice
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white transition-colors shrink-0 mt-3" />
              </div>
            </motion.button>

            {/* Quick Add Option */}
            <motion.button
              type="button"
              onClick={() => { if (!canAddCandidate()) { setShowUpgradeDialog(true); return; } setCandidateMode("quick"); }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 rounded-xl border-2 border-border/40 bg-card hover:border-primary/30 transition-colors group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Quick Add</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      30 sec
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Just the basics—get a quick score now, refine later
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-3" />
              </div>
            </motion.button>

            {/* Smart Fill Option */}
            <motion.button
              type="button"
              onClick={() => { if (!canAddCandidate()) { setShowUpgradeDialog(true); return; } setCandidateMode("smart"); }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mic className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Tell D.E.V.I. Everything</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      AI ✨
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Talk or type — we'll fill in the profile for you
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-3" />
              </div>
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-[10px] text-muted-foreground text-center pt-2"
            >
              You can always add more details later
            </motion.p>
          </motion.div>
        )}

        {/* Smart Fill Mode */}
        {candidateMode === "smart" && (
          <SmartFillForm
            onExtracted={handleSmartFillExtracted}
            onSwitchToManual={() => setCandidateMode("full")}
          />
        )}

        {/* Quick Add Form */}
        {candidateMode === "quick" && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Quick Add
                </CardTitle>
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
                    autoFocus
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
                        <SelectItem value="dating_casually">Dating Casually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Select value={height} onValueChange={setHeight}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select height" />
                      </SelectTrigger>
                      <SelectContent>
                        {HEIGHT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship Status</Label>
                    <Select value={theirRelationshipStatus} onValueChange={setTheirRelationshipStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Profession</Label>
                    <Select value={theirCareerStage} onValueChange={setTheirCareerStage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Career stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAREER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Looking For</Label>
                    <Select value={theirRelationshipGoal} onValueChange={setTheirRelationshipGoal}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_GOAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your goal for them</Label>
                  <Select value={userGoalForCandidate} onValueChange={setUserGoalForCandidate}>
                    <SelectTrigger>
                      <SelectValue placeholder="What are you looking for?" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_GOAL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ambition: {theirAmbitionLevel}/5</Label>
                    <SliderInput
                      label=""
                      value={theirAmbitionLevel}
                      onChange={setTheirAmbitionLevel}
                      min={1}
                      max={5}
                      showValue={false}
                      className="space-y-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Attraction: {physicalAttraction}/5</Label>
                    <SliderInput
                      label=""
                      value={physicalAttraction}
                      onChange={setPhysicalAttraction}
                      min={1}
                      max={5}
                      showValue={false}
                      className="space-y-0"
                    />
                  </div>
                </div>

                {/* Zodiac Sign - Only show when zodiac mode is enabled */}
                {zodiacModeEnabled && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="flex items-center gap-2">
                      <span>✨</span> Their Zodiac Sign
                      <span className="text-xs text-muted-foreground">(Entertainment only)</span>
                    </Label>
                    <Select value={zodiacSign} onValueChange={setZodiacSign}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sign" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZODIAC_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                type="submit"
                className="w-full py-6 rounded-xl bg-[image:var(--gradient-hero)] hover:opacity-90 shadow-[var(--shadow-soft)] h-12 text-base font-semibold"
                disabled={loading || !nickname.trim()}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Calculating score...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Get Score
                    <motion.span animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                      <Sparkles className="w-4 h-4" />
                    </motion.span>
                  </span>
                )}
              </Button>
            </motion.div>

            <p className="text-center text-xs text-muted-foreground">
              Want more accurate scoring?{" "}
              <button
                type="button"
                onClick={() => setCandidateMode("full")}
                className="text-primary font-semibold hover:underline"
              >
                Add full profile instead
              </button>
            </p>
          </motion.form>
        )}

        {/* Full Form */}
        {candidateMode === "full" && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basics" className="gap-1 text-xs px-1">
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Basics</span>
                </TabsTrigger>
                <TabsTrigger value="about" className="gap-1 text-xs px-1">
                  <Brain className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">About</span>
                </TabsTrigger>
                <TabsTrigger value="family" className="gap-1 text-xs px-1">
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Family</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-1 text-xs px-1">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
                <TabsTrigger value="chemistry" className="gap-1 text-xs px-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chemistry</span>
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
                        onInvalid={(e) => {
                          e.currentTarget.setCustomValidity("Age must be older than 18");
                        }}
                        onInput={(e) => {
                          e.currentTarget.setCustomValidity("");
                        }}
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
                          <SelectItem value="dating_casually">Dating Casually</SelectItem>
                          <SelectItem value="getting_serious">Getting Serious</SelectItem>
                          <SelectItem value="serious_relationship">Serious Relationship</SelectItem>
                          <SelectItem value="dating">Situationship</SelectItem>
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

                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label>Zodiac Sign</Label>
                      <Select value={zodiacSign} onValueChange={setZodiacSign}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ZODIAC_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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

                  <div className="space-y-2">
                    <Label>Your goal for them</Label>
                    <Select value={userGoalForCandidate} onValueChange={setUserGoalForCandidate}>
                      <SelectTrigger>
                        <SelectValue placeholder="What are you looking for?" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_GOAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

            <TabsContent value="family" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    Family & Upbringing
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Understanding their background helps identify compatibility</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parents' Status</Label>
                      <Select value={theirParentStatus} onValueChange={setTheirParentStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {THEIR_PARENT_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Siblings</Label>
                      <Input
                        type="number"
                        placeholder="How many?"
                        value={theirSiblings}
                        onChange={(e) => setTheirSiblings(e.target.value)}
                        min={0}
                        max={20}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mother</Label>
                      <Select value={theirMotherStatus} onValueChange={setTheirMotherStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {THEIR_PARENT_PRESENCE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Father</Label>
                      <Select value={theirFatherStatus} onValueChange={setTheirFatherStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {THEIR_PARENT_PRESENCE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parents' Relationship</Label>
                      <Select value={theirParentsRelationship} onValueChange={setTheirParentsRelationship}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {THEIR_PARENTS_RELATIONSHIP_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Family Stability</Label>
                      <Select value={theirFamilyStability} onValueChange={setTheirFamilyStability}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {THEIR_FAMILY_STABILITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Felt Loved as Child?</Label>
                    <Select value={theirFeltLovedAsChild} onValueChange={setTheirFeltLovedAsChild}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {THEIR_FELT_LOVED_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-sm">Healthy Relationship Role Models?</Label>
                      <p className="text-xs text-muted-foreground">Did they see healthy relationships growing up?</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={theirHealthyRelationshipModels === true ? "default" : "outline"}
                        onClick={() => setTheirHealthyRelationshipModels(true)}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={theirHealthyRelationshipModels === false ? "default" : "outline"}
                        onClick={() => setTheirHealthyRelationshipModels(false)}
                      >
                        No
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={theirHealthyRelationshipModels === null ? "secondary" : "outline"}
                        onClick={() => setTheirHealthyRelationshipModels(null)}
                      >
                        ?
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Family Notes</Label>
                    <Textarea
                      placeholder="Any other details about their family background..."
                      value={theirFamilyNotes}
                      onChange={(e) => setTheirFamilyNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Past Relationships
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">What you know about their relationship history</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {theirPastRelationships.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">No past relationships added yet</p>
                      <Button type="button" variant="outline" onClick={addTheirRelationship}>
                        + Add Past Relationship
                      </Button>
                    </div>
                  ) : (
                    <>
                      {theirPastRelationships.map((relationship, index) => (
                        <div key={relationship.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">Relationship {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeTheirRelationship(relationship.id)}
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Label (e.g., "College ex")</Label>
                            <Input
                              placeholder="How they refer to this person..."
                              value={relationship.label}
                              onChange={(e) => updateTheirRelationship(relationship.id, 'label', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Duration</Label>
                              <Select
                                value={relationship.duration}
                                onValueChange={(v) => updateTheirRelationship(relationship.id, 'duration', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {THEIR_RELATIONSHIP_DURATION_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">How it ended</Label>
                              <Select
                                value={relationship.endReason}
                                onValueChange={(v) => updateTheirRelationship(relationship.id, 'endReason', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {THEIR_END_REASON_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Issues/Patterns (select all that apply)</Label>
                            <div className="flex flex-wrap gap-2">
                              {THEIR_ISSUE_OPTIONS.map((issue) => (
                                <Button
                                  key={issue.value}
                                  type="button"
                                  variant={relationship.issues.includes(issue.value) ? "default" : "outline"}
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => toggleTheirIssue(relationship.id, issue.value)}
                                >
                                  {issue.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Notes</Label>
                            <Textarea
                              placeholder="Any other details about this relationship..."
                              value={relationship.notes}
                              onChange={(e) => updateTheirRelationship(relationship.id, 'notes', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}

                      <Button type="button" variant="outline" className="w-full" onClick={addTheirRelationship}>
                        + Add Another Relationship
                      </Button>
                    </>
                  )}

                  <div className="space-y-2 pt-4 border-t">
                    <Label>General Notes on Their Relationship History</Label>
                    <Textarea
                      placeholder="Any general patterns or things you've noticed about their past relationships..."
                      value={theirRelationshipNotes}
                      onChange={(e) => setTheirRelationshipNotes(e.target.value)}
                      rows={3}
                    />
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
                <Button
                  type="submit"
                  className="w-full rounded-xl h-12 text-base font-semibold bg-[image:var(--gradient-primary)] hover:opacity-90 shadow-[var(--shadow-soft)]"
                  size="lg"
                  disabled={loading || !nickname.trim()}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                {activeTab !== "chemistry" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 text-sm"
                    disabled={loading}
                    onClick={() => {
                      const currentIndex = TABS.indexOf(activeTab as typeof TABS[number]);
                      if (currentIndex < TABS.length - 1) {
                        setActiveTab(TABS[currentIndex + 1]);
                      }
                    }}
                  >
                    Next Section →
                  </Button>
                )}
              </div>
            ) : (
              <Button
                type="submit"
                className="w-full rounded-xl h-12 text-base font-semibold bg-[image:var(--gradient-primary)] hover:opacity-90 shadow-[var(--shadow-soft)]"
                size="lg"
                disabled={loading}
              >
                {loading ? "Saving..." : <><UserPlus className="w-5 h-5 mr-2" />Add Candidate</>}
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground">
              <Sparkles className="w-3 h-3 inline mr-1" />
              {isEditMode ? "More details = better compatibility insights" : "More details = better AI compatibility analysis"}
            </p>
          </div>
          </motion.form>
        )}
      </main>
      <UpgradeLimitDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        limitType="candidates"
        currentPlan={subscription?.plan}
      />
    </div>
  );
};

export default AddCandidate;
