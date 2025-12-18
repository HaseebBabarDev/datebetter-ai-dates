import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Home, Send, ImagePlus, X, Camera, Instagram, Heart, Loader2, User, Users, ArrowRight, ChevronDown, Check, Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type Candidate = Tables<"candidates">;
type Profile = Tables<"profiles">;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageData?: string;
  imageType?: string;
  candidateId?: string;
}

const QUICK_PROMPTS = [
  { icon: Camera, label: "Text Screenshot", type: "text_screenshot", prompt: "Analyze this text conversation" },
  { icon: Instagram, label: "IG Profile", type: "ig_profile", prompt: "Analyze this Instagram profile" },
  { icon: Heart, label: "Dating Profile", type: "dating_profile", prompt: "Analyze this dating profile" },
];

const EXAMPLE_QUESTIONS = [
  "Why isn't he texting me back?",
  "Is this a red flag or am I overreacting?",
  "How do I bring up exclusivity?",
  "He said he's not ready for a relationship but...",
];

const USER_PROFILE_FIELDS = [
  { key: "relationship_goal", weight: 2 },
  { key: "religion", weight: 2 },
  { key: "politics", weight: 2 },
  { key: "kids_desire", weight: 2 },
  { key: "attachment_style", weight: 2 },
  { key: "gender_identity", weight: 1 },
  { key: "birth_date", weight: 1 },
  { key: "country", weight: 1 },
  { key: "city", weight: 1 },
];

const CANDIDATE_PROFILE_FIELDS = [
  { key: "age", weight: 2 },
  { key: "their_religion", weight: 2 },
  { key: "their_politics", weight: 2 },
  { key: "their_relationship_goal", weight: 2 },
  { key: "their_kids_desire", weight: 2 },
  { key: "their_attachment_style", weight: 2 },
  { key: "gender_identity", weight: 1 },
];

const calculateCompleteness = (data: Record<string, unknown>, fields: { key: string; weight: number }[]) => {
  let filledWeight = 0;
  let totalWeight = 0;
  
  fields.forEach(field => {
    totalWeight += field.weight;
    const value = data[field.key];
    if (value !== null && value !== undefined && value !== "") {
      filledWeight += field.weight;
    }
  });
  
  return Math.round((filledWeight / totalWeight) * 100);
};

