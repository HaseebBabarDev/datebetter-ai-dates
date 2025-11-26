import React from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Sparkles } from "lucide-react";

const CompletionScreen = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const { user } = useAuth();
  const [saving, setSaving] = React.useState(false);

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const { error } = await supabase.from("profiles").update({
        name: data.name,
        birth_date: data.birthDate,
        country: data.country,
        city: data.city,
        state: data.state,
        gender_identity: data.genderIdentity as any,
        pronouns: data.pronouns as any,
        sexual_orientation: data.sexualOrientation as any,
        relationship_goal: data.relationshipGoal as any,
        relationship_structure: data.relationshipStructure as any,
        kids_status: data.kidsStatus as any,
        kids_desire: data.kidsDesire as any,
        religion: data.religion as any,
        politics: data.politics as any,
        attachment_style: data.attachmentStyle as any,
        communication_style: data.communicationStyle as any,
        social_style: data.socialStyle as any,
        track_cycle: data.trackCycle,
        height: data.height,
        body_type: data.bodyType,
        activity_level: data.activityLevel,
        education_level: data.educationLevel,
        schedule_flexibility: data.scheduleFlexibility,
        onboarding_completed: true,
        onboarding_step: 15,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Profile saved! Welcome to dateBetter 💜" });
      navigate("/dashboard");
    } catch (e) {
      toast({ title: "Error saving profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-very-light to-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-success-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2">You're All Set!</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">Your personalized dating assistant is ready to help you find better matches.</p>
      <div className="space-y-4 w-full max-w-xs">
        <Button onClick={handleComplete} disabled={saving} size="lg" className="w-full gap-2">
          <Sparkles className="w-5 h-5" />
          {saving ? "Saving..." : "Start Dating Smarter"}
        </Button>
      </div>
    </div>
  );
};

export default CompletionScreen;
