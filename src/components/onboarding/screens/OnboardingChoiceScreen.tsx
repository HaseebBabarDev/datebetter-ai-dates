import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Upload,
  FileVideo,
  Image,
  Layers,
  ArrowRight,
  Sparkles,
  MessageCircle,
  X,
  Mic,
} from "lucide-react";
import { VoiceInputButton } from "@/components/devi/VoiceInputButton";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/contexts/OnboardingContext";

const OnboardingChoiceScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateData } = useOnboarding();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [freeformText, setFreeformText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGoToDevi = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // Mark onboarding as completed for quick path
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true, onboarding_step: 0 })
        .eq("user_id", user.id);

      // If there are uploaded files or text, store context for Devi
      if (freeformText.trim() || uploadedFiles.length > 0) {
        const contextParts: string[] = [];
        if (freeformText.trim()) {
          contextParts.push(freeformText.trim());
        }
        if (uploadedFiles.length > 0) {
          contextParts.push(
            `[User uploaded ${uploadedFiles.length} file(s) for analysis]`
          );
        }
        localStorage.setItem(
          "onboarding_upload_context",
          contextParts.join("\n")
        );
      }

      navigate("/devi?firstTime=true");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFullSetup = () => {
    updateData({ quickStartMode: false });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => {
      const isImage = f.type.startsWith("image/");
      const isVideo = f.type.startsWith("video/");
      if (!isImage && !isVideo) {
        toast.error(`${f.name} is not an image or video`);
        return false;
      }
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 20MB)`);
        return false;
      }
      return true;
    });
    setUploadedFiles((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const userName = localStorage.getItem("onboarding_name") || "there";

  return (
    <div className="min-h-[100dvh] bg-[image:var(--gradient-page)] flex flex-col">
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col safe-area-inset">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[image:var(--gradient-hero)] mb-3 shadow-[var(--shadow-glow)]">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Hey {userName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            How would you like to get started?
          </p>
        </motion.div>

        {!showUpload ? (
          <div className="space-y-3 flex-1">
            {/* Option A: Upload & Chat */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowUpload(true)}
              className="w-full p-4 rounded-2xl bg-[image:var(--gradient-hero)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      Upload & Chat with D.E.V.I.
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-medium">
                      Fastest
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-1">
                    Upload screenshots or recordings of conversations — D.E.V.I.
                    will analyze them and learn about you through chat
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white transition-colors shrink-0 mt-3" />
              </div>
            </motion.button>

            {/* Option B: Full manual onboarding */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleFullSetup}
              className="w-full p-4 rounded-2xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/30 transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">
                      Full Manual Setup
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      ~10 min
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Answer detailed questions for the most accurate AI scoring &
                    personalized insights
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-3" />
              </div>
            </motion.button>

            {/* Skip option */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center pt-2"
            >
              <button
                onClick={handleGoToDevi}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Skip for now — go straight to D.E.V.I.
              </button>
            </motion.div>
          </div>
        ) : (
          /* Upload UI */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 flex-1 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setShowUpload(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <h2 className="font-semibold text-sm">
                Upload & Tell D.E.V.I. About You
              </h2>
            </div>

            {/* Upload buttons */}
            <div className="grid grid-cols-2 gap-2">
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
                onClick={() => {
                  const uploadInput = document.createElement("input");
                  uploadInput.type = "file";
                  uploadInput.accept = "video/*";
                  uploadInput.multiple = true;
                  uploadInput.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    const files = Array.from(target.files || []);
                    const validFiles = files.filter((f) => {
                      if (f.size > 20 * 1024 * 1024) {
                        toast.error(`${f.name} is too large (max 20MB)`);
                        return false;
                      }
                      return true;
                    });
                    setUploadedFiles((prev) => [...prev, ...validFiles]);
                  };
                  uploadInput.click();
                }}
              >
                <FileVideo className="w-5 h-5 text-primary" />
                Upload Recording
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* File preview */}
            {uploadedFiles.length > 0 && (
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
                        className="w-14 h-14 object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 flex flex-col items-center justify-center gap-1">
                        <FileVideo className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">
                          {file.name.split(".").pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Text / Voice input */}
            <div className="relative flex-1">
              <Textarea
                value={freeformText}
                onChange={(e) => setFreeformText(e.target.value)}
                placeholder="Tell D.E.V.I. about yourself, your dating history, what you're looking for, or anything about someone you're seeing..."
                className="min-h-[120px] text-sm pb-10"
                maxLength={3000}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-1">
                  {freeformText.length}/3000
                </span>
                <VoiceInputButton
                  onTranscript={(text) =>
                    setFreeformText((prev) =>
                      prev ? `${prev} ${text}` : text
                    )
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <Mic className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Upload screenshots, recordings, or tap the mic — D.E.V.I. will
                learn about you through chat.
              </p>
            </div>

            {/* CTA */}
            <Button
              onClick={handleGoToDevi}
              disabled={isProcessing}
              className="w-full py-6 text-base font-semibold rounded-2xl bg-[image:var(--gradient-hero)] hover:opacity-90"
              size="lg"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat with D.E.V.I.
                </span>
              )}
            </Button>

            <button
              onClick={handleGoToDevi}
              className="text-xs text-muted-foreground hover:text-primary text-center transition-colors"
            >
              Skip uploads — just chat
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OnboardingChoiceScreen;
