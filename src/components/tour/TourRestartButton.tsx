import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useTour, TourStep } from "./TourContext";
import { resetFeatureTour } from "@/hooks/useFeatureTour";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TourRestartButtonProps {
  tourId: string;
  tourSteps: TourStep[];
  className?: string;
  userId?: string; // Optional: if provided, also resets the feature tour
}

export const TourRestartButton: React.FC<TourRestartButtonProps> = ({
  tourId,
  tourSteps,
  className = "",
  userId,
}) => {
  const { resetTour, hasCompletedTour } = useTour();

  const handleRestart = () => {
    // Reset the feature tour first (video walkthrough) if userId is provided
    if (userId) {
      resetFeatureTour(userId);
    }
    
    // Reset the standard tour
    resetTour(tourId);
    
    // Reload to trigger the feature tour first, then dashboard tour
    window.location.reload();
  };

  // Only show if tour has been completed
  if (!hasCompletedTour(tourId)) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 ${className}`}
            onClick={handleRestart}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Restart guide</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
