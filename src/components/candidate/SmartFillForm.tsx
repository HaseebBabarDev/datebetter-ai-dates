import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Check, Mic, Video, Image, X, FileVideo } from "lucide-react";
import { VoiceInputButton } from "@/components/devi/VoiceInputButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExtractedCandidate {
  nickname?: string;
  age?: number;
  gender_identity?: string;
  pronouns?: string;
  met_via?: string;
  met_app?: string;
  height?: string;
  country?: string;
  city?: string;
  distance_approximation?: string;
  their_religion?: string;
  their_politics?: string;
  their_relationship_status?: string;
  their_relationship_goal?: string;
  their_kids_desire?: string;
  their_kids_status?: string;
  their_attachment_style?: string;
  their_career_stage?: string;
  their_education_level?: string;
  their_social_style?: string;
  their_drinking?: string;
  their_smoking?: string;
  their_exercise?: string;
  their_schedule_flexibility?: string;
  zodiac_sign?: string;
  their_parent_status?: string;
  their_mother_status?: string;
  their_father_status?: string;
  their_siblings?: number;
  their_parents_relationship?: string;
  their_felt_loved_as_child?: string;
  their_family_stability?: string;
  their_healthy_relationship_models?: boolean;
  their_family_notes?: string;
  their_relationship_notes?: string;
  notes?: string;
  their_ambition_level?: number;
  overall_chemistry?: number;
  physical_attraction?: number;
  intellectual_connection?: number;
  humor_compatibility?: number;
  energy_match?: number;
}

interface SmartFillFormProps {
  onExtracted: (data: ExtractedCandidate) => void;
  onSwitchToManual: () => void;
}

export const SmartFillForm: React.FC<SmartFillFormProps> = ({ onExtracted, onSwitchToManual }) => {
  const [freeformText, setFreeformText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingInputRef = useRef<HTMLInputElement>(null);

  const handleExtract = async () => {
    if (freeformText.trim().length < 10 && uploadedFiles.length === 0) {
      toast.error("Please tell us a bit more about this person");
      return;
    }

    setIsExtracting(true);
    try {
      // If there are uploaded files (screenshots/recordings), convert to base64 for AI processing
      let combinedText = freeformText;
      
      if (uploadedFiles.length > 0) {
        const imagePromises = uploadedFiles.filter(f => f.type.startsWith("image/")).map(async (file) => {
          const buffer = await file.arrayBuffer();
          const uint8 = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          return btoa(binary);
        });
        
        const base64Images = await Promise.all(imagePromises);
        
        if (base64Images.length > 0) {
          combinedText = `${freeformText}\n\n[User also uploaded ${uploadedFiles.length} screenshot(s)/recording(s) for analysis]`;
        }
      }

      const { data, error } = await supabase.functions.invoke("extract-candidate-info", {
        body: { freeformText: combinedText },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.extracted) {
        const fieldsFound = Object.values(data.extracted).filter(v => v !== null && v !== undefined).length;
        toast.success(`Filled ${fieldsFound} fields from your description!`);
        setExtracted(true);
        onExtracted(data.extracted);
      }
    } catch (err) {
      console.error("Extraction error:", err);
      toast.error("Failed to extract info. Try again or fill manually.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setFreeformText(prev => prev ? `${prev} ${text}` : text);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      const isImage = f.type.startsWith("image/");
      if (!isImage) {
        toast.error(`${f.name} is not an image file`);
        return false;
      }
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 20MB)`);
        return false;
      }
      return true;
    });
    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRecordingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      const isVideo = f.type.startsWith("video/");
      if (!isVideo) {
        toast.error(`${f.name} is not a video/recording file`);
        return false;
      }
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 20MB). Try a shorter clip.`);
        return false;
      }
      return true;
    });
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} recording${validFiles.length > 1 ? "s" : ""} added!`);
    }
    if (recordingInputRef.current) recordingInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleScreenRecord = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.error("Screen recording is not supported in this browser");
        return;
      }

      toast.info("Select the screen or window to record");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4",
      });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        const file = new File([blob], `screen-recording-${Date.now()}.webm`, { type: blob.type });
        
        if (file.size > 20 * 1024 * 1024) {
          toast.error("Recording too large (max 20MB). Try a shorter recording.");
          return;
        }
        
        setUploadedFiles(prev => [...prev, file]);
        toast.success("Screen recording added!");
      };

      mediaRecorder.start();
      toast.info("Recording... Click stop sharing when done", { duration: 10000 });

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      };
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Screen record error:", err);
        toast.error("Failed to start screen recording");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Tell D.E.V.I. Everything
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Describe this person in your own words, upload screenshots, record your screen, or just talk — and we'll fill in the profile for you.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload & Record Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="w-5 h-5 text-primary" />
              Screenshots
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs"
              onClick={() => recordingInputRef.current?.click()}
            >
              <FileVideo className="w-5 h-5 text-primary" />
              Recording
              <span className="text-[9px] text-muted-foreground leading-none">Upload video</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs relative"
              onClick={() => {
                const voiceBtn = document.querySelector('[data-voice-trigger] button') as HTMLButtonElement;
                if (voiceBtn) voiceBtn.click();
              }}
            >
              <Mic className="w-5 h-5 text-primary" />
              Voice to Text
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={recordingInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleRecordingUpload}
          />

          {/* Uploaded files preview */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} attached
              </p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg border border-border/50 bg-muted/30 overflow-hidden"
                  >
                    {file.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-16 h-16 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 flex flex-col items-center justify-center gap-1">
                        <FileVideo className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground truncate max-w-[56px]">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Freeform text area with voice */}
          <div className="relative">
            <Textarea
              value={freeformText}
              onChange={(e) => setFreeformText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isFocused ? "" : `Example: "His name is Jake, he's 28, we met on Hinge. He's 6'1, works in tech as a software engineer. He's from Chicago. His parents are divorced — his dad left when he was young so he has some abandonment issues. He's avoidant, never been in a relationship longer than a year. He drinks socially, doesn't smoke. He wants kids eventually. He's really funny and smart but sometimes emotionally unavailable. We've been texting for 2 weeks..."`}
              className="min-h-[160px] text-sm pb-12"
              maxLength={3000}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground mr-1">{freeformText.length}/3000</span>
              <div data-voice-trigger>
                <VoiceInputButton 
                  onTranscript={handleVoiceTranscript}
                  onPartialTranscript={(text) => {
                    // Show partial in real-time
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Mic className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Upload screenshots, record your screen, or tap the mic to voice-text everything you know about them.
            </p>
          </div>

          <Button
            onClick={handleExtract}
            disabled={isExtracting || (freeformText.trim().length < 10 && uploadedFiles.length === 0)}
            className="w-full"
            size="lg"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                D.E.V.I. is reading...
              </>
            ) : extracted ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Re-analyze & Update
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-Fill Profile
              </>
            )}
          </Button>

          {extracted && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center text-muted-foreground"
            >
              ✅ Fields filled! Review and edit anything below, then save.
            </motion.p>
          )}

          <Button
            variant="ghost"
            onClick={onSwitchToManual}
            className="w-full text-xs text-muted-foreground"
          >
            Skip — I'll fill it in manually
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
