import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Heart, Lock } from "lucide-react";

const DEMO_CONVERSATION: { role: "user" | "them"; content: string; delay: number }[] = [
  { role: "user", content: "Why did you just stop trying?", delay: 800 },
  { role: "them", content: "honestly? my dad wasn't around and i learned pretty early that people leave. so i guess i just... leave first.", delay: 2400 },
  { role: "user", content: "That's not fair to me though", delay: 4800 },
  { role: "them", content: "i know. i liked the attention but i wasn't willing to do the actual work. i kept you around because it felt good for me, not because i was planning a future.", delay: 6200 },
  { role: "user", content: "Did you even care?", delay: 9000 },
  { role: "them", content: "in my own limited way, yeah. but caring and showing up are two different things and i only ever did one.", delay: 10500 },
];

export const TextSimulatorDemo: React.FC = () => {
  const [visibleMessages, setVisibleMessages] = useState<typeof DEMO_CONVERSATION>([]);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleMessages]);

  useEffect(() => {
    if (!started) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO_CONVERSATION.forEach((msg, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleMessages((prev) => [...prev, msg]);
        }, msg.delay)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [started]);

  return (
    <div className="flex flex-col h-full pt-1">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px]">
          🔒
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground">Text Simulator</p>
          <span className="text-[8px] text-muted-foreground">Closure mode · 6 turns left</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-2 space-y-2" style={{ maxHeight: 320 }}>
        {!started ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-3 py-8"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-[9px] text-center text-muted-foreground leading-relaxed px-4">
              Say what you never got to say. Get the closure you deserve — safely, with AI.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="text-[9px] font-semibold px-4 py-1.5 rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground"
            >
              Start Simulation
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {visibleMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-[9px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#007AFF] text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Fake input */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
        <div className="flex-1 text-[9px] px-2.5 py-1.5 rounded-full bg-muted text-muted-foreground/60">
          Say what you need to say...
        </div>
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 opacity-40">
          <Send className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};
