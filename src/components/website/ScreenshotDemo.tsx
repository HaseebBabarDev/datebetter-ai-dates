import React, { useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Sparkles, Send, ImagePlus, AlertTriangle, Heart } from "lucide-react";

const DEMO_MESSAGES: { role: "user" | "assistant"; content: React.ReactNode; delay: number }[] = [
  {
    role: "user",
    delay: 0.6,
    content: (
      <div className="space-y-1.5">
        {/* Fake screenshot thumbnail — mimics a real iMessage thread */}
        <div className="rounded-lg bg-background/50 border border-border/50 p-1.5 space-y-0.5">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-muted/80 shrink-0" />
            <div className="bg-muted/60 rounded px-1 py-0.5 text-[5.5px] text-muted-foreground leading-tight">Hey sorry I disappeared lol 😅</div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded px-1 py-0.5 text-[5.5px] text-foreground leading-tight">Still down for dinner?</div>
          </div>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-muted/80 shrink-0" />
            <div className="bg-muted/60 rounded px-1 py-0.5 text-[5.5px] text-muted-foreground leading-tight">Definitely!! Let me check 🥰</div>
          </div>
          <div className="text-center text-[4.5px] text-muted-foreground/40 italic">3 days later...</div>
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded px-1 py-0.5 text-[5.5px] text-foreground leading-tight">Did you check? 😊</div>
          </div>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-muted/80 shrink-0" />
            <div className="bg-muted/60 rounded px-1 py-0.5 text-[5.5px] text-muted-foreground leading-tight">Omg yes!! This week is crazy 😭</div>
          </div>
        </div>
        <p className="text-[7px] leading-tight">Analyze this text thread — is this a red flag?</p>
      </div>
    ),
  },
  {
    role: "assistant",
    delay: 2.4,
    content: (
      <div className="space-y-1.5">
        <p className="text-[7px] leading-relaxed">
          I see a <strong>breadcrumbing pattern</strong> here. Let me break it down:
        </p>

        {/* Flags — matches real ChatGPTMessage style */}
        <div className="space-y-0.5">
          <div className="flex items-start gap-1 text-[6.5px]">
            <AlertTriangle className="w-2 h-2 text-destructive shrink-0 mt-[1px]" />
            <span><span className="font-semibold text-destructive">Inconsistent follow-through</span> <span className="text-muted-foreground">— promises but never commits</span></span>
          </div>
          <div className="flex items-start gap-1 text-[6.5px]">
            <AlertTriangle className="w-2 h-2 text-destructive shrink-0 mt-[1px]" />
            <span><span className="font-semibold text-destructive">You're always initiating</span> <span className="text-muted-foreground">— they respond, but never lead</span></span>
          </div>
          <div className="flex items-start gap-1 text-[6.5px]">
            <Heart className="w-2 h-2 text-success shrink-0 mt-[1px]" />
            <span><span className="font-semibold text-success">Warm tone</span> <span className="text-muted-foreground">— they like you, but not enough to act</span></span>
          </div>
        </div>

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

        <div className="border-l-2 border-primary/30 pl-1.5">
          <p className="text-[6.5px] text-foreground leading-relaxed">
            <strong>My advice:</strong> Stop initiating for 7 days. If they don't reach out with a real plan, you have your answer. You deserve someone who <em>acts</em>, not just talks. 💜
          </p>
        </div>

        {/* Quick replies — matches real app */}
        <div className="flex flex-wrap gap-1 pt-1">
          {["Tell me more", "What should I do?", "Help me rewire my thoughts"].map((r) => (
            <div key={r} className="px-1.5 py-0.5 text-[5.5px] font-medium rounded-full border border-border text-foreground">
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
      {/* Header — matches real Devi.tsx header */}
      <div className="flex items-center gap-1 px-1 py-1.5 border-b border-border">
        <div className="w-5 h-5 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[8px] font-semibold text-foreground leading-tight">D.E.V.I.</p>
          <p className="text-[6px] text-muted-foreground">Your dating advisor</p>
        </div>
      </div>

      {/* Candidate selector bar — matches real app */}
      <div className="border-b border-border bg-muted/30 px-2 py-1 flex items-center gap-1">
        <span className="text-[5.5px] text-muted-foreground">Talking about:</span>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background text-[6px]">
          <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-[5px] font-medium">M</span>
          </div>
          <span className="font-medium">Marcus T.</span>
        </div>
      </div>

      {/* Chat messages — matches real ChatGPTMessage layout */}
      <div className="flex-1 overflow-hidden px-2 py-2 space-y-3">
        <AnimatePresence>
          {DEMO_MESSAGES.slice(0, visibleCount).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {msg.role === "user" ? (
                /* User bubble — right-aligned, bg-muted, rounded-br-md (matches ChatGPTMessage) */
                <div className="flex justify-end mb-2">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md p-1.5 bg-muted">
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* Assistant — full width, avatar+label then indented content (matches ChatGPTMessage) */
                <div className="mb-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className="w-4 h-4 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-primary-foreground" />
                    </div>
                    <span className="text-[6.5px] font-medium text-muted-foreground">D.E.V.I.</span>
                  </div>
                  <div className="pl-5">
                    {msg.content}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {visibleCount === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-4 h-4 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-primary-foreground" />
              </div>
              <span className="text-[6.5px] font-medium text-muted-foreground">D.E.V.I.</span>
            </div>
            <div className="pl-5 flex items-center gap-0.5">
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

      {/* Input bar — matches real Devi.tsx input (ImagePlus + Textarea + Send) */}
      <div className="border-t border-border px-2 py-1.5">
        <div className="flex gap-1 items-end">
          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0">
            <ImagePlus className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="flex-1 text-[6.5px] px-2 py-1 rounded-md bg-muted text-muted-foreground/50 border border-border min-h-[18px] flex items-center">
            Ask about Marcus T....
          </div>
          <div className="w-5 h-5 rounded-md bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
            <Send className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        </div>
        <p className="text-center text-[4.5px] text-muted-foreground/40 mt-1">Responses are AI-generated</p>
      </div>
    </div>
  );
};
