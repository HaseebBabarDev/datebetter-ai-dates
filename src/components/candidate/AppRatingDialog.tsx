import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Star, Heart } from "lucide-react";
import { toast } from "sonner";

interface AppRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppRatingDialog: React.FC<AppRatingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating > 0) {
      // Store that user has rated
      localStorage.setItem("app_rated", "true");
      localStorage.setItem("app_rating", rating.toString());
      setSubmitted(true);
      
      // After showing thank you, close dialog
      setTimeout(() => {
        onOpenChange(false);
        if (rating >= 4) {
          toast.success("Thank you for your support! 💜");
        }
      }, 2000);
    }
  };

  const handleMaybeLater = () => {
    // Don't set app_rated, so it can show again later
    localStorage.setItem("rating_skipped_at", Date.now().toString());
    onOpenChange(false);
  };

  const displayRating = hoveredRating || rating;

  if (submitted) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-sm text-center">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Heart className="w-8 h-8 text-primary fill-primary" />
              </div>
            </div>
            <AlertDialogTitle className="text-xl">
              {rating >= 4 ? "You're amazing!" : "Thanks for your feedback!"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {rating >= 4
                ? "Your support means everything to us 💜"
                : "We'll keep working to improve your experience."}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Heart className="w-6 h-6 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-xl">
            Enjoying the app?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Your first candidate is added! We'd love to hear how we're doing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= displayRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              {displayRating === 1 && "We can do better 😔"}
              {displayRating === 2 && "Room for improvement"}
              {displayRating === 3 && "It's okay"}
              {displayRating === 4 && "Really good!"}
              {displayRating === 5 && "Love it! 🎉"}
            </p>
          )}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            disabled={rating === 0}
            onClick={handleSubmit}
          >
            Submit Rating
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleMaybeLater}
          >
            Maybe Later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Helper to check if we should show the rating dialog
export const shouldShowRatingDialog = (): boolean => {
  // Already rated
  if (localStorage.getItem("app_rated") === "true") {
    return false;
  }

  // Skipped recently (within 7 days)
  const skippedAt = localStorage.getItem("rating_skipped_at");
  if (skippedAt) {
    const daysSinceSkip = (Date.now() - parseInt(skippedAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceSkip < 7) {
      return false;
    }
  }

  return true;
};
