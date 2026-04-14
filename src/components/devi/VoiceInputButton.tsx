import React, { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useScribe } from "@elevenlabs/react";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onPartialTranscript?: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  onPartialTranscript,
  disabled = false,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad",
    onPartialTranscript: (data) => {
      onPartialTranscript?.(data.text);
    },
    onCommittedTranscript: (data) => {
      if (data.text.trim()) {
        onTranscript(data.text.trim());
      }
    },
  });

  const startRecording = useCallback(async () => {
    if (scribe.isConnected) {
      scribe.disconnect();
      return;
    }

    setIsConnecting(true);

    try {
      // Get scribe token from edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-scribe-token"
      );

      if (error || !data?.token) {
        throw new Error(error?.message || "No token received");
      }

      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (error) {
      console.error("Recording error:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Microphone access denied. Please allow microphone access.");
      } else {
        toast.error("Failed to start voice input. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [scribe]);

  // Auto-stop after 30 seconds
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scribe.isConnected) {
      timeoutRef.current = setTimeout(() => {
        scribe.disconnect();
        toast.info("Recording stopped (max 30 seconds)");
      }, 30000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [scribe.isConnected]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={scribe.isConnected ? "destructive" : "ghost"}
            size="icon"
            onClick={startRecording}
            disabled={disabled || isConnecting}
            className="shrink-0"
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : scribe.isConnected ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {scribe.isConnected ? "Stop recording" : "Voice input"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
