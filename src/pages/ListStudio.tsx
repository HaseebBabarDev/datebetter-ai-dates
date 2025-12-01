import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BasicInfoStep } from "@/components/studio/listing/BasicInfoStep";
import { AvailabilityStep } from "@/components/studio/listing/AvailabilityStep";
import { PricingStep } from "@/components/studio/listing/PricingStep";
import { GalleryStep } from "@/components/studio/listing/GalleryStep";
import { ReviewStep } from "@/components/studio/listing/ReviewStep";

export default function ListStudio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    size: "medium" as "small" | "medium" | "large",
    area_sqm: "",
    description: "",
    cover_image: "",
    amenities: [] as string[],
    base_hourly_rate: "",
    weeklySchedule: Array(7).fill(null).map(() => ({ isOpen: true })),
    timeSlots: [] as Array<{
      day: number;
      startTime: string;
      endTime: string;
      rate: string;
      type: "regular" | "peak" | "discounted";
    }>,
    dateOverrides: [] as Array<{
      date: string;
      isAvailable: boolean;
      reason: string;
    }>,
    images: [] as string[],
  });

  const steps = [
    { number: 1, title: "Basic Info", component: BasicInfoStep },
    { number: 2, title: "Availability", component: AvailabilityStep },
    { number: 3, title: "Pricing", component: PricingStep },
    { number: 4, title: "Gallery", component: GalleryStep },
    { number: 5, title: "Review", component: ReviewStep },
  ];

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to list a studio");
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert studio
      const { data: studio, error: studioError } = await supabase
        .from("studios")
        .insert({
          owner_user_id: user.id,
          title: formData.title,
          size: formData.size,
          area_sqm: parseFloat(formData.area_sqm),
          description: formData.description,
          cover_image: formData.cover_image,
          amenities: formData.amenities,
          base_hourly_rate: parseFloat(formData.base_hourly_rate),
        })
        .select()
        .single();

      if (studioError) throw studioError;

      // Insert weekly patterns
      const patterns = formData.weeklySchedule.map((schedule, idx) => ({
        studio_id: studio.id,
        day_of_week: idx,
        is_open: schedule.isOpen,
      }));

      const { error: patternsError } = await supabase
        .from("studio_availability_patterns")
        .insert(patterns);

      if (patternsError) throw patternsError;

      // Insert time slots
      if (formData.timeSlots.length > 0) {
        const slots = formData.timeSlots.map((slot) => ({
          studio_id: studio.id,
          day_of_week: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime,
          hourly_rate: parseFloat(slot.rate),
          slot_type: slot.type,
        }));

        const { error: slotsError } = await supabase
          .from("studio_time_slots")
          .insert(slots);

        if (slotsError) throw slotsError;
      }

      // Insert date overrides
      if (formData.dateOverrides.length > 0) {
        const overrides = formData.dateOverrides.map((override) => ({
          studio_id: studio.id,
          override_date: override.date,
          is_available: override.isAvailable,
          reason: override.reason,
        }));

        const { error: overridesError } = await supabase
          .from("studio_date_overrides")
          .insert(overrides);

        if (overridesError) throw overridesError;
      }

      // Insert images
      if (formData.images.length > 0) {
        const images = formData.images.map((url, idx) => ({
          studio_id: studio.id,
          image_url: url,
          display_order: idx,
        }));

        const { error: imagesError } = await supabase
          .from("studio_images")
          .insert(images);

        if (imagesError) throw imagesError;
      }

      toast.success("Studio listed successfully!");
      navigate(`/studio/${studio.id}`);
    } catch (error: any) {
      console.error("Error listing studio:", error);
      toast.error(error.message || "Failed to list studio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            List Your Studio
          </h1>
          <p className="text-muted-foreground">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`text-xs ${
                  step.number <= currentStep
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <CurrentStepComponent formData={formData} setFormData={setFormData} />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish Studio"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
