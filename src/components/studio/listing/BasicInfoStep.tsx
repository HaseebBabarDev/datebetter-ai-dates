import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Ruler, Image } from "lucide-react";

interface BasicInfoStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

const AMENITIES = [
  "Mirrors",
  "Changing Rooms",
  "WiFi",
  "Parking",
  "Air Conditioning",
  "Sound System",
  "Natural Light",
  "Kitchen/Kitchenette",
  "Bathroom",
  "Storage Space",
];

export function BasicInfoStep({ formData, setFormData }: BasicInfoStepProps) {
  const toggleAmenity = (amenity: string) => {
    const updated = formData.amenities.includes(amenity)
      ? formData.amenities.filter((a: string) => a !== amenity)
      : [...formData.amenities, amenity];
    setFormData({ ...formData, amenities: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Studio Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Downtown Dance Studio"
          className="mt-1.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Size *</Label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {["small", "medium", "large"].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setFormData({ ...formData, size })}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  formData.size === size
                    ? "border-primary bg-primary-very-light text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                <Building2 className="w-4 h-4 mx-auto mb-1" />
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="area_sqm">Area (sqm) *</Label>
          <div className="relative mt-1.5">
            <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="area_sqm"
              type="number"
              value={formData.area_sqm}
              onChange={(e) =>
                setFormData({ ...formData, area_sqm: e.target.value })
              }
              placeholder="e.g., 50"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Describe your studio space, what makes it special, ideal use cases..."
          className="mt-1.5 min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="cover_image">Cover Image URL *</Label>
        <div className="relative mt-1.5">
          <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="cover_image"
            value={formData.cover_image}
            onChange={(e) =>
              setFormData({ ...formData, cover_image: e.target.value })
            }
            placeholder="https://..."
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Amenities</Label>
        <div className="grid grid-cols-2 gap-3">
          {AMENITIES.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={formData.amenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <label
                htmlFor={amenity}
                className="text-sm text-foreground cursor-pointer"
              >
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
