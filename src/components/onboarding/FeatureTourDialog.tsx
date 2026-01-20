import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Camera, 
  FileText, 
  Heart, 
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";

interface FeatureTourDialogProps {
  open: boolean;
  onClose: () => void;
}

const tourSlides = [
  {
    icon: Sparkles,
    title: "This isn't a dating app",
    subtitle: "It's your AI dating assistant",
    description: "D.E.V.I. helps you navigate the people you're already dating. Get personalized insights, track compatibility, and make smarter decisions.",
    color: "from-primary to-pink-500",
  },
  {
    icon: MessageCircle,
    title: "Talk to D.E.V.I.",
    subtitle: "Your 24/7 dating advisor",
    description: "Skip the group chat drama. Get instant, data-driven advice based on YOUR patterns and YOUR situation—not generic tips.",
    color: "from-purple-500 to-primary",
  },
  {
    icon: Camera,
    title: "Upload Screenshots",
    subtitle: "Let D.E.V.I. analyze conversations",
    description: "Share text conversations and D.E.V.I. will help decode mixed signals, identify red flags, and suggest your next move.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: FileText,
    title: "Log Every Detail",
    subtitle: "The more you share, the smarter D.E.V.I. gets",
    description: "Track dates, interactions, and gut feelings. D.E.V.I. connects the dots to reveal patterns you might miss.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Heart,
    title: "Let D.E.V.I. Guide You",
    subtitle: "From first date to committed relationship",
    description: "Get real-time alerts, compatibility scores, and personalized coaching as your relationship evolves.",
    color: "from-rose-500 to-pink-600",
  },
];

export function FeatureTourDialog({ open, onClose }: FeatureTourDialogProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const handleNext = () => {
    if (currentSlide < tourSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const slide = tourSlides[currentSlide];
  const IconComponent = slide.icon;
  const isLastSlide = currentSlide === tourSlides.length - 1;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-0">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Hero section with gradient */}
        <div className={`bg-gradient-to-br ${slide.color} p-8 pb-12 text-white relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
              <IconComponent className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-1">{slide.title}</h2>
            <p className="text-white/80 text-sm">{slide.subtitle}</p>
          </div>
        </div>

        {/* Content section */}
        <div className="p-6 pt-8 bg-background">
          <p className="text-center text-muted-foreground leading-relaxed mb-6">
            {slide.description}
          </p>

          {/* Dots indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {tourSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`flex-1 ${currentSlide === 0 ? 'w-full' : ''}`}
            >
              {isLastSlide ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {currentSlide === 0 && (
            <button
              onClick={handleSkip}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
