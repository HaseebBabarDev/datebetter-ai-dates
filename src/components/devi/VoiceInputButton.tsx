import React, { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

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
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsConnecting(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      cleanup();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported in this browser.");
      return;
    }

    setIsConnecting(true);

    try {
      // Request mic permission first
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
        setIsConnecting(false);
        // Auto-stop after 30 seconds
        timeoutRef.current = setTimeout(() => {
          cleanup();
          toast.info("Recording stopped (max 30 seconds)");
        }, 30000);
      };

      recognition.onresult = (event: any) => {
        let finalText = "";
        let interimText = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }
        if (interimText) {
          onPartialTranscript?.(interimText);
        }
        if (finalText) {
          onTranscript(finalText.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        cleanup();
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please allow microphone access.");
        } else if (event.error !== "aborted") {
          toast.error("Voice recording error. Please try again.");
        }
      };

      recognition.onend = () => {
        cleanup();
      };

      recognition.start();
    } catch (error) {
      console.error("Recording error:", error);
      cleanup();
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Microphone access denied. Please allow microphone access.");
      } else {
        toast.error("Failed to start recording");
      }
    }
  }, [isRecording, cleanup, onTranscript, onPartialTranscript]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={startRecording}
            disabled={disabled || isConnecting}
            className="shrink-0"
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {isRecording ? "Stop recording" : "Voice input"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
