import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudioGalleryProps {
  images: Array<{ id: string; image_url: string; display_order: number }>;
}

export function StudioGallery({ images }: StudioGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No gallery images available
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
        <img
          src={images[currentIndex].image_url}
          alt={`Gallery ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={handleNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
        <div className="absolute bottom-2 right-2 bg-background/90 px-2 py-1 rounded text-xs">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setCurrentIndex(idx)}
            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              idx === currentIndex
                ? "border-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <img
              src={img.image_url}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
