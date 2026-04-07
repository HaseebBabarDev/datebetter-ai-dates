import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, ImagePlus, X, Sparkles, Flag, BarChart3, BookOpen, Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ThreadHeader } from "@/components/thread/ThreadHeader";
import { RedFlagCard } from "@/components/thread/RedFlagCard";
import { ChatGPTMessage } from "@/components/devi/ChatGPTMessage";
import { DeviThinkingIndicator } from "@/components/devi/DeviThinkingIndicator";
import { VoiceInputButton } from "@/components/devi/VoiceInputButton";
import { ConversationUploadSheet } from "@/components/devi/ConversationUploadSheet";
import { CandidateProfile } from "@/components/candidate/CandidateProfile";
import { InteractionHistory } from "@/components/candidate/InteractionHistory";
import { FlagsSection } from "@/components/candidate/FlagsSection";
import { CandidateJournal } from "@/components/candidate/CandidateJournal";
import { CompatibilityScore } from "@/components/candidate/CompatibilityScore";

type Candidate = Tables<"candidates">;
type DeviMessage = Tables<"devi_messages">;
type Interaction = Tables<"interactions">;

const CandidateThread = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [messages, setMessages] = useState<DeviMessage[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [showProfile, setShowProfile] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [imageFiles, setImageFiles] = useState<{ data: string; type: string }[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Fetch candidate and conversation
  useEffect(() => {
    if (!user?.id || !id) return;

    const fetchData = async () => {
      // Fetch candidate first (needed for conversation creation)
      const { data: cand } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!cand) {
        navigate("/candidates");
        return;
      }
      setCandidate(cand);

      // Fetch conversation and interactions in parallel
      const [convosRes, intsRes] = await Promise.all([
        supabase
          .from("devi_conversations")
          .select("id")
          .eq("user_id", user.id)
          .eq("candidate_id", id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("interactions")
          .select("*")
          .eq("candidate_id", id)
          .eq("user_id", user.id)
          .order("interaction_date", { ascending: false }),
      ]);

      if (intsRes.data) setInteractions(intsRes.data);

      let convoId: string;
      if (convosRes.data && convosRes.data.length > 0) {
        convoId = convosRes.data[0].id;
      } else {
        const { data: newConvo } = await supabase
          .from("devi_conversations")
          .insert({
            user_id: user.id,
            candidate_id: id,
            title: `Chat about ${cand.nickname}`,
          })
          .select("id")
          .single();

        if (!newConvo) return;
        convoId = newConvo.id;
      }
      conversationIdRef.current = convoId;

      // Fetch messages
      const { data: msgs } = await supabase
        .from("devi_messages")
        .select("*")
        .eq("conversation_id", convoId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (msgs) setMessages(msgs);
      setLoading(false);
    };

    fetchData();
  }, [user?.id, id, navigate]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current && activeTab === "chat") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, activeTab]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && imageFiles.length === 0) || sending || !user?.id || !conversationIdRef.current) return;

    const userMessage = input.trim();
    const images = [...imageFiles];
    setInput("");
    setImageFiles([]);
    setSending(true);

    // Optimistic user message
    const optimistic: DeviMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversationIdRef.current,
      user_id: user.id,
      role: "user",
      content: userMessage,
      image_url: images.length > 0 ? images[0].data : null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      // Save user message
      await supabase.from("devi_messages").insert({
        conversation_id: conversationIdRef.current,
        user_id: user.id,
        role: "user",
        content: userMessage,
        image_url: images.length > 0 ? images[0].data : null,
      });

      // Call AI
      const { data, error } = await supabase.functions.invoke("devi-chat", {
        body: {
          message: userMessage,
          conversationId: conversationIdRef.current,
          candidateId: id,
          images: images.length > 0 ? images : undefined,
        },
      });

      if (error) throw error;

      const aiContent = data?.response || data?.message || "I'm having trouble responding right now.";

      // Save AI message
      const { data: savedMsg } = await supabase
        .from("devi_messages")
        .insert({
          conversation_id: conversationIdRef.current!,
          user_id: user.id,
          role: "assistant",
          content: aiContent,
        })
        .select()
        .single();

      if (savedMsg) {
        setMessages((prev) => [...prev, savedMsg]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }, [input, imageFiles, sending, user?.id, id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImageFiles((prev) => [...prev, { data: reader.result as string, type: "image" }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleConversationUpload = async (data: {
    platform: string;
    files: { data: string; type: string; isVideo: boolean }[];
    perspective: "me" | "them";
  }) => {
    if (!user?.id || !conversationIdRef.current || !candidate) return;

    setSending(true);
    setActiveTab("chat");

    const userMsg = `Analyze this ${data.platform} conversation. The messages on the right are from ${data.perspective === "me" ? "me" : candidate.nickname}.`;

    // Optimistic
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        conversation_id: conversationIdRef.current!,
        user_id: user.id,
        role: "user",
        content: userMsg,
        image_url: data.files[0]?.data || null,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      await supabase.from("devi_messages").insert({
        conversation_id: conversationIdRef.current,
        user_id: user.id,
        role: "user",
        content: userMsg,
        image_url: data.files[0]?.data || null,
      });

      const { data: response, error } = await supabase.functions.invoke("devi-chat", {
        body: {
          message: userMsg,
          conversationId: conversationIdRef.current,
          candidateId: id,
          images: data.files.map((f) => ({ data: f.data, type: f.type })),
        },
      });

      if (error) throw error;

      const aiContent = response?.response || response?.message || "Analysis complete.";

      const { data: savedMsg } = await supabase
        .from("devi_messages")
        .insert({
          conversation_id: conversationIdRef.current!,
          user_id: user.id,
          role: "assistant",
          content: aiContent,
        })
        .select()
        .single();

      if (savedMsg) setMessages((prev) => [...prev, savedMsg]);
    } catch (err) {
      console.error("Upload analysis error:", err);
      toast.error("Failed to analyze conversation");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!authLoading && !user) return <Navigate to="/auth" replace />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!candidate) return <Navigate to="/candidates" replace />;

  const redFlags = Array.isArray(candidate.red_flags)
    ? (candidate.red_flags as string[])
    : [];
  const greenFlags = Array.isArray(candidate.green_flags)
    ? (candidate.green_flags as string[])
    : [];
  const pros = Array.isArray(candidate.pros) ? (candidate.pros as string[]) : [];
  const cons = Array.isArray(candidate.cons) ? (candidate.cons as string[]) : [];
  const breakdown = candidate.score_breakdown && typeof candidate.score_breakdown === "object"
    ? (candidate.score_breakdown as Record<string, number>)
    : undefined;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <ThreadHeader
        nickname={candidate.nickname}
        photoUrl={candidate.photo_url}
        compatibilityScore={candidate.compatibility_score}
        status={candidate.status}
        onViewProfile={() => navigate(`/candidate/${id}`)}
        onDelete={undefined}
      />

      {/* Tabs */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 mx-3 mt-2 bg-muted/50 rounded-xl h-9">
          <TabsTrigger value="chat" className="text-xs rounded-lg gap-1 data-[state=active]:bg-background">
            <Sparkles className="w-3 h-3" /> Chat
          </TabsTrigger>
          <TabsTrigger value="compatibility" className="text-xs rounded-lg gap-1 data-[state=active]:bg-background">
            <Heart className="w-3 h-3" /> Score
          </TabsTrigger>
          <TabsTrigger value="flags" className="text-xs rounded-lg gap-1 data-[state=active]:bg-background">
            <Flag className="w-3 h-3" /> Flags
          </TabsTrigger>
          <TabsTrigger value="journal" className="text-xs rounded-lg gap-1 data-[state=active]:bg-background">
            <BookOpen className="w-3 h-3" /> Journal
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && !sending && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Start chatting about {candidate.nickname} or upload a conversation for instant analysis
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => setShowUpload(true)}
                >
                  <ImagePlus className="w-4 h-4" />
                  Analyze a Conversation
                </Button>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[80%] space-y-1">
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt=""
                        className="rounded-xl max-h-48 object-cover"
                      />
                    )}
                    <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[85%]">
                    <ChatGPTMessage message={{ id: msg.id, role: "assistant", content: msg.content }} />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <DeviThinkingIndicator isVisible={true} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-xl p-3 pb-safe-bottom">
            {/* Image previews */}
            {imageFiles.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {imageFiles.map((img, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={img.data} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <button
                      onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about ${candidate.nickname}...`}
                className="min-h-[44px] max-h-32 resize-none rounded-xl border-border/60 bg-muted/30"
                rows={1}
              />

              <VoiceInputButton
                onTranscript={(text) => setInput((prev) => prev + text)}
                disabled={sending}
              />

              <Button
                size="icon"
                className="h-10 w-10 rounded-xl shrink-0"
                onClick={handleSend}
                disabled={sending || (!input.trim() && imageFiles.length === 0)}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Compatibility Tab - Full breakdown */}
        <TabsContent value="compatibility" className="flex-1 overflow-y-auto px-3 py-3 space-y-3 mt-0">
          <CompatibilityScore
            candidate={candidate}
            onUpdate={(updates) => {
              setCandidate(prev => prev ? { ...prev, ...updates } as Candidate : prev);
            }}
          />
        </TabsContent>

        {/* Flags Tab */}
        <TabsContent value="flags" className="flex-1 overflow-y-auto px-3 py-3 space-y-3 mt-0">
          {redFlags.length > 0 && <RedFlagCard flags={redFlags} severity="high" />}
          {greenFlags.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                ✅ Green Flags
              </span>
              <ul className="space-y-1.5">
                {greenFlags.map((flag, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-emerald-500 shrink-0">•</span>
                    <span className="text-foreground/80">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {redFlags.length === 0 && greenFlags.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center space-y-3">
              <Flag className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground max-w-xs">
                No flags detected yet. Chat with D.E.V.I. or upload conversations to surface patterns.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Journal Tab */}
        <TabsContent value="journal" className="flex-1 overflow-y-auto px-3 py-3 mt-0">
          <CandidateJournal candidateId={id!} candidateName={candidate.nickname} />
        </TabsContent>
      </Tabs>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Conversation Upload Sheet */}
      <ConversationUploadSheet
        open={showUpload}
        onOpenChange={setShowUpload}
        candidateName={candidate.nickname}
        onSubmit={handleConversationUpload}
      />
    </div>
  );
};

export default CandidateThread;
