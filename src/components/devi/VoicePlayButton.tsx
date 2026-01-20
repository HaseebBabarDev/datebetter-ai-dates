import React, { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoicePlayButtonProps {
  text: string;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "inline" | "icon" | "bar" | "blob";
  className?: string;
}

// Animated sound wave bars that update continuously while playing
const LiveSoundWave: React.FC<{ colorClass?: string }> = ({ colorClass = "bg-primary" }) => {
  const [heights, setHeights] = useState([4, 8, 6, 10, 5]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeights([
        Math.random() * 12 + 4,
        Math.random() * 14 + 4,
        Math.random() * 10 + 4,
        Math.random() * 12 + 4,
        Math.random() * 8 + 4,
      ]);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-[3px] h-5">
      {heights.map((height, idx) => (
        <div
          key={idx}
          className={cn("w-[3px] rounded-full transition-all duration-150", colorClass)}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
};

// Floating blob component
const FloatingBlob: React.FC<{ isPlaying: boolean; onClick: () => void; isLoading: boolean }> = ({
  isPlaying,
  onClick,
  isLoading,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "voice-blob mx-auto cursor-pointer transition-all hover:scale-105 active:scale-95",
        isPlaying && "speaking"
      )}
      aria-label={isPlaying ? "Stop playing" : "Play message"}
    >
      <div className="voice-blob-inner" />
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {isLoading ? (
          <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-6 h-6 text-primary-foreground drop-shadow-md" />
        ) : (
          <Volume2 className="w-6 h-6 text-primary-foreground drop-shadow-md" />
        )}
      </div>
    </button>
  );
};

const SPEED_OPTIONS = [1, 1.5, 2] as const;
type PlaybackSpeed = typeof SPEED_OPTIONS[number];

export const VoicePlayButton: React.FC<VoicePlayButtonProps> = ({
  text,
  disabled = false,
  size = "sm",
  variant = "inline",
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cycleSpeed = useCallback(() => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    const newSpeed = SPEED_OPTIONS[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  }, [playbackSpeed]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!text || text.trim().length === 0) {
      toast.error("No text to play");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        toast.error("Failed to play audio");
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("TTS error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to play audio");
    } finally {
      setIsLoading(false);
    }
  }, [text, isPlaying, stopAudio, playbackSpeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  // Blob variant - floating animated blob with speed control
  if (variant === "blob") {
    return (
      <div className={cn("flex flex-col items-center gap-3 py-4", className)}>
        <FloatingBlob isPlaying={isPlaying} onClick={playAudio} isLoading={isLoading} />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Generating..." : isPlaying ? "Tap to pause" : "Tap to listen"}
          </span>
          {(isPlaying || audioRef.current) && (
            <button
              onClick={cycleSpeed}
              className="px-2 py-1 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              {playbackSpeed}x
            </button>
          )}
        </div>
        {!isPlaying && !isLoading && (
          <div className="flex items-center gap-2">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-full transition-colors",
                  playbackSpeed === speed
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Bar variant - full width bar with animation
  if (variant === "bar") {
    return (
      <button
        onClick={playAudio}
        disabled={disabled || isLoading}
        className={cn(
          "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all",
          "bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20",
          "border border-primary/20",
          isPlaying && "from-primary/20 to-accent/20 shadow-md",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Generating audio...</span>
          </>
        ) : isPlaying ? (
          <>
            <div className="flex items-center gap-3">
              <LiveSoundWave colorClass="bg-primary" />
              <span className="text-sm font-medium text-foreground">Playing...</span>
            </div>
            <Pause className="w-5 h-5 text-primary ml-auto" />
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Listen to this response</span>
          </>
        )}
      </button>
    );
  }

  // Icon variant - compact icon-only button with speed toggle when playing
  if (variant === "icon") {
    const iconSizeStyles = {
      sm: { button: "h-6", icon: "w-3 h-3", speedText: "text-[10px]" },
      default: { button: "h-8", icon: "w-4 h-4", speedText: "text-xs" },
      lg: { button: "h-10", icon: "w-5 h-5", speedText: "text-xs" },
    };
    const iconStyles = iconSizeStyles[size];

    return (
      <div className={cn("flex items-center gap-1", className)}>
        <button
          className={cn(
            "rounded-full flex items-center justify-center transition-all",
            isPlaying 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            isPlaying ? "px-2" : "w-6",
            iconStyles.button,
          )}
          onClick={playAudio}
          disabled={disabled || isLoading}
          title={isPlaying ? "Pause" : "Listen"}
        >
          {isLoading ? (
            <Loader2 className={cn(iconStyles.icon, "animate-spin")} />
          ) : isPlaying ? (
            <div className="flex items-center gap-1">
              <LiveSoundWave colorClass="bg-primary-foreground" />
              <Pause className={iconStyles.icon} />
            </div>
          ) : (
            <Volume2 className={iconStyles.icon} />
          )}
        </button>
        {/* Speed control - only shows when playing */}
        {isPlaying && (
          <button
            onClick={cycleSpeed}
            className={cn(
              "px-1.5 py-0.5 font-medium rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors",
              iconStyles.speedText
            )}
            title="Change speed"
          >
            {playbackSpeed}x
          </button>
        )}
      </div>
    );
  }

  // Inline variant - small button with icon
  const sizeStyles = {
    sm: { button: "h-8 px-2.5 gap-1.5", icon: "w-3.5 h-3.5", text: "text-xs" },
    default: { button: "h-9 px-3 gap-2", icon: "w-4 h-4", text: "text-sm" },
    lg: { button: "h-10 px-4 gap-2.5", icon: "w-5 h-5", text: "text-sm" },
  };

  const styles = sizeStyles[size];

  return (
    <Button
      variant={isPlaying ? "default" : "ghost"}
      size="sm"
      className={cn(
        styles.button,
        "rounded-full transition-all",
        isPlaying && "bg-primary text-primary-foreground shadow-md",
        !isPlaying && "text-muted-foreground hover:text-foreground hover:bg-muted",
        className
      )}
      onClick={playAudio}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className={cn(styles.icon, "animate-spin")} />
      ) : isPlaying ? (
        <>
          <LiveSoundWave colorClass="bg-primary-foreground" />
          <Pause className={styles.icon} />
        </>
      ) : (
        <>
          <Volume2 className={styles.icon} />
          <span className={styles.text}>Listen</span>
        </>
      )}
    </Button>
  );
};

export default VoicePlayButton;