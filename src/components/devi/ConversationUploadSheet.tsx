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
  icon: string;
  color: string;
}

const PLATFORMS: Platform[] = [
  { id: "imessage", label: "iMessage / SMS", icon: "💬", color: "bg-green-500/10 text-green-600" },
  { id: "whatsapp", label: "WhatsApp", icon: "📱", color: "bg-emerald-500/10 text-emerald-600" },
  { id: "instagram", label: "Instagram DMs", icon: "📸", color: "bg-pink-500/10 text-pink-600" },
  { id: "tiktok", label: "TikTok DMs", icon: "🎵", color: "bg-foreground/5 text-foreground" },
  { id: "snapchat", label: "Snapchat", icon: "👻", color: "bg-yellow-500/10 text-yellow-600" },
  { id: "facebook", label: "Facebook Messenger", icon: "💙", color: "bg-blue-500/10 text-blue-600" },
  { id: "hinge", label: "Hinge / Dating App", icon: "💕", color: "bg-rose-500/10 text-rose-600" },
  { id: "other", label: "Other", icon: "💬", color: "bg-muted text-muted-foreground" },
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
  const [step, setStep] = useState<"upload" | "platform" | "instructions">("upload");
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setUploading(true);

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

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          setFiles((prev) => [
            ...prev,
            {
              data: reader.result as string,
              type: isVideo ? "conversation_video" : "text_screenshot",
              isVideo,
              name: file.name,
            },
          ]);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setUploading(false);
    e.target.value = "";
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <span key={i} className="font-semibold text-foreground">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
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
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
                Select Platform
              </p>
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlatform(p)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg", p.color)}>
                    {p.icon}
                  </div>
                  <span className="flex-1 text-left text-sm font-medium">{p.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
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
                    Videos or screenshots • Max 50MB
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
