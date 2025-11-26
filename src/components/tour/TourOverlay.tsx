import React, { useEffect, useState, useRef } from "react";
import { useTour } from "./TourContext";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TourOverlay: React.FC = () => {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour } = useTour();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        
        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    // Small delay to let DOM settle
    const timer = setTimeout(findTarget, 100);
    
    // Re-calculate on resize
    window.addEventListener("resize", findTarget);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", findTarget);
    };
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData) return null;

  const padding = 8;
  const tooltipPlacement = currentStepData.placement || "bottom";

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { opacity: 0 };

    const viewportWidth = window.innerWidth;
    const tooltipWidth = Math.min(280, viewportWidth - 32);

    const style: React.CSSProperties = {
      position: "absolute",
      zIndex: 10001,
      width: tooltipWidth,
      left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - 16)),
    };

    switch (tooltipPlacement) {
      case "top":
        style.bottom = `calc(100% - ${targetRect.top - padding - 12}px)`;
        break;
      case "bottom":
      default:
        style.top = targetRect.top + targetRect.height + padding + 12;
        break;
    }

    return style;
  };

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "auto" }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight border */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary rounded-lg animate-pulse pointer-events-none"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            boxShadow: "0 0 0 4px hsl(var(--primary) / 0.3)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="bg-card border border-border rounded-xl shadow-xl p-4 pointer-events-auto animate-scale-in"
        style={getTooltipStyle()}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground text-base">{currentStepData.title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-2 text-muted-foreground"
            onClick={skipTour}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {currentStepData.description}
        </p>

        <div className="flex items-center justify-end gap-2">
          {currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <Button size="sm" onClick={nextStep}>
            {currentStep === steps.length - 1 ? "Got it" : "Next"}
            {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
