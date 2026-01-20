import { useState, useEffect, useRef } from "react";
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
  X,
  Volume2,
  VolumeX,
  Loader2,
  Pause,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    voiceScript: "Hey! Welcome to DateBetter. I'm D.E.V.I., your personal dating assistant. This isn't a dating app — I'm here to help you with the people you're already dating. Let me show you how I can help.",
    color: "from-primary to-pink-500",
  },
  {
    icon: MessageCircle,
    title: "Talk to D.E.V.I.",
    subtitle: "Your 24/7 dating advisor",
    description: "Skip the group chat drama. Get instant, data-driven advice based on YOUR patterns and YOUR situation—not generic tips.",
    voiceScript: "You can talk to me anytime — day or night. I give you real advice based on your actual data, not generic tips. Think of me as your best friend who actually remembers everything.",
    color: "from-purple-500 to-primary",
  },
  {
    icon: Camera,
    title: "Upload Screenshots",
    subtitle: "Let D.E.V.I. analyze conversations",
    description: "Share text conversations and D.E.V.I. will help decode mixed signals, identify red flags, and suggest your next move.",
    voiceScript: "Got a confusing text? Send me a screenshot. I'll decode the mixed signals, spot the red flags, and tell you exactly what to say next.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: FileText,
    title: "Log Every Detail",
    subtitle: "The more you share, the smarter I get",
    description: "Track dates, interactions, and gut feelings. D.E.V.I. connects the dots to reveal patterns you might miss.",
    voiceScript: "The more you tell me, the better I can help. Log your dates, how you felt, what they said. I'll connect the dots and show you patterns you might be missing.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Heart,
    title: "Let me guide you",
    subtitle: "From first date to committed relationship",
    description: "Get real-time alerts, compatibility scores, and personalized coaching as your relationship evolves.",
    voiceScript: "I'll be with you every step of the way — from first date jitters to something more serious. Real-time alerts, compatibility scores, and honest advice. Let's get started!",
    color: "from-rose-500 to-pink-600",
  },
];

export function FeatureTourDialog({ open, onClose }: FeatureTourDialogProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef<Set<number>>(new Set());
  
  const slide = tourSlides[currentSlide];
  const IconComponent = slide.icon;
  const isLastSlide = currentSlide === tourSlides.length - 1;

  // Auto-play voice when slide changes
  useEffect(() => {
    if (open && !isMuted && !hasPlayedRef.current.has(currentSlide)) {
      playVoice();
      hasPlayedRef.current.add(currentSlide);
    }
  }, [currentSlide, open, isMuted]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
      hasPlayedRef.current.clear();
    } else {
      // Cleanup audio when closing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [open]);

  const playVoice = async () => {
    if (isMuted) return;
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsLoadingAudio(true);
    setIsPlaying(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: slide.voiceScript }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        
        // Auto-advance to next slide after voice finishes
        if (autoAdvance && currentSlide < tourSlides.length - 1) {
          setTimeout(() => {
            setCurrentSlide(prev => prev + 1);
          }, 500);
        }
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
      };

      setIsLoadingAudio(false);
      await audio.play();
    } catch (error) {
      console.error("Voice playback error:", error);
      setIsPlaying(false);
      setIsLoadingAudio(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      playVoice();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAutoAdvance(isMuted); // Resume auto-advance when unmuting
  };

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    
    if (currentSlide < tourSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-0">
        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className="rounded-full p-2 bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-foreground" />
            )}
          </button>
          
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="rounded-full p-2 bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Hero section with gradient - animated */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className={`bg-gradient-to-br ${slide.color} p-8 pb-12 text-white relative overflow-hidden`}
          >
            {/* Animated decorative circles */}
            <motion.div 
              className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full"
              animate={{ 
                x: [20, 30, 20],
                y: [-20, -10, -20],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full"
              animate={{ 
                x: [-10, -20, -10],
                y: [10, 20, 10],
                scale: [1, 1.15, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <div className="relative z-10 flex flex-col items-center text-center pt-6">
              {/* Animated icon with pulse effect when speaking */}
              <motion.div 
                className={`w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 ${isPlaying ? 'ring-4 ring-white/30' : ''}`}
                animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <IconComponent className="w-10 h-10" />
                )}
              </motion.div>
              
              <motion.h2 
                className="text-xl font-bold mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {slide.title}
              </motion.h2>
              <motion.p 
                className="text-white/80 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {slide.subtitle}
              </motion.p>
              
              {/* Voice indicator */}
              {isPlaying && !isMuted && (
                <motion.div 
                  className="flex items-center gap-1 mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex gap-0.5 items-end h-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-white/80 rounded-full"
                        animate={{
                          height: ["8px", "16px", "8px"],
                        }}
                        transition={{
                          duration: 0.4,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-white/70 ml-2">D.E.V.I. speaking</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Content section */}
        <div className="p-6 pt-8 bg-background">
          <AnimatePresence mode="wait">
            <motion.p 
              key={currentSlide}
              className="text-center text-muted-foreground leading-relaxed mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {slide.description}
            </motion.p>
          </AnimatePresence>

          {/* Play/Pause button */}
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              disabled={isLoadingAudio || isMuted}
              className="gap-2"
            >
              {isLoadingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isPlaying ? "Pause" : "Replay"}
            </Button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {tourSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                  setIsPlaying(false);
                  setCurrentSlide(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-primary w-6' 
                    : index < currentSlide
                    ? 'bg-primary/50 w-2'
                    : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50'
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
