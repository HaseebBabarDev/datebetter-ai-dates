import React, { useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Camera, AlertTriangle, Heart, Shield, TrendingUp, Eye } from "lucide-react";

const ANALYSIS_RESULT = {
  flags: [
    { type: "red", label: "Breadcrumbing pattern", icon: AlertTriangle },
    { type: "green", label: "Shows vulnerability", icon: Heart },
    { type: "green", label: "Respects boundaries", icon: Shield },
    { type: "yellow", label: "Inconsistent effort", icon: TrendingUp },
  ],
  scores: [
    { label: "Interest Level", value: 42, color: "hsl(var(--destructive))" },
    { label: "Consistency", value: 31, color: "hsl(var(--caution))" },
    { label: "Respect", value: 78, color: "hsl(var(--success))" },
  ],
  insight:
    "Classic breadcrumbing — enthusiastic one week, silent the next. Their interest spikes only when you pull away. Track follow-through over 7 days before investing more.",
};

export const ScreenshotDemo: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [phase, setPhase] = useState<"upload" | "scanning" | "result">("upload");
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase("scanning"), 1200);
    const t2 = setTimeout(() => setPhase("result"), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [inView]);

  useEffect(() => {
    if (phase !== "scanning") return;
    const interval = setInterval(() => {
      setScanLine((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 30);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div ref={ref} className="flex flex-col h-full pt-1" style={{ minHeight: 420 }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Camera className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground leading-tight">Screenshot Analysis</p>
          <p className="text-[8px] text-muted-foreground">AI-powered text analysis</p>
        </div>
        <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold flex items-center gap-0.5">
          <Eye className="w-2.5 h-2.5" /> Live
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 py-2 space-y-2 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Phase 1: Screenshot preview with upload animation */}
          {phase === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-2"
            >
              {/* Fake text conversation */}
              <div className="rounded-xl bg-muted/40 border border-border/50 p-2 space-y-2">
                <div className="flex gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-muted shrink-0 mt-0.5" />
                  <div className="bg-muted rounded-lg rounded-bl-sm px-2 py-1.5 flex-1">
                    <p className="text-[8px] text-muted-foreground">Hey, sorry I disappeared lol 😅 Been sooo busy</p>
                  </div>
                </div>
                <div className="flex gap-1.5 justify-end">
                  <div className="bg-primary/15 rounded-lg rounded-br-sm px-2 py-1.5 max-w-[80%]">
                    <p className="text-[8px] text-foreground">No worries! Still down for dinner this week?</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-muted shrink-0 mt-0.5" />
                  <div className="bg-muted rounded-lg rounded-bl-sm px-2 py-1.5 flex-1">
                    <p className="text-[8px] text-muted-foreground">Definitely!! Let me check my schedule 🥰</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-muted shrink-0 mt-0.5" />
                  <div className="bg-muted/50 rounded-lg rounded-bl-sm px-2 py-1.5 flex-1">
                    <p className="text-[7px] text-muted-foreground/50 italic">3 days later...</p>
                  </div>
                </div>
                <div className="flex gap-1.5 justify-end">
                  <div className="bg-primary/15 rounded-lg rounded-br-sm px-2 py-1.5 max-w-[80%]">
                    <p className="text-[8px] text-foreground">Hey! Did you check your schedule? 😊</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-muted shrink-0 mt-0.5" />
                  <div className="bg-muted rounded-lg rounded-bl-sm px-2 py-1.5 flex-1">
                    <p className="text-[8px] text-muted-foreground">Omg yes!! This week is crazy tho 😭 next week?</p>
                  </div>
                </div>
              </div>

              {/* Upload progress */}
              <div className="space-y-1">
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.0 }}
                  />
                </div>
                <p className="text-[7px] text-muted-foreground text-center">Uploading screenshot...</p>
              </div>
            </motion.div>
          )}

          {/* Phase 2: Scanning animation */}
          {phase === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* Screenshot with scan line */}
              <div className="relative rounded-xl bg-muted/40 border border-border/50 p-2 space-y-2 overflow-hidden">
                {/* Scan line overlay */}
                <motion.div
                  className="absolute left-0 right-0 h-[2px] bg-primary/80 z-10"
                  style={{ top: `${scanLine}%` }}
                />
                <motion.div
                  className="absolute left-0 right-0 h-8 bg-gradient-to-b from-primary/10 to-transparent z-10"
                  style={{ top: `${scanLine}%` }}
                />

                {/* Same conversation but dimmed */}
                <div className="opacity-50 space-y-2">
                  <div className="flex gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-muted shrink-0 mt-0.5" />
                    <div className="bg-muted rounded-lg px-2 py-1.5 flex-1">
                      <p className="text-[8px] text-muted-foreground">Hey, sorry I disappeared lol 😅</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <div className="bg-primary/15 rounded-lg px-2 py-1.5">
                      <p className="text-[8px] text-foreground">Still down for dinner?</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-muted shrink-0 mt-0.5" />
                    <div className="bg-muted rounded-lg px-2 py-1.5 flex-1">
                      <p className="text-[8px] text-muted-foreground">Definitely!! 🥰</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-muted shrink-0 mt-0.5" />
                    <div className="bg-muted/50 rounded-lg px-2 py-1.5 flex-1">
                      <p className="text-[7px] text-muted-foreground/50 italic">3 days later...</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <div className="bg-primary/15 rounded-lg px-2 py-1.5">
                      <p className="text-[8px] text-foreground">Did you check? 😊</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis progress */}
              <div className="space-y-1.5">
                {["Detecting tone patterns...", "Analyzing response timing...", "Evaluating commitment signals..."].map((step, i) => (
                  <motion.div
                    key={step}
                    className="flex items-center gap-1.5"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                  >
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full border border-primary flex items-center justify-center"
                      animate={{ backgroundColor: ["transparent", "hsl(var(--primary))"] }}
                      transition={{ delay: i * 0.5 + 0.4, duration: 0.2 }}
                    >
                      <motion.div
                        className="w-1 h-1 rounded-full bg-primary-foreground"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.5 + 0.5 }}
                      />
                    </motion.div>
                    <p className="text-[8px] text-muted-foreground">{step}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase 3: Full results */}
          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5"
            >
              {/* Score bars */}
              <div className="space-y-1.5">
                {ANALYSIS_RESULT.scores.map((score, i) => (
                  <motion.div
                    key={score.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="space-y-0.5"
                  >
                    <div className="flex justify-between">
                      <span className="text-[8px] text-muted-foreground">{score.label}</span>
                      <span className="text-[8px] font-bold text-foreground">{score.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: score.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${score.value}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Flags */}
              <div className="grid grid-cols-2 gap-1">
                {ANALYSIS_RESULT.flags.map((flag, i) => (
                  <motion.div
                    key={flag.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[7px] font-medium ${
                      flag.type === "red"
                        ? "bg-destructive/10 text-destructive"
                        : flag.type === "yellow"
                        ? "bg-caution/10 text-caution"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    <flag.icon className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{flag.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* AI Insight card */}
              <motion.div
                className="p-2 rounded-xl bg-primary/5 border border-primary/20"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-start gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-[7px] font-bold text-primary mb-0.5">D.E.V.I. Analysis</p>
                    <p className="text-[7px] text-foreground leading-relaxed">
                      {ANALYSIS_RESULT.insight}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Verdict badge */}
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  <span className="text-[8px] font-bold text-destructive">Proceed with caution</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
