import React, { useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  Smartphone,
  Video,
  ImagePlus,
  X,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Platform {
  id: string;
  label: string;
  abbr: string;
}

const PLATFORMS: Platform[] = [
  { id: "imessage", label: "iMessage / SMS", abbr: "iM" },
  { id: "whatsapp", label: "WhatsApp", abbr: "WA" },
  { id: "instagram", label: "Instagram DMs", abbr: "IG" },
  { id: "tiktok", label: "TikTok DMs", abbr: "TT" },
  { id: "snapchat", label: "Snapchat", abbr: "SC" },
  { id: "facebook", label: "Messenger", abbr: "FB" },
  { id: "hinge", label: "Hinge / Dating App", abbr: "H" },
  { id: "other", label: "Other", abbr: "?" },
];


interface ConversationUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName?: string;
  onSubmit: (data: {
    platform: string;
    files: { data: string; type: string; isVideo: boolean }[];
    perspective: "me" | "them";
  }) => void;
}

export function ConversationUploadSheet({
  open,
  onOpenChange,
  candidateName,
  onSubmit,
}: ConversationUploadSheetProps) {
  const [step, setStep] = useState<"upload" | "platform">("upload");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [files, setFiles] = useState<{ data: string; type: string; isVideo: boolean; name: string }[]>([]);
  const [perspective, setPerspective] = useState<"me" | "them">("me");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setSelectedPlatform(null);
    setFiles([]);
    setPerspective("me");
    setUploading(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleSelectPlatform = (platform: Platform) => {
    setSelectedPlatform(platform);
    if (files.length === 0) return;
    onSubmit({
      platform: platform.id,
      files: files.map((f) => ({ data: f.data, type: f.type, isVideo: f.isVideo })),
      perspective,
    });
    handleClose(false);
  };

  const compressImage = (file: File, maxDim = 1920): Promise<string> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("No canvas context")); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (err) {
          reject(err);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });

  /**
   * Extract evenly-spaced frames from a video as downscaled JPEGs.
   * Sending raw video data URLs to vision models blows up edge-function memory,
   * so we convert the recording to a handful of screenshots instead.
   */
  const extractVideoFrames = (
    file: File,
    { frameCount = 6, maxDim = 1280, quality = 0.8 }: { frameCount?: number; maxDim?: number; quality?: number } = {}
  ): Promise<string[]> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      video.src = url;

      const cleanup = () => URL.revokeObjectURL(url);

      video.onloadedmetadata = async () => {
        try {
          const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
          if (!duration) {
            cleanup();
            reject(new Error("Could not read video duration"));
            return;
          }

          const vw = video.videoWidth || 720;
          const vh = video.videoHeight || 1280;
          let width = vw;
          let height = vh;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            cleanup();
            reject(new Error("No canvas context"));
            return;
          }

          // Pick frames evenly across the clip, skipping the very first/last frames
          // which are often blank or transition frames.
          const count = Math.max(2, Math.min(frameCount, 10));
          const targets: number[] = [];
          for (let i = 0; i < count; i++) {
            const t = ((i + 1) / (count + 1)) * duration;
            targets.push(Math.min(Math.max(t, 0), Math.max(duration - 0.05, 0)));
          }

          const frames: string[] = [];
          for (const t of targets) {
            await new Promise<void>((res, rej) => {
              const onSeeked = () => {
                video.removeEventListener("seeked", onSeeked);
                video.removeEventListener("error", onErr);
                try {
                  ctx.drawImage(video, 0, 0, width, height);
                  frames.push(canvas.toDataURL("image/jpeg", quality));
                  res();
                } catch (e) {
                  rej(e);
                }
              };
              const onErr = () => {
                video.removeEventListener("seeked", onSeeked);
                video.removeEventListener("error", onErr);
                rej(new Error("Video seek failed"));
              };
              video.addEventListener("seeked", onSeeked);
              video.addEventListener("error", onErr);
              try {
                video.currentTime = t;
              } catch (e) {
                rej(e);
              }
            });
          }

          cleanup();
          resolve(frames);
        } catch (err) {
          cleanup();
          reject(err);
        }
      };

      video.onerror = () => {
        cleanup();
        reject(new Error("Failed to load video"));
      };
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setUploading(true);

    try {
      for (const file of selectedFiles) {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (!isVideo && !isImage) {
          toast.error(`${file.name}: Only images and videos are supported`);
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name}: File must be under 50MB`);
          continue;
        }

        try {
          if (isImage) {
            const dataUrl = await compressImage(file);
            setFiles((prev) => [
              ...prev,
              { data: dataUrl, type: "text_screenshot", isVideo: false, name: file.name },
            ]);
          } else {
            // Extract frames so we send small JPEGs to the AI instead of a huge video blob
            const frames = await extractVideoFrames(file, { frameCount: 6, maxDim: 1280, quality: 0.8 });
            if (!frames.length) {
              toast.error(`${file.name}: Could not read video frames`);
              continue;
            }
            setFiles((prev) => [
              ...prev,
              ...frames.map((data, i) => ({
                data,
                type: "text_screenshot",
                isVideo: false,
                name: `${file.name} — frame ${i + 1}/${frames.length}`,
              })),
            ]);
          }
        } catch (err) {
          console.error("Error processing file:", err);
          toast.error(`${file.name}: Failed to process`);
        }
      }
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };


  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-2xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {step === "platform" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setStep("upload")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <SheetTitle className="text-left">
              {step === "upload" && "Analyze a Conversation"}
              {step === "platform" && "Where is this from?"}
            </SheetTitle>
          </div>
          {step === "upload" && (
            <p className="text-sm text-muted-foreground mt-1">
              Upload a screen recording or screenshots of any conversation
              {candidateName ? ` with ${candidateName}` : ""} and D.E.V.I. will break it down.
            </p>
          )}
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* STEP 1: Platform Selection */}
          {step === "platform" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This helps D.E.V.I. understand the chat layout better.
              </p>
              <div className="flex flex-col gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlatform(p)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all",
                      "border-border/60 hover:border-primary/60 hover:bg-primary/5",
                      "active:scale-[0.98]"
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{p.abbr}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{p.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* How to tip */}
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Tip: Screen record the conversation</p>
                    <p><span className="font-medium">iPhone:</span> Swipe down → Control Center → Screen Recording</p>
                    <p><span className="font-medium">Android:</span> Swipe down → Quick Settings → Screen Record</p>
                    <p className="pt-1 text-foreground/80">
                      ⏱️ Keep recordings <span className="font-semibold">under 10 seconds</span> — scroll slowly through the chat. Longer videos may fail to analyze.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload zone */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center gap-3"
                disabled={uploading}
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">
                    {uploading ? "Processing..." : "Tap to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Screenshots or short videos (~10s) • Max 50MB
                  </p>
                </div>
              </button>

              {/* Uploaded files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    {files.length} file{files.length > 1 ? "s" : ""} ready
                  </p>
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {f.isVideo ? (
                          <Video className="w-5 h-5 text-primary" />
                        ) : (
                          <ImagePlus className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.isVideo ? "Video" : "Screenshot"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <button
                          onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 hover:bg-muted rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Perspective toggle */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Messages on the right side are from:
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPerspective("me")}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all",
                        perspective === "me"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      Me
                    </button>
                    <button
                      onClick={() => setPerspective("them")}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all",
                        perspective === "them"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      Them
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {step === "upload" && files.length > 0 && (
          <div className="shrink-0 border-t border-border p-4 safe-area-bottom">
            <Button
              className="w-full gap-2 h-12 text-base font-semibold rounded-xl bg-[image:var(--gradient-hero)]"
              onClick={() => setStep("platform")}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </SheetContent>
    </Sheet>
  );
}
