import React, { useState, useCallback, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useScribe, CommitStrategy } from "@elevenlabs/react";

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
  const [elapsed, setElapsed] = useState(0);
  const [justSaved, setJustSaved] = useState(false);
  const cancelledRef = useRef(false);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      if (cancelledRef.current) return;
      onPartialTranscript?.(data.text);
    },
    onCommittedTranscript: (data) => {
      if (cancelledRef.current) return;
      if (data.text.trim()) {
        onTranscript(data.text.trim());
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1800);
      }
    },
  });

  const startRecording = useCallback(async () => {
    setIsConnecting(true);
    cancelledRef.current = false;
    setElapsed(0);

    try {
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

  const stopAndSave = useCallback(() => {
    cancelledRef.current = false;
    scribe.disconnect();
  }, [scribe]);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    scribe.disconnect();
    toast.info("Recording cancelled");
  }, [scribe]);

  // Elapsed counter + auto-stop after 30 seconds
  useEffect(() => {
    if (!scribe.isConnected) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      setElapsed(secs);
      if (secs >= 30) {
        scribe.disconnect();
        toast.info("Recording stopped (max 30 seconds)");
      }
    }, 250);
    return () => clearInterval(interval);
  }, [scribe.isConnected, scribe]);

  // Active recording UI: stop + cancel controls with timer
  if (scribe.isConnected) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 pl-2 pr-1 py-0.5 animate-fade-in">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
        </span>
        <span className="text-[11px] font-medium text-destructive tabular-nums">
          Rec {String(elapsed).padStart(2, "0")}s
        </span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelRecording}
                disabled={disabled}
                className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Cancel recording"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Cancel</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={stopAndSave}
                disabled={disabled}
                className="h-6 w-6 rounded-full"
                aria-label="Stop and save"
              >
                <Square className="w-3 h-3 fill-current" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Stop & save</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Idle / connecting / just-saved confirmation
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={justSaved ? "outline" : "ghost"}
            size="icon"
            onClick={startRecording}
            disabled={disabled || isConnecting}
            className={`shrink-0 transition-colors ${
              justSaved ? "border-primary/40 text-primary" : ""
            }`}
            aria-label={justSaved ? "Transcript saved" : "Voice input"}
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : justSaved ? (
              <Check className="w-5 h-5 animate-fade-in" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {isConnecting
              ? "Starting…"
              : justSaved
                ? "Transcript added"
                : "Voice input"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
