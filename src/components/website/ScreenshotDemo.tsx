import React, { useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Camera, AlertTriangle, Heart, Shield } from "lucide-react";

const ANALYSIS_STEPS = [
  "Analyzing conversation tone...",
  "Detecting communication patterns...",
  "Evaluating emotional dynamics...",
];

const ANALYSIS_RESULT = {
  flags: [
    { type: "red", label: "Breadcrumbing pattern", icon: AlertTriangle },
    { type: "green", label: "Shows vulnerability", icon: Heart },
    { type: "green", label: "Respects boundaries", icon: Shield },
  ],
  insight:
    "This person initiates contact inconsistently — enthusiastic one week, silent the next. Classic breadcrumbing. Track their follow-through over the next 7 days.",
};

export const ScreenshotDemo: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [phase, setPhase] = useState<"idle" | "uploading" | "analyzing" | "result">("idle");
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase("uploading"), 800);
    const t2 = setTimeout(() => setPhase("analyzing"), 2000);
    const t3 = setTimeout(() => setStepIndex(1), 2800);
    const t4 = setTimeout(() => setStepIndex(2), 3500);
    const t5 = setTimeout(() => setPhase("result"), 4200);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="space-y-2.5 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Camera className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground leading-tight">Screenshot Analysis</p>
          <p className="text-[8px] text-muted-foreground">Upload a text conversation</p>
        </div>
      </div>

      {/* Upload area / States */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[9px] text-muted-foreground text-center">Tap to upload screenshot</p>
          </motion.div>
        )}

        {phase === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-muted/50 p-3 space-y-2"
          >
            {/* Fake screenshot preview */}
            <div className="rounded-lg bg-background border border-border p-2 space-y-1.5">
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                <div className="bg-muted rounded-lg rounded-bl-sm px-2 py-1 flex-1">
                  <p className="text-[8px] text-muted-foreground">Hey, sorry I disappeared lol. Been sooo busy 😅</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-primary/10 rounded-lg rounded-br-sm px-2 py-1">
                  <p className="text-[8px] text-foreground">No worries! I was wondering if you still wanted to grab dinner this week?</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                <div className="bg-muted rounded-lg rounded-bl-sm px-2 py-1 flex-1">
                  <p className="text-[8px] text-muted-foreground">Definitely!! Let me check my schedule and get back to you 🥰</p>
                </div>
              </div>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2 }}
              />
            </div>
            <p className="text-[8px] text-muted-foreground text-center">Uploading...</p>
          </motion.div>
        )}

        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-muted/50 p-4 flex flex-col items-center gap-3"
          >
            <motion.div
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <div className="space-y-1 w-full">
              {ANALYSIS_STEPS.map((step, i) => (
                <motion.p
                  key={step}
                  className={`text-[9px] ${i <= stepIndex ? "text-foreground font-medium" : "text-muted-foreground/40"}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.6 }}
                >
                  {i <= stepIndex ? "✓ " : "○ "}{step}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {/* Flags */}
            <div className="space-y-1">
              {ANALYSIS_RESULT.flags.map((flag, i) => (
                <motion.div
                  key={flag.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-medium ${
                    flag.type === "red"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-success/10 text-success"
                  }`}
                >
                  <flag.icon className="w-3 h-3" />
                  {flag.label}
                </motion.div>
              ))}
            </div>

            {/* AI Insight */}
            <motion.div
              className="p-2 rounded-lg bg-primary/5 border border-primary/10"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-start gap-1.5">
                <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <p className="text-[8px] text-foreground leading-relaxed">
                  <strong>D.E.V.I.:</strong> {ANALYSIS_RESULT.insight}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
