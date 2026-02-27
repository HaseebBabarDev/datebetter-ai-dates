import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

const DEMO_RESPONSES: Record<string, string> = {
  default: "I'd love to help! Based on what I know about healthy dating patterns, here's what I think...",
  "red flag": "That sounds like it could be a red flag. Specifically, inconsistent communication early on often signals avoidant attachment. I'd recommend observing their behavior over the next 2 weeks.",
  "text": "The texting gap could mean many things. Before assuming the worst, consider: are they usually responsive? Did something change recently? Let's track this pattern.",
  "boundary": "Setting boundaries isn't being 'difficult' — it's being clear. Try: 'I appreciate you wanting to see me, but I need plans made in advance.' Direct and kind.",
  "worth": "You are absolutely worth the effort of someone who shows up consistently. The right person won't make you question your value. What specifically triggered this feeling?",
};

const getResponse = (input: string): string => {
  const lower = input.toLowerCase();
  if (lower.includes("red flag") || lower.includes("warning")) return DEMO_RESPONSES["red flag"];
  if (lower.includes("text") || lower.includes("reply") || lower.includes("respond")) return DEMO_RESPONSES["text"];
  if (lower.includes("boundary") || lower.includes("boundaries") || lower.includes("needy")) return DEMO_RESPONSES["boundary"];
  if (lower.includes("worth") || lower.includes("deserve") || lower.includes("good enough")) return DEMO_RESPONSES["worth"];
  return DEMO_RESPONSES["default"];
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'm D.E.V.I. — your AI dating advisor. Ask me anything about dating, relationships, or someone you're seeing. 💜" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim() || typing) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setTyping(true);

    const response = getResponse(userMsg);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setTyping(false);
    }, 1200 + Math.random() * 800);
  };

  return (
    <div className="flex flex-col h-full pt-1">
      {/* Chat header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        <div className="w-7 h-7 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground">D.E.V.I.</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[8px] text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-2 space-y-2" style={{ maxHeight: 320 }}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-[9px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask D.E.V.I. anything..."
          className="flex-1 text-[9px] px-2.5 py-1.5 rounded-full bg-muted border-0 outline-none placeholder:text-muted-foreground/60 text-foreground"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || typing}
          className="w-6 h-6 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center shrink-0 disabled:opacity-40"
        >
          <Send className="w-3 h-3 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};
