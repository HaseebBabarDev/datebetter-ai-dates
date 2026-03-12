import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertTriangle, MessageCircle, ChevronLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIDisclosure } from "@/components/AIDisclosure";
import { detectCrisisContent } from "@/lib/crisisDetection";
import { CrisisAlertDialog } from "@/components/devi/CrisisAlertDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

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

interface SessionRecord {
  id: string;
  messages: SimMessage[];
  turn_count: number;
  is_complete: boolean;
  created_at: string;
}

const STARTER_PROMPTS = [
  "Why did you stop talking to me?",
  "Did you ever actually care?",
  "I just need to know why",
  "Was any of it real?",
];

const MAX_TURNS = 12;
const MAX_FREE_SESSIONS = 3;

export const TextSimulator: React.FC<TextSimulatorProps> = ({
  open,
  onOpenChange,
  candidateName,
  candidateId,
  candidateContext,
  userGender,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<"moderate" | "severe">("moderate");
  const [crisisCategory, setCrisisCategory] = useState<"crisis" | "harmful_content" | "emergency">("crisis");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Session management
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [view, setView] = useState<"history" | "chat" | "paywall">("chat");
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const userTurnCount = messages.filter(m => m.role === "user").length;
  const isAtLimit = userTurnCount >= MAX_TURNS;
  const completedSessions = sessions.filter(s => s.is_complete).length;
  const isAtSessionLimit = completedSessions >= MAX_FREE_SESSIONS && !currentSessionId;

  // Load sessions for this candidate
  useEffect(() => {
    if (!open || !user || !candidateId) return;
    setSessionsLoaded(false);
    
    const loadSessions = async () => {
      const { data } = await supabase
        .from("text_simulator_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false });

      const loaded = (data || []).map((s: any) => ({
        id: s.id,
        messages: (s.messages as SimMessage[]) || [],
        turn_count: s.turn_count,
        is_complete: s.is_complete,
        created_at: s.created_at,
      }));
      setSessions(loaded);
      setSessionsLoaded(true);

      // Check if at limit
      const completed = loaded.filter(s => s.is_complete).length;
      if (completed >= MAX_FREE_SESSIONS) {
        setView("paywall");
      } else if (loaded.length > 0) {
        setView("history");
      } else {
        // First time — start fresh chat
        setView("chat");
        setMessages([]);
        setCurrentSessionId(null);
      }
    };
    loadSessions();
  }, [open, user, candidateId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (open && view === "chat") {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, view]);

  // Save session to DB
  const saveSession = useCallback(async (msgs: SimMessage[], complete: boolean) => {
    if (!user || !candidateId) return;
    const turnCount = msgs.filter(m => m.role === "user").length;

    if (currentSessionId) {
      await supabase
        .from("text_simulator_sessions")
        .update({
          messages: msgs as any,
          turn_count: turnCount,
          is_complete: complete,
        })
        .eq("id", currentSessionId);
    } else {
      const { data } = await supabase
        .from("text_simulator_sessions")
        .insert({
          user_id: user.id,
          candidate_id: candidateId,
          messages: msgs as any,
          turn_count: turnCount,
          is_complete: complete,
        })
        .select("id")
        .single();
      if (data) setCurrentSessionId(data.id);
    }
  }, [user, candidateId, currentSessionId]);

  const startNewConversation = () => {
    if (isAtSessionLimit) {
      setView("paywall");
      return;
    }
    setMessages([]);
    setCurrentSessionId(null);
    setView("chat");
  };

  const viewPastConversation = (session: SessionRecord) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setView("chat");
  };

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading || isAtLimit) return;

    const crisisResult = detectCrisisContent(msgText);
    if (crisisResult.detected) {
      setCrisisSeverity(crisisResult.severity);
      setCrisisCategory(crisisResult.category || "crisis");
      setCrisisOpen(true);
      if (crisisResult.category === "harmful_content") return;
    }

    const userMsg: SimMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: msgText,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Save after user message
    await saveSession(newMessages, false);

    const allMessages = newMessages.map(m => ({
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

      const withAssistant = [...newMessages, { id: assistantId, role: "assistant" as const, content: "" }];
      setMessages(withAssistant);

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

      // Save final messages with assistant response
      const finalMessages = [...newMessages, { id: assistantId, role: "assistant" as const, content: assistantContent }];
      const newTurnCount = finalMessages.filter(m => m.role === "user").length;
      const isNowComplete = newTurnCount >= MAX_TURNS;
      await saveSession(finalMessages, isNowComplete);

      if (isNowComplete) {
        // Refresh sessions list
        setSessions(prev => {
          const updated = prev.map(s => s.id === currentSessionId ? { ...s, is_complete: true, messages: finalMessages, turn_count: newTurnCount } : s);
          if (!currentSessionId) {
            // Will be saved with new ID, refresh on next open
          }
          return updated;
        });
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
  }, [input, isLoading, messages, candidateName, candidateContext, userGender, userTurnCount, isAtLimit, saveSession, currentSessionId]);

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
              {view === "chat" && sessions.length > 0 && (
                <button onClick={() => setView("history")} className="p-1 -ml-1">
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
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

          {/* HISTORY VIEW */}
          {view === "history" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {completedSessions}/{MAX_FREE_SESSIONS} free conversations used
              </p>

              {/* Past conversations */}
              {sessions.map((session, i) => {
                const firstMsg = session.messages.find(m => m.role === "user");
                const preview = firstMsg?.content?.slice(0, 60) || "Conversation";
                const date = new Date(session.created_at).toLocaleDateString();
                return (
                  <button
                    key={session.id}
                    onClick={() => viewPastConversation(session)}
                    className="w-full text-left p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">
                        Conversation {sessions.length - i}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">"{preview}..."</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {session.turn_count} messages
                      </span>
                      {session.is_complete && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Complete
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* New conversation button */}
              {completedSessions < MAX_FREE_SESSIONS ? (
                <Button
                  onClick={startNewConversation}
                  className="w-full bg-[#007AFF] hover:bg-[#0066DD] text-white"
                  size="sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start New Conversation ({MAX_FREE_SESSIONS - completedSessions} left)
                </Button>
              ) : (
                <div className="text-center space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <p className="text-xs font-medium">All 3 free conversations used</p>
                  </div>
                  <Button
                    onClick={() => setView("paywall")}
                    className="w-full bg-[#007AFF] hover:bg-[#0066DD] text-white"
                    size="sm"
                  >
                    Unlock More Conversations
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* PAYWALL VIEW */}
          {view === "paywall" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#007AFF]" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  You've used all 3 free conversations
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  You've had meaningful closure conversations with {candidateName}. Want to continue processing?
                </p>
              </div>

              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() => window.location.href = "/subscription"}
                  className="w-full p-4 rounded-xl border-2 border-[#007AFF] bg-[#007AFF]/5 hover:bg-[#007AFF]/10 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">Unlimited Monthly</span>
                    <span className="text-sm font-bold text-[#007AFF]">$29.99/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Unlimited conversations with all candidates, every day</p>
                </button>

                <button
                  onClick={() => window.location.href = "/subscription"}
                  className="w-full p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">Day Pass</span>
                    <span className="text-sm font-bold text-foreground">$5.99/day</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Unlimited conversations for 24 hours</p>
                </button>
              </div>

              {sessions.length > 0 && (
                <button
                  onClick={() => setView("history")}
                  className="text-xs text-muted-foreground underline"
                >
                  View past conversations
                </button>
              )}
            </div>
          )}

          {/* CHAT VIEW */}
          {view === "chat" && (
            <>
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
                      <div className="space-y-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            window.location.href = "/subscription";
                          }}
                          className="text-xs w-full bg-[#007AFF] hover:bg-[#0066DD] text-white"
                        >
                          Unlock Unlimited · $29.99/mo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            window.location.href = "/subscription";
                          }}
                          className="text-xs w-full"
                        >
                          Day Pass · $5.99/day
                        </Button>
                      </div>
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
            </>
          )}
        </motion.div>
      </div>

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
