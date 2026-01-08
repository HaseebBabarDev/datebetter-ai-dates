import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles, Heart, Zap, Crown } from "lucide-react";

interface WillingnessToPaySurveyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateCount: number;
}

const PRICE_OPTIONS = [
  { value: "0", label: "I prefer free" },
  { value: "5", label: "$5/month" },
  { value: "10", label: "$10/month" },
  { value: "15", label: "$15/month" },
  { value: "20", label: "$20/month" },
  { value: "25+", label: "$25+/month" },
];

const FEATURES = [
  { id: "unlimited_candidates", label: "Unlimited candidates", icon: Heart },
  { id: "ai_insights", label: "AI-powered insights & alerts", icon: Sparkles },
  { id: "pattern_detection", label: "Red/green flag detection", icon: Zap },
  { id: "compatibility", label: "Compatibility scoring", icon: Crown },
  { id: "no_contact", label: "No-contact mode support", icon: Heart },
  { id: "community", label: "Community access", icon: Sparkles },
];

const PLAN_OPTIONS = [
  { value: "free", label: "Free (limited features)" },
  { value: "basic", label: "Basic ($5-10/mo)" },
  { value: "standard", label: "Standard ($10-15/mo)" },
  { value: "premium", label: "Premium ($15-25/mo)" },
];

export function WillingnessToPaySurvey({
  open,
  onOpenChange,
  candidateCount,
}: WillingnessToPaySurveyProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [preferredPlan, setPreferredPlan] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [valuedFeatures, setValuedFeatures] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  const toggleFeature = (featureId: string) => {
    setValuedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("willingness_to_pay_surveys").insert({
        user_id: user.id,
        candidate_count_at_survey: candidateCount,
        preferred_plan: preferredPlan || null,
        max_monthly_price: maxPrice ? parseFloat(maxPrice.replace("+", "")) : null,
        most_valued_features: valuedFeatures.length > 0 ? valuedFeatures : null,
        feedback: feedback || null,
      });

      if (error) throw error;

      // Mark any pending survey requests as completed
      await supabase
        .from("survey_requests")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("survey_type", "wtp")
        .eq("status", "pending");

      toast.success("Thank you for your feedback! 💜");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast.error("Failed to submit survey");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            You're on a roll! 🎉
          </DialogTitle>
          <DialogDescription>
            You've added {candidateCount} candidates! Help us build the best dating
            companion for you.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Which features matter most to you?
            </p>
            <div className="grid gap-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleFeature(feature.id)}
                >
                  <Checkbox
                    id={feature.id}
                    checked={valuedFeatures.includes(feature.id)}
                    onCheckedChange={() => toggleFeature(feature.id)}
                  />
                  <feature.icon className="h-4 w-4 text-primary" />
                  <Label htmlFor={feature.id} className="cursor-pointer flex-1">
                    {feature.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={handleSkip} className="flex-1">
                Skip
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              What would you be willing to pay monthly for premium features?
            </p>
            <RadioGroup value={maxPrice} onValueChange={setMaxPrice}>
              <div className="grid gap-2">
                {PRICE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <RadioGroupItem value={option.value} id={`price-${option.value}`} />
                    <Label htmlFor={`price-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Which plan tier appeals to you most?
            </p>
            <RadioGroup value={preferredPlan} onValueChange={setPreferredPlan}>
              <div className="grid gap-2">
                {PLAN_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <RadioGroupItem value={option.value} id={`plan-${option.value}`} />
                    <Label htmlFor={`plan-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Any other feedback? (Optional)
            </p>
            <Textarea
              placeholder="What would make D.E.V.I. worth paying for?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
