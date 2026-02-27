import React, { useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Sparkles, Send, ImagePlus, AlertTriangle, Heart } from "lucide-react";

const DEMO_MESSAGES: { role: "user" | "assistant"; content: React.ReactNode; delay: number }[] = [
  {
    role: "user",
    delay: 0.6,
    content: (
      <div className="space-y-1">
        {/* Fake screenshot thumbnail */}
        <div className="rounded-md bg-background/50 border border-border/50 p-1 space-y-[3px]">
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-muted/80 shrink-0" />
            <div className="bg-muted/60 rounded px-1 py-[2px] text-[5px] text-muted-foreground leading-tight">Hey sorry I disappeared lol 😅</div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded px-1 py-[2px] text-[5px] text-foreground leading-tight">Still down for dinner?</div>
          </div>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-muted/80 shrink-0" />
            <div className="bg-muted/60 rounded px-1 py-[2px] text-[5px] text-muted-foreground leading-tight">Definitely!! Let me check 🥰</div>
          </div>
          <div className="text-center text-[4px] text-muted-foreground/40 italic">3 days later...</div>
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded px-1 py-[2px] text-[5px] text-foreground leading-tight">Did you check? 😊</div>
          </div>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-muted/80 shrink-0" />
            <div className="bg-muted/60 rounded px-1 py-[2px] text-[5px] text-muted-foreground leading-tight">Omg yes!! This week is crazy 😭</div>
          </div>
        </div>
        <p className="text-[6px] leading-tight">Analyze this text thread — is this a red flag?</p>
      </div>
    ),
  },
  {
    role: "assistant",
    delay: 2.4,
    content: (
      <div className="space-y-2">
        {/* Header — matches ChatGPTMessage h3 style */}
        <p className="text-[7.5px] font-semibold text-foreground">
          Breadcrumbing Pattern Detected
        </p>

        <p className="text-[6.5px] leading-relaxed text-foreground">
          I see a clear pattern here — let me break down what's happening and what it means for you.
        </p>

        {/* Horizontal rule — matches ChatGPTMessage section dividers */}
        <hr className="border-border" />

        {/* Section header */}
        <p className="text-[7px] font-semibold text-foreground">
          What I'm Seeing
        </p>

        {/* Bullet list — matches ChatGPTMessage ul style with dot + text */}
        <div className="space-y-1">
          <div className="flex gap-1 items-start text-[6px] leading-relaxed">
            <span className="text-muted-foreground mt-[2px] shrink-0">•</span>
            <span><strong className="font-semibold">Inconsistent follow-through</strong> — enthusiastic responses ("Definitely!!") but zero follow-through on plans</span>
          </div>
          <div className="flex gap-1 items-start text-[6px] leading-relaxed">
            <span className="text-muted-foreground mt-[2px] shrink-0">•</span>
            <span><strong className="font-semibold">You're always initiating</strong> — they respond warmly, but never take the lead on making plans happen</span>
          </div>
          <div className="flex gap-1 items-start text-[6px] leading-relaxed">
            <span className="text-muted-foreground mt-[2px] shrink-0">•</span>
            <span><strong className="font-semibold">Excuses without solutions</strong> — "this week is crazy" with no alternative offered</span>
          </div>
        </div>

        <hr className="border-border" />

        {/* Flags section — red/green inline badges */}
        <p className="text-[7px] font-semibold text-foreground">
          Flags
        </p>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[6px]">
            <AlertTriangle className="w-2 h-2 text-destructive shrink-0" />
            <span className="text-destructive font-semibold">Breadcrumbing</span>
          </div>
          <div className="flex items-center gap-1 text-[6px]">
            <AlertTriangle className="w-2 h-2 text-destructive shrink-0" />
            <span className="text-destructive font-semibold">Low effort investment</span>
          </div>
          <div className="flex items-center gap-1 text-[6px]">
            <Heart className="w-2 h-2 text-success shrink-0" />
            <span className="text-success font-semibold">Warm tone (surface level)</span>
          </div>
        </div>

        <hr className="border-border" />

        {/* Effort bar */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[6px]">
            <span className="text-muted-foreground">Their effort level</span>
            <span className="font-bold text-destructive">Low</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-destructive"
              initial={{ width: 0 }}
              animate={{ width: "28%" }}
              transition={{ duration: 0.8, delay: 3.2 }}
            />
          </div>
        </div>

        {/* Blockquote advice — matches ChatGPTMessage emphasis block */}
        <div className="border-l-2 border-foreground/20 pl-1.5">
          <p className="text-[6.5px] font-medium text-foreground leading-relaxed">
            Stop initiating for 7 days. If they don't reach out with a real plan, you have your answer. You deserve someone who <em>acts</em>, not just talks. 💜
          </p>
        </div>

        {/* Quick replies — matches real app */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {["Tell me more", "What should I do?", "Help me rewire"].map((r) => (
            <div key={r} className="px-1.5 py-[3px] text-[5px] font-medium rounded-full border border-border text-foreground">
              {r}
            </div>
          ))}
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
    <div ref={ref} className="flex flex-col h-full" style={{ minHeight: 440 }}>
      {/* Header — matches real Devi.tsx */}
      <div className="flex items-center gap-1 px-1 py-1.5 border-b border-border">
        <div className="w-5 h-5 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[8px] font-semibold text-foreground leading-tight">D.E.V.I.</p>
          <p className="text-[6px] text-muted-foreground">Your dating advisor</p>
        </div>
      </div>

      {/* Candidate selector bar */}
      <div className="border-b border-border bg-muted/30 px-2 py-1 flex items-center gap-1">
        <span className="text-[5.5px] text-muted-foreground">Talking about:</span>
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-background text-[6px]">
          <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-[5px] font-medium">M</span>
          </div>
          <span className="font-medium">Marcus T.</span>
        </div>
      </div>

      {/* Chat messages — ChatGPTMessage layout */}
      <div className="flex-1 overflow-hidden px-2 py-2 space-y-2">
        <AnimatePresence>
          {DEMO_MESSAGES.slice(0, visibleCount).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {msg.role === "user" ? (
                <div className="flex justify-end mb-1">
                  <div className="max-w-[82%] rounded-2xl rounded-br-md p-1.5 bg-muted">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="mb-1">
                  {/* Avatar + label */}
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className="w-3.5 h-3.5 rounded-md bg-[image:var(--gradient-hero)] flex items-center justify-center">
                      <Sparkles className="w-1.5 h-1.5 text-primary-foreground" />
                    </div>
                    <span className="text-[6px] font-medium text-muted-foreground">D.E.V.I.</span>
                  </div>
                  {/* Content indented past avatar — matches pl-9 at scale */}
                  <div className="pl-[18px] pr-1">
                    {msg.content}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {visibleCount === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-3.5 h-3.5 rounded-md bg-[image:var(--gradient-hero)] flex items-center justify-center">
                <Sparkles className="w-1.5 h-1.5 text-primary-foreground" />
              </div>
              <span className="text-[6px] font-medium text-muted-foreground">D.E.V.I.</span>
            </div>
            <div className="pl-[18px] flex items-center gap-0.5">
              {[0, 1, 2].map((j) => (
                <motion.div
                  key={j}
                  className="w-1 h-1 rounded-full bg-muted-foreground/40"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: j * 0.12 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar — matches real app */}
      <div className="border-t border-border px-2 py-1.5">
        <div className="flex gap-1 items-end">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            <ImagePlus className="w-2.5 h-2.5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-[6px] px-2 py-[4px] rounded-md bg-muted text-muted-foreground/50 border border-border">
            Ask about Marcus T....
          </div>
          <div className="w-4 h-4 rounded-md bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
            <Send className="w-2 h-2 text-primary-foreground" />
          </div>
        </div>
        <p className="text-center text-[4px] text-muted-foreground/40 mt-0.5">Responses are AI-generated</p>
      </div>
    </div>
  );
};
