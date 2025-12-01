import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Image } from "lucide-react";

interface GalleryStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function GalleryStep({ formData, setFormData }: GalleryStepProps) {
  const [newImageUrl, setNewImageUrl] = useState("");

  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl],
      });
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_: string, i: number) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Add Gallery Images</Label>
        <div className="flex gap-2 mt-1.5">
          <div className="relative flex-1">
            <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://... (Enter image URL)"
              className="pl-10"
              onKeyPress={(e) => e.key === "Enter" && addImage()}
            />
          </div>
          <Button onClick={addImage} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {formData.images.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
          <Image className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No images added yet. Add URLs to showcase your studio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {formData.images.map((url: string, idx: number) => (
            <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-border">
              <img
                src={url}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x300/1a1a1a/666?text=Invalid+Image";
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(idx)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs font-medium">
                #{idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Add high-quality images that show different
          angles of your studio, amenities, and unique features. The order you
          add them determines how they'll appear in the gallery.
        </p>
      </div>
    </div>
  );
}
