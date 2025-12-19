import React, { useEffect, useState, useRef } from "react";
import { useTour } from "./TourContext";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TourOverlay: React.FC = () => {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour } = useTour();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) {
      setTargetRect(null);
      return;
    }

    // Start animation
    setIsAnimating(true);

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
        
        // Scroll element into view with some offset
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // End animation after positioning
        setTimeout(() => setIsAnimating(false), 300);
      } else {
        // Target not found, try next step or skip
        console.warn(`Tour target not found: ${currentStepData.target}`);
        setTargetRect(null);
        setIsAnimating(false);
      }
    };

    // Delay to let DOM settle and animations complete
    const timer = setTimeout(findTarget, 150);
    
    // Re-calculate on resize
    const handleResize = () => {
      setIsAnimating(true);
      findTarget();
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData) return null;

  const padding = 12;
  const tooltipPlacement = currentStepData.placement || "bottom";

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      // Center tooltip if no target found
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10001,
        width: Math.min(320, window.innerWidth - 32),
        opacity: isAnimating ? 0 : 1,
        transition: "opacity 0.2s ease-out",
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(320, viewportWidth - 32);
    const estimatedTooltipHeight = 180;

    const style: React.CSSProperties = {
      position: "absolute",
      zIndex: 10001,
      width: tooltipWidth,
      opacity: isAnimating ? 0 : 1,
      transform: isAnimating ? "scale(0.95)" : "scale(1)",
      transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
    };

    // Calculate horizontal position (centered on target, but within viewport)
    const targetCenterX = targetRect.left + targetRect.width / 2;
    let left = targetCenterX - tooltipWidth / 2;
    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));
    style.left = left;

    // Calculate vertical position based on placement
    const targetBottom = targetRect.top + targetRect.height;
    const spaceBelow = viewportHeight - (targetBottom - window.scrollY);
    const spaceAbove = targetRect.top - window.scrollY;

    switch (tooltipPlacement) {
      case "top":
        if (spaceAbove > estimatedTooltipHeight + padding + 20) {
          style.top = targetRect.top - estimatedTooltipHeight - padding - 16;
        } else {
          // Fall back to bottom if not enough space
          style.top = targetBottom + padding + 16;
        }
        break;
      case "bottom":
      default:
        if (spaceBelow > estimatedTooltipHeight + padding + 20) {
          style.top = targetBottom + padding + 16;
        } else {
          // Fall back to top if not enough space
          style.top = targetRect.top - estimatedTooltipHeight - padding - 16;
        }
        break;
    }

    return style;
  };

  return (
    <div className="fixed inset-0 z-[10000]" style={{ pointerEvents: "none" }}>
      {/* Dark overlay with cutout */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        style={{ pointerEvents: "auto", minHeight: "100vh" }}
      >
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="12"
                fill="black"
              />
            )}
          </mask>
          {/* Gradient for glow effect */}
          <radialGradient id="tour-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.8)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight border with glow */}
      {targetRect && (
        <>
          {/* Outer glow */}
          <div
            className="absolute rounded-xl pointer-events-none"
            style={{
              top: targetRect.top - padding - 4,
              left: targetRect.left - padding - 4,
              width: targetRect.width + padding * 2 + 8,
              height: targetRect.height + padding * 2 + 8,
              background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          {/* Border */}
          <div
            className="absolute border-2 border-primary rounded-xl pointer-events-none"
            style={{
              top: targetRect.top - padding,
              left: targetRect.left - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
              boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2), inset 0 0 20px hsl(var(--primary) / 0.1)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="bg-card border border-border rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
        style={getTooltipStyle()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base leading-tight">
                  {currentStepData.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 -mt-1 -mr-1 text-muted-foreground hover:text-foreground hover:bg-destructive/10 rounded-lg"
              onClick={skipTour}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Progress bar */}
          <div className="mt-4 mb-3">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    index <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Skip tour
            </Button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={prevStep}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={nextStep}
                className="h-8 px-4 bg-primary hover:bg-primary/90"
              >
                {currentStep === steps.length - 1 ? (
                  "Got it!"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};