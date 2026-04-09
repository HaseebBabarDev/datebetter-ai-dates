import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  Play,
  ClipboardList
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
    description: "Whether you're newly dating or already in a relationship, D.E.V.I. is here for you. Get personalized insights, track compatibility, and make smarter decisions at every stage.",
    voiceScript: "Hey! Welcome to DateBetter. I'm Devi, your personal dating assistant. This isn't a dating app — whether you're just starting to date someone new or you're already in a relationship, I'm here to guide you. Let me show you how I can help.",
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
    description: "Share text conversations and I'll help decode mixed signals, identify red flags, and suggest your next move.",
    voiceScript: "Got a confusing text? Send me a screenshot. I'll decode the mixed signals, spot the red flags, and tell you exactly what to say next.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: ClipboardList,
    title: "Take Personality Quizzes",
    subtitle: "Understand yourself better",
    description: "Discover your attachment style, love language, and personality type. The more I know about you, the better my advice gets.",
    voiceScript: "I've got personality quizzes for you — attachment style, love language, and more. The more detail you enter about yourself in your profile and preferences, the more accurate and personalized my guidance becomes.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: FileText,
    title: "Log Every Detail",
    subtitle: "The more you share, the smarter I get",
    description: "Track dates, interactions, and gut feelings. I connect the dots to reveal patterns you might miss.",
    voiceScript: "The more you tell me, the better I can help. Log your dates, how you felt, what they said. I'll connect the dots and show you patterns you might be missing.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Heart,
    title: "Let D.E.V.I. guide you",
    subtitle: "From first date to committed relationship",
    description: "Get real-time alerts, compatibility scores, and personalized advice as your relationship evolves.",
    voiceScript: "I'll be with you every step of the way — from first date jitters to something more serious. Real-time alerts, compatibility scores, and honest advice. Let's get started!",
    color: "from-rose-500 to-pink-600",
  },
];

export function FeatureTourDialog({ open, onClose }: FeatureTourDialogProps) {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [userVoicePreference, setUserVoicePreference] = useState<
    "female" | "male" | undefined
  >(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSlideRef = useRef(currentSlide);
  const isMutedRef = useRef(isMuted);
  const isPlayingRef = useRef(false);
  const voicePreferenceRef = useRef(userVoicePreference);
  const isLoadingRef = useRef(false);

  // Load user's preferred voice (from Settings) so the tour respects it.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadVoice = async () => {
      if (!user) {
        if (!cancelled) setUserVoicePreference(undefined);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("devi_voice")
        .eq("user_id", user.id)
        .single();

      const pref = (data?.devi_voice === "male" ? "male" : "female") as
        | "female"
        | "male";

      if (!cancelled) setUserVoicePreference(pref);
    };

    loadVoice();
    return () => {
      cancelled = true;
    };
  }, [open, user]);
  
  // Keep refs in sync with state
  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);
  
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    voicePreferenceRef.current = userVoicePreference;
  }, [userVoicePreference]);
  
  const slide = tourSlides[currentSlide];
  const IconComponent = slide.icon;
  const isLastSlide = currentSlide === tourSlides.length - 1;

  // Cleanup function to stop audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    isPlayingRef.current = false;
    isLoadingRef.current = false;
    setIsPlaying(false);
    setIsLoadingAudio(false);
  }, []);

  const playVoice = useCallback(async (slideIndex: number) => {
    // Check muted state from ref for accuracy
    if (isMutedRef.current) return;
    
    // Prevent concurrent loading/playing
    if (isLoadingRef.current || isPlayingRef.current) {
      stopAudio();
    }

    isLoadingRef.current = true;
    isPlayingRef.current = true;
    setIsLoadingAudio(true);
    setIsPlaying(true);
    setAudioEnded(false);

    try {
      const scriptToPlay = tourSlides[slideIndex].voiceScript;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: scriptToPlay, voicePreference: voicePreferenceRef.current }),
        }
      );

      // Check if we should still play (user might have navigated away)
      if (currentSlideRef.current !== slideIndex || isMutedRef.current) {
        setIsLoadingAudio(false);
        setIsPlaying(false);
        isPlayingRef.current = false;
        isLoadingRef.current = false;
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Double-check we should still play
      if (currentSlideRef.current !== slideIndex || isMutedRef.current) {
        URL.revokeObjectURL(audioUrl);
        setIsLoadingAudio(false);
        setIsPlaying(false);
        isPlayingRef.current = false;
        isLoadingRef.current = false;
        return;
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        isPlayingRef.current = false;
        isLoadingRef.current = false;
        setIsPlaying(false);
        setAudioEnded(true);
        URL.revokeObjectURL(audioUrl);
        
        // Auto-advance to next slide after voice finishes
        const currentIdx = currentSlideRef.current;
        if (currentIdx < tourSlides.length - 1 && currentIdx === slideIndex) {
          setTimeout(() => {
            if (currentSlideRef.current === slideIndex) {
              setCurrentSlide(currentIdx + 1);
            }
          }, 800);
        }
      };
      
      audio.onerror = () => {
        isPlayingRef.current = false;
        isLoadingRef.current = false;
        setIsPlaying(false);
        setIsLoadingAudio(false);
        setAudioEnded(true);
      };

      setIsLoadingAudio(false);
      await audio.play();
    } catch (error) {
      console.error("Voice playback error:", error);
      isPlayingRef.current = false;
      isLoadingRef.current = false;
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setAudioEnded(true);
    }
  }, [stopAudio]); // Removed userVoicePreference - using ref instead

  // Auto-play voice when slide changes
  useEffect(() => {
    if (!open || isMuted) {
      // If dialog closed or muted, stop audio
      stopAudio();
      return;
    }
    
    // Stop any existing audio first
    stopAudio();
    
    // Small delay to let animation settle
    const timer = setTimeout(() => {
      playVoice(currentSlide);
    }, 300);
    
    return () => {
      clearTimeout(timer);
      // Stop audio on cleanup (when dialog closes or slide changes)
      stopAudio();
    };
  }, [currentSlide, open, isMuted, playVoice, stopAudio]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
      setAudioEnded(false);
      setIsPlaying(false);
    } else {
      // Cleanup audio when closing
      stopAudio();
    }
  }, [open, stopAudio]);

  const handleReplay = () => {
    playVoice(currentSlide);
  };

  const togglePlayPause = () => {
    if (audioRef.current && !audioEnded) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Audio ended or doesn't exist, replay
      handleReplay();
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAudioEnded(false);
  };

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAudioEnded(false);
    
    if (currentSlide < tourSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAudioEnded(false);
    
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    onClose();
  };

  const handleDotClick = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAudioEnded(false);
    setCurrentSlide(index);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="max-w-[320px] sm:max-w-xs p-0 gap-0 overflow-hidden border-0 bg-background backdrop-blur-none">
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

          {/* Play/Pause/Replay button */}
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              disabled={isLoadingAudio || isMuted}
              className="gap-2"
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {audioEnded ? "Replay" : "Play"}
                </>
              )}
            </Button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {tourSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
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
