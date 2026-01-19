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
import { supabase } from "@/integrations/supabase/client";

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
  const [partialText, setPartialText] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsRecording(false);
    setPartialText("");
  }, []);

  const stopRecording = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    setIsConnecting(true);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        } 
      });
      streamRef.current = stream;

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      
      if (error || !data?.token) {
        throw new Error("Failed to get transcription token");
      }

      // Connect to ElevenLabs WebSocket
      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/scribe_v2_realtime?token=${data.token}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        // Send configuration
        ws.send(JSON.stringify({
          type: "config",
          data: {
            language_code: "en",
            sample_rate: 16000,
            encoding: "pcm_s16le",
            commit_strategy: "vad",
          }
        }));

        // Start recording
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
        });
        mediaRecorderRef.current = mediaRecorder;

        // Use AudioContext for PCM conversion
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
            }
            
            // Convert to base64
            const uint8Array = new Uint8Array(pcmData.buffer);
            let binary = '';
            for (let i = 0; i < uint8Array.byteLength; i++) {
              binary += String.fromCharCode(uint8Array[i]);
            }
            const base64Audio = btoa(binary);
            
            ws.send(JSON.stringify({
              type: "audio",
              data: base64Audio,
            }));
          }
        };

        setIsRecording(true);
        setIsConnecting(false);

        // Auto-stop after 30 seconds
        silenceTimeoutRef.current = setTimeout(() => {
          stopRecording();
          toast.info("Recording stopped (max 30 seconds)");
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "partial_transcript") {
            setPartialText(message.text || "");
            onPartialTranscript?.(message.text || "");
          } else if (message.type === "committed_transcript" || message.type === "final_transcript") {
            const finalText = message.text?.trim();
            if (finalText) {
              onTranscript(finalText);
              setPartialText("");
            }
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        cleanup();
        toast.error("Voice recording error");
      };

      ws.onclose = () => {
        cleanup();
      };

    } catch (error) {
      console.error("Recording error:", error);
      cleanup();
      
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Microphone access denied. Please allow microphone access.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to start recording");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [isRecording, stopRecording, cleanup, onTranscript, onPartialTranscript]);

  // Cleanup on unmount
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