const Devi = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ data: string; type: string } | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isFree = subscription?.plan === "free";
  const candidateIdFromState = (location.state as { candidateId?: string })?.candidateId;
  const candidateNameFromState = (location.state as { candidateName?: string })?.candidateName;

  // Calculate profile completeness
  const userProfileCompleteness = userProfile 
    ? calculateCompleteness(userProfile as unknown as Record<string, unknown>, USER_PROFILE_FIELDS)
    : 0;
  const candidateCompleteness = selectedCandidate
    ? calculateCompleteness(selectedCandidate as unknown as Record<string, unknown>, CANDIDATE_PROFILE_FIELDS)
    : 0;
  
  const profilesComplete = userProfileCompleteness >= 70 && candidateCompleteness >= 70;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch candidates and user profile
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setProfilesLoading(true);
      
      // Fetch candidates
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "archived")
        .order("updated_at", { ascending: false });
      
      if (candidatesData) {
        setCandidates(candidatesData);
        // Auto-select if coming from candidate page
        if (candidateIdFromState) {
          const found = candidatesData.find(c => c.id === candidateIdFromState);
          if (found) setSelectedCandidate(found);
        } else if (candidatesData.length === 1) {
          setSelectedCandidate(candidatesData[0]);
        }
      }
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profileData) {
        setUserProfile(profileData);
      }
      
      setProfilesLoading(false);
    };

    fetchData();
  }, [user, candidateIdFromState]);

  useEffect(() => {
    if (candidateNameFromState && messages.length === 0) {
      setInput(`I want to ask about ${candidateNameFromState}...`);
      textareaRef.current?.focus();
    }
  }, [candidateNameFromState]);

  const handleImageUpload = (type: string) => {
    if (!selectedCandidate) {
      toast.error("Please select a candidate first");
      return;
    }
    if (!profilesComplete) {
      setShowProfileDialog(true);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-type', type);
      fileInputRef.current.click();
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const imageType = e.target.getAttribute('data-type') || 'general';
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPendingImage({ data: base64, type: imageType });
      
      // Set a default prompt based on image type
      const prompt = QUICK_PROMPTS.find(p => p.type === imageType);
      if (prompt && !input) {
        setInput(prompt.prompt + (selectedCandidate ? ` for ${selectedCandidate.nickname}` : ''));
      }
    };
    reader.readAsDataURL(file);
    
    // Reset the input
    e.target.value = '';
  };

  const sendMessage = async () => {
    if ((!input.trim() && !pendingImage) || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim() || (pendingImage ? getImagePrompt(pendingImage.type) : ''),
      imageData: pendingImage?.data,
      imageType: pendingImage?.type,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setPendingImage(null);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to chat with D.E.V.I.");
        return;
      }

      // Prepare messages for API (without image data in history to reduce payload)
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      apiMessages.push({
        role: 'user',
        content: userMessage.content,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/devi-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            imageData: userMessage.imageData,
            imageType: userMessage.imageType,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      // Add empty assistant message
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantId 
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      // Remove the user message if there was an error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const getImagePrompt = (type: string): string => {
    switch (type) {
      case 'text_screenshot':
        return "Please analyze this text conversation";
      case 'ig_profile':
        return "Please analyze this Instagram profile";
      case 'dating_profile':
        return "Please analyze this dating profile";
      default:
        return "Please analyze this image";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && (input.trim() || pendingImage)) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[image:var(--gradient-page)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isFree) {
    return (
      <div className="min-h-screen bg-[image:var(--gradient-page)] pb-24">
        <header className="sticky top-0 z-50 bg-[image:var(--gradient-header)] backdrop-blur-xl border-b border-border/50 safe-area-top">
          <div className="container mx-auto px-4 py-4 max-w-lg">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl hover:bg-primary/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-xl hover:bg-primary/10">
                <Home className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">D.E.V.I.</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-lg">
          <div className="bg-card rounded-xl border border-border p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Unlock D.E.V.I. Chat</h2>
            <p className="text-muted-foreground">Upgrade to chat with your AI dating coach and get personalized advice.</p>
            <Button className="bg-[image:var(--gradient-hero)]" onClick={() => navigate("/settings?tab=billing")}>
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Unlock
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-area-top">
        <div className="container mx-auto px-4 py-3 max-w-lg">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-xl">
              <Home className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">D.E.V.I.</h1>
                <p className="text-xs text-muted-foreground">Your AI dating coach</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Candidate Selector Bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-2 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Talking about:</span>
            {profilesLoading ? (
              <div className="h-8 w-32 bg-muted rounded-lg animate-pulse" />
            ) : candidates.length === 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={() => navigate("/add-candidate")}
              >
                <Users className="w-4 h-4" />
                Add a candidate first
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    {selectedCandidate ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium">{selectedCandidate.nickname.charAt(0)}</span>
                        </div>
                        {selectedCandidate.nickname}
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        Select candidate
                      </>
                    )}
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {candidates.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
                      className="gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-medium">{c.nickname.charAt(0)}</span>
                      </div>
                      {c.nickname}
                      {selectedCandidate?.id === c.id && (
                        <Check className="w-4 h-4 ml-auto text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Profile Completeness Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Complete Profiles to Unlock
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To get the best analysis of screenshots, complete both your profile and {selectedCandidate?.nickname}'s profile.
            </p>
            
            <div className="space-y-3">
              {/* Your Profile */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Your Profile</span>
                  </div>
                  <span className={`text-sm font-medium ${userProfileCompleteness >= 70 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {userProfileCompleteness}%
                  </span>
                </div>
                <Progress value={userProfileCompleteness} className="h-1.5" />
                {userProfileCompleteness < 70 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 gap-2"
                    onClick={() => {
                      setShowProfileDialog(false);
                      navigate("/settings", { state: { tab: "profile" } });
                    }}
                  >
                    Complete Profile
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Candidate Profile */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedCandidate?.nickname}'s Profile</span>
                  </div>
                  <span className={`text-sm font-medium ${candidateCompleteness >= 70 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {candidateCompleteness}%
                  </span>
                </div>
                <Progress value={candidateCompleteness} className="h-1.5" />
                {candidateCompleteness < 70 && selectedCandidate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 gap-2"
                    onClick={() => {
                      setShowProfileDialog(false);
                      navigate(`/add-candidate?edit=${selectedCandidate.id}`);
                    }}
                  >
                    Complete Profile
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
          {messages.length === 0 ? (
            <div className="py-8 space-y-6">
              {/* Welcome */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-semibold">Hey! I'm D.E.V.I. 💜</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCandidate 
                    ? `Ask me anything about ${selectedCandidate.nickname}, or upload a screenshot for analysis.`
                    : "Select a candidate above to get started with personalized advice."}
                </p>
              </div>

              {/* Quick Upload Buttons - only show if profiles complete */}
              {selectedCandidate && profilesComplete && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">Upload for Analysis</p>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.type}
                        onClick={() => handleImageUpload(prompt.type)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <prompt.icon className="w-5 h-5 text-primary" />
                        <span className="text-xs font-medium text-center">{prompt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show locked state for screenshots */}
              {selectedCandidate && !profilesComplete && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">Upload for Analysis</p>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.type}
                        onClick={() => setShowProfileDialog(true)}
                        className="relative flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
                      >
                        <div className="relative">
                          <prompt.icon className="w-5 h-5 text-muted-foreground" />
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-muted border border-border flex items-center justify-center">
                            <Lock className="w-2 h-2 text-muted-foreground" />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-center text-muted-foreground">{prompt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Complete both profiles to unlock
                  </p>
                </div>
              )}

              {/* Example Questions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">Or ask me something</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EXAMPLE_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  {msg.imageData && (
                    <img 
                      src={msg.imageData} 
                      alt="Uploaded" 
                      className="max-w-full rounded-lg mb-2 max-h-48 object-cover"
                    />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md p-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border safe-area-bottom">
        <div className="container mx-auto px-4 py-3 max-w-lg">
          {/* Pending Image Preview */}
          {pendingImage && (
            <div className="mb-2 relative inline-block">
              <img 
                src={pendingImage.data} 
                alt="To upload" 
                className="h-20 rounded-lg object-cover"
              />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2 items-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleImageUpload('general')}
              className="shrink-0"
              disabled={isLoading}
            >
              <ImagePlus className="w-5 h-5" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask D.E.V.I. anything..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={(!input.trim() && !pendingImage) || isLoading}
              className="shrink-0 bg-[image:var(--gradient-hero)]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
};

export default Devi;
