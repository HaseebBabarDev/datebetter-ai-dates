import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MessageCircle,
  Layers,
  Image,
  FileVideo,
  X,
  Mic,
  TrendingUp,
  Unlink,
  Heart,
  Search,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { VoiceInputButton } from "@/components/devi/VoiceInputButton";
import { useOnboarding } from "@/contexts/OnboardingContext";

const GOALS = [
  { value: "evaluate", icon: TrendingUp, label: "Evaluate someone I'm dating", desc: "AI scoring & red flag detection" },
  { value: "detachment", icon: Unlink, label: "Detach from someone", desc: "Guided plan to move on" },
  { value: "healing", icon: Heart, label: "Heal from a past relationship", desc: "Process & rebuild self-worth" },
  { value: "explore", icon: Search, label: "Start dating better", desc: "Learn your patterns & what to look for" },
  { value: "checkup", icon: Stethoscope, label: "Relationship check-up", desc: "Assess a current situation" },
];

type Step = "basics" | "goals" | "upload" | "choice";

const OnboardingChoiceScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateData } = useOnboarding();

  const storedName = localStorage.getItem("onboarding_name") || "";
  const storedGoal = localStorage.getItem("onboarding_goal") || "";
  
  // Skip basics+goals if already collected from pre-auth onboarding
  const initialStep: Step = storedName && storedGoal ? "upload" : storedName ? "goals" : "basics";
  
  const [step, setStep] = useState<Step>(initialStep);
  const [name, setName] = useState(storedName);
  const [age, setAge] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(storedGoal);

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [freeformText, setFreeformText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGoToDevi = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // Save basics to profile
      const updates: Record<string, unknown> = {
        onboarding_completed: true,
        onboarding_step: 0,
      };
      if (name.trim()) updates.name = name.trim();

      await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      // Store context for Devi
      const contextParts: string[] = [];
      if (selectedGoal) {
        localStorage.setItem("onboarding_goal", selectedGoal);
        contextParts.push(`Goal: ${GOALS.find(g => g.value === selectedGoal)?.label || selectedGoal}`);
      }
      if (freeformText.trim()) contextParts.push(freeformText.trim());
      if (uploadedFiles.length > 0) {
        contextParts.push(`[User uploaded ${uploadedFiles.length} file(s) for analysis]`);
      }
      if (contextParts.length > 0) {
        localStorage.setItem("onboarding_upload_context", contextParts.join("\n"));
      }

      navigate("/devi?firstTime=true", { replace: true });
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFullSetup = () => {
    if (name.trim()) {
      localStorage.setItem("onboarding_name", name.trim());
    }
    if (selectedGoal) {
      localStorage.setItem("onboarding_goal", selectedGoal);
    }
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

  const canProceedFromBasics = name.trim().length > 0;
  const canProceedFromGoals = selectedGoal.length > 0;

  return (
    <div className="min-h-[100dvh] bg-[image:var(--gradient-page)] flex flex-col">
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col safe-area-inset">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[image:var(--gradient-hero)] mb-2 shadow-[var(--shadow-glow)]">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
        </motion.div>

        {/* Skip button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={handleGoToDevi}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Skip →
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Basics */}
          {step === "basics" && (
            <motion.div
              key="basics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 flex-1"
            >
              <div>
                <h1 className="text-xl font-bold text-foreground">Let's get started 👋</h1>
                <p className="text-sm text-muted-foreground mt-1">Just the basics so D.E.V.I. knows who you are</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="text-sm font-medium">What should we call you?</Label>
                    <VoiceInputButton onTranscript={(text) => setName(text.trim())} />
                  </div>
                  <Input
                    id="name"
                    placeholder="Your first name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="age" className="text-sm font-medium">How old are you?</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-11"
                    min={18}
                    max={99}
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep("goals")}
                disabled={!canProceedFromBasics}
                className="w-full py-5 text-base font-semibold rounded-2xl bg-[image:var(--gradient-hero)] hover:opacity-90 mt-4"
                size="lg"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Goals */}
          {step === "goals" && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 flex-1"
            >
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("basics")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-foreground">What brings you here, {name || "friend"}?</h2>
                  <p className="text-xs text-muted-foreground">This helps D.E.V.I. give you the right guidance</p>
                </div>
              </div>

              <div className="space-y-2">
                {GOALS.map((goal, idx) => {
                  const Icon = goal.icon;
                  const selected = selectedGoal === goal.value;
                  return (
                    <motion.button
                      key={goal.value}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      onClick={() => setSelectedGoal(goal.value)}
                      className={`w-full p-3 rounded-2xl border-2 text-left transition-all duration-200 ${
                        selected
                          ? "border-primary bg-primary/5 shadow-[var(--shadow-soft)]"
                          : "border-border/50 bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          selected ? "bg-[image:var(--gradient-hero)]" : "bg-muted"
                        }`}>
                          <Icon className={`w-4 h-4 ${selected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{goal.label}</h3>
                          <p className="text-xs text-muted-foreground">{goal.desc}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${selected ? "text-primary" : "text-muted-foreground/40"}`} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <Button
                onClick={() => setStep("upload")}
                disabled={!canProceedFromGoals}
                className="w-full py-5 text-base font-semibold rounded-2xl bg-[image:var(--gradient-hero)] hover:opacity-90 mt-2"
                size="lg"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 3: Upload + context */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 flex-1 flex flex-col"
            >
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("goals")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Got screenshots or recordings?</h2>
                  <p className="text-xs text-muted-foreground">Upload conversations — D.E.V.I. will analyze them</p>
                </div>
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
                    <div key={idx} className="relative group rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
                      {file.type.startsWith("image/") ? (
                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-14 h-14 object-cover" />
                      ) : (
                        <div className="w-14 h-14 flex flex-col items-center justify-center gap-1">
                          <FileVideo className="w-4 h-4 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">{file.name.split(".").pop()?.toUpperCase()}</span>
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
                  placeholder="Tell D.E.V.I. about yourself or the situation — or use the mic..."
                  className="min-h-[100px] text-sm pb-10"
                  maxLength={3000}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground mr-1">{freeformText.length}/3000</span>
                  <VoiceInputButton
                    onTranscript={(text) => setFreeformText((prev) => (prev ? `${prev} ${text}` : text))}
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep("choice")}
                className="w-full py-5 text-base font-semibold rounded-2xl bg-[image:var(--gradient-hero)] hover:opacity-90"
                size="lg"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <button
                onClick={() => setStep("choice")}
                className="text-xs text-muted-foreground hover:text-primary text-center transition-colors"
              >
                Skip — I'll share later
              </button>
            </motion.div>
          )}

          {/* Step 4: Choice - Chat or Full Setup */}
          {step === "choice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 flex-1"
            >
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("upload")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-foreground">How do you want to continue?</h2>
                  <p className="text-xs text-muted-foreground">You can always complete your profile later</p>
                </div>
              </div>

              {/* Option A: Chat with Devi */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={handleGoToDevi}
                disabled={isProcessing}
                className="w-full p-4 rounded-2xl bg-[image:var(--gradient-hero)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all group text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">Chat with D.E.V.I.</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-medium">Recommended</span>
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      Jump in now — add more info as you go
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white transition-colors shrink-0 mt-3" />
                </div>
              </motion.button>

              {/* Option B: Full manual */}
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
                      <span className="font-semibold text-foreground text-sm">Full Setup</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">~10 min</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Best for optimizing AI scoring & personalized advice
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-3" />
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 pt-4 pb-2">
          {(["basics", "goals", "upload", "choice"] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                s === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingChoiceScreen;
