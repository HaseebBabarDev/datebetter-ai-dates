import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertTriangle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIDisclosure } from "@/components/AIDisclosure";
import { detectCrisisContent } from "@/lib/crisisDetection";
import { CrisisAlertDialog } from "@/components/devi/CrisisAlertDialog";

interface TextSimulatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  candidateId?: string;
  candidateContext?: string;
  userGender?: string;
}

interface SimMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Why did you stop talking to me?",
  "Did you ever actually care?",
  "I just need to know why",
  "Was any of it real?",
];

const MAX_TURNS = 12; // Max user messages before closure nudge

export const TextSimulator: React.FC<TextSimulatorProps> = ({
  open,
  onOpenChange,
  candidateName,
  candidateId,
  candidateContext,
  userGender,
}) => {
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<"moderate" | "severe">("moderate");
  const [crisisCategory, setCrisisCategory] = useState<"crisis" | "harmful_content" | "emergency">("crisis");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userTurnCount = messages.filter(m => m.role === "user").length;
  const isAtLimit = userTurnCount >= MAX_TURNS;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (open) {
      setMessages([]);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading || isAtLimit) return;

    // Crisis detection guardrails
    const crisisResult = detectCrisisContent(msgText);
    if (crisisResult.detected) {
      setCrisisSeverity(crisisResult.severity);
      setCrisisCategory(crisisResult.category || "crisis");
      setCrisisOpen(true);
      // Block harmful content entirely
      if (crisisResult.category === "harmful_content") {
        return;
      }
      // For crisis/emergency, show resources but allow continuing
    }

    const userMsg: SimMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: msgText,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const allMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-simulator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            candidateName,
            candidateContext,
            userGender,
            turnCount: userTurnCount + 1,
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch { /* partial json */ }
        }
      }
    } catch (err) {
      console.error("Text simulator error:", err);
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "..." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, candidateName, candidateContext, userGender, userTurnCount, isAtLimit]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-background w-full h-[100dvh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-sm font-semibold">
                {candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{candidateName}</p>
                <p className="text-[10px] text-muted-foreground">Simulated · Not real</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2 bg-muted/50 border-b border-border">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This is a <strong>simulated</strong> closure conversation. {candidateName} is not seeing or responding. This exists only to help you process emotions and <strong>find closure</strong> — not to replace real communication.
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 min-h-[200px]">
            {messages.length === 0 && (
              <div className="space-y-3 py-4">
                <p className="text-xs text-muted-foreground text-center">
                  Say what you've been holding back
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {STARTER_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="px-3 py-1.5 text-xs rounded-full border border-border text-foreground hover:bg-muted transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#007AFF] text-white rounded-2xl rounded-br-md"
                        : "bg-[hsl(var(--muted))] text-foreground rounded-2xl rounded-bl-md"
                    }`}
                  >
                    {msg.content || (
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-[hsl(var(--muted))] rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                </div>
              </motion.div>
            )}

            {/* Closure complete nudge */}
            {isAtLimit && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4 space-y-3 px-4"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We recommend closing it out here. You've said what you needed to say — and that takes courage. 💜
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs w-full"
                >
                  Close & Move Forward
                </Button>
                <div className="pt-1 border-t border-border mt-2">
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                    Want unlimited daily access to the Text Simulator?
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = "/subscription";
                    }}
                    className="text-xs w-full bg-[#007AFF] hover:bg-[#0066DD] text-white"
                  >
                    Unlock Daily Access · $29.99/mo
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border safe-area-bottom">
            {isAtLimit ? (
              <p className="text-[10px] text-muted-foreground text-center py-1">
                This simulation has ended. You got your closure. 💜
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="iMessage"
                  disabled={isLoading}
                  className="flex-1 text-sm px-4 py-2 rounded-full bg-muted border border-border outline-none placeholder:text-muted-foreground/60 text-foreground focus:border-[#007AFF] transition-colors"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
            <AIDisclosure variant="compact" className="justify-center mt-2" />
          </div>
        </motion.div>
      </div>

      {/* Crisis Alert Dialog — same guardrails as D.E.V.I. chat */}
      <CrisisAlertDialog
        open={crisisOpen}
        onClose={() => setCrisisOpen(false)}
        severity={crisisSeverity}
        category={crisisCategory}
      />
    </>
  );
};

// CTA Badge for embedding in other pages
interface TextSimulatorCTAProps {
  candidateName: string;
  candidateId?: string;
  candidateContext?: string;
  userGender?: string;
  variant?: "badge" | "card";
}

export const TextSimulatorCTA: React.FC<TextSimulatorCTAProps> = ({
  candidateName,
  candidateId,
  candidateContext,
  userGender,
  variant = "badge",
}) => {
  const [open, setOpen] = useState(false);

  if (variant === "card") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-xl border border-[#007AFF]/20 bg-[#007AFF]/5 p-4 flex items-start gap-3 hover:bg-[#007AFF]/10 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-[#007AFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Text Simulator</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Instead of texting {candidateName}, say it here first. Get AI-simulated closure without the regret.
            </p>
          </div>
        </button>
        <TextSimulator
          open={open}
          onOpenChange={setOpen}
          candidateName={candidateName}
          candidateId={candidateId}
          candidateContext={candidateContext}
          userGender={userGender}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 border border-[#007AFF]/20 transition-colors cursor-pointer"
      >
        <MessageCircle className="w-3.5 h-3.5 text-[#007AFF]" />
        <span className="text-xs font-medium text-[#007AFF]">
          Text Simulator
        </span>
      </button>
      <TextSimulator
        open={open}
        onOpenChange={setOpen}
        candidateName={candidateName}
        candidateId={candidateId}
        candidateContext={candidateContext}
        userGender={userGender}
      />
    </>
  );
};

export default TextSimulator;
