import React, { useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Camera, AlertTriangle, Heart, Shield, TrendingUp, ChevronDown } from "lucide-react";

const DEMO_MESSAGES: { role: "user" | "assistant"; content: React.ReactNode; delay: number }[] = [
  {
    role: "user",
    delay: 0.6,
    content: (
      <div className="space-y-1.5">
        {/* Fake screenshot thumbnail */}
        <div className="rounded-lg bg-background/50 border border-border/50 p-1.5 space-y-1">
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-muted/80 shrink-0" />
            <div className="bg-muted/60 rounded px-1.5 py-0.5 text-[6px] text-muted-foreground">Hey sorry I disappeared lol 😅</div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded px-1.5 py-0.5 text-[6px] text-foreground">Still down for dinner?</div>
          </div>
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-muted/80 shrink-0" />
            <div className="bg-muted/60 rounded px-1.5 py-0.5 text-[6px] text-muted-foreground">Definitely!! Let me check 🥰</div>
          </div>
          <div className="text-center text-[5px] text-muted-foreground/40 italic">3 days later...</div>
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded px-1.5 py-0.5 text-[6px] text-foreground">Did you check? 😊</div>
          </div>
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-muted/80 shrink-0" />
            <div className="bg-muted/60 rounded px-1.5 py-0.5 text-[6px] text-muted-foreground">Omg yes!! This week is crazy 😭</div>
          </div>
        </div>
        <p className="text-[8px]">Analyze this text thread — is this a red flag?</p>
      </div>
    ),
  },
  {
    role: "assistant",
    delay: 2.4,
    content: (
      <div className="space-y-2">
        <p className="text-[8px] leading-relaxed">
          I see a <strong>breadcrumbing pattern</strong> here. Let me break it down:
        </p>

        {/* Flags inline */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[7px]">
            <AlertTriangle className="w-2.5 h-2.5 text-destructive shrink-0" />
            <span className="font-semibold text-destructive">Inconsistent follow-through</span>
            <span className="text-muted-foreground">— promises but never commits</span>
          </div>
          <div className="flex items-center gap-1 text-[7px]">
            <AlertTriangle className="w-2.5 h-2.5 text-destructive shrink-0" />
            <span className="font-semibold text-destructive">You're always initiating</span>
            <span className="text-muted-foreground">— they respond, but never lead</span>
          </div>
          <div className="flex items-center gap-1 text-[7px]">
            <Heart className="w-2.5 h-2.5 text-success shrink-0" />
            <span className="font-semibold text-success">Warm tone</span>
            <span className="text-muted-foreground">— they like you, but not enough to act</span>
          </div>
        </div>

        {/* Mini score bar */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[7px]">
            <span className="text-muted-foreground">Their effort level</span>
            <span className="font-bold text-destructive">Low</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-destructive"
              initial={{ width: 0 }}
              animate={{ width: "28%" }}
              transition={{ duration: 0.8, delay: 3.2 }}
            />
          </div>
        </div>

        <div className="border-l-2 border-primary/30 pl-2">
          <p className="text-[7px] text-foreground leading-relaxed">
            <strong>My advice:</strong> Stop initiating for 7 days. If they don't reach out with a real plan, you have your answer. You deserve someone who <em>acts</em>, not just talks. 💜
          </p>
        </div>
      </div>
    ),
  },
];

export const ScreenshotDemo: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timers = DEMO_MESSAGES.map((msg, i) =>
      setTimeout(() => setVisibleCount(i + 1), msg.delay * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="flex flex-col h-full pt-1" style={{ minHeight: 420 }}>
      {/* App header bar — matches real D.E.V.I. page */}
      <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
        <div className="w-6 h-6 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-foreground leading-tight">D.E.V.I.</p>
          <p className="text-[7px] text-muted-foreground truncate">Marcus T. • Active</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <Camera className="w-2.5 h-2.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-hidden py-2 space-y-3">
        <AnimatePresence>
          {DEMO_MESSAGES.slice(0, visibleCount).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {msg.role === "user" ? (
                /* User bubble — right-aligned */
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl rounded-br-sm p-2 bg-muted">
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* Assistant — full width, avatar + content like real app */
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-md bg-[image:var(--gradient-primary)] flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                    <span className="text-[8px] font-medium text-muted-foreground">D.E.V.I.</span>
                  </div>
                  <div className="pl-6">
                    {msg.content}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator while waiting for assistant */}
        {visibleCount === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-[image:var(--gradient-primary)] flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
              <span className="text-[8px] font-medium text-muted-foreground">D.E.V.I.</span>
            </div>
            <div className="pl-6 flex items-center gap-1">
              {[0, 1, 2].map((j) => (
                <motion.div
                  key={j}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: j * 0.12 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar — matches real app */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/40">
        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Camera className="w-2.5 h-2.5 text-muted-foreground" />
        </div>
        <div className="flex-1 text-[8px] px-2.5 py-1.5 rounded-full bg-muted text-muted-foreground/50">
          Ask about a text, profile, or pattern...
        </div>
        <div className="w-5 h-5 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center shrink-0">
          <Send className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
};
