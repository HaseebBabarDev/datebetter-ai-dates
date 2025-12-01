import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Building2, Ruler, DollarSign, Calendar, Image } from "lucide-react";

interface ReviewStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-primary-very-light border border-primary/30 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-primary">Ready to publish!</p>
          <p className="text-xs text-primary/80 mt-1">
            Review your studio details below and click "Publish Studio" when
            ready.
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Basic Information
        </h3>
        <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Title</p>
            <p className="text-sm font-medium">{formData.title || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Size</p>
            <Badge variant="outline">{formData.size}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Area</p>
            <p className="text-sm font-medium">{formData.area_sqm} sqm</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Amenities</p>
            <p className="text-sm font-medium">{formData.amenities.length} selected</p>
          </div>
        </div>
        {formData.description && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{formData.description}</p>
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Availability
        </h3>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex gap-2 flex-wrap">
            {formData.weeklySchedule.map((day: any, idx: number) => (
              <Badge
                key={idx}
                variant={day.isOpen ? "default" : "outline"}
                className="text-xs"
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][idx]}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Pricing
        </h3>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Base Rate:</span>{" "}
            <span className="font-semibold">${formData.base_hourly_rate}/hr</span>
          </p>
          {formData.timeSlots.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {formData.timeSlots.length} custom time slots configured
            </p>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Image className="w-4 h-4" />
          Gallery
        </h3>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Cover Image:</span>{" "}
            {formData.cover_image ? (
              <span className="text-primary text-xs">✓ Set</span>
            ) : (
              <span className="text-destructive text-xs">Not set</span>
            )}
          </p>
          <p className="text-sm mt-1">
            <span className="text-muted-foreground">Gallery:</span>{" "}
            <span className="font-medium">{formData.images.length} images</span>
          </p>
        </div>
      </div>
    </div>
  );
}
