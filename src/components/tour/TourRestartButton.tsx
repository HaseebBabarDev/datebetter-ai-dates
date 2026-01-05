import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useTour, TourStep } from "./TourContext";
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
}

export const TourRestartButton: React.FC<TourRestartButtonProps> = ({
  tourId,
  tourSteps,
  className = "",
}) => {
  const { resetTour, startTour, hasCompletedTour } = useTour();

  const handleRestart = () => {
    resetTour(tourId);
    // Small delay to let state update
    setTimeout(() => {
      startTour(tourId, tourSteps);
    }, 100);
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
