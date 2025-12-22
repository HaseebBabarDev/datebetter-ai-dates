import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Home, Send, ImagePlus, X, Camera, Instagram, Heart, Loader2, User, Users, ArrowRight, ChevronDown, Check, Lock, RefreshCw, MessageSquare, Plus, Clock, Trash2, MessageCircle, History, Brain } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { useTour, DEVI_TOUR_STEPS } from "@/components/tour";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

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

interface Conversation {
  id: string;
  candidate_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

const QUICK_PROMPTS = [
  { icon: Camera, label: "Text Screenshot", type: "text_screenshot", prompt: "Analyze this text conversation" },
  { icon: Instagram, label: "IG Profile", type: "ig_profile", prompt: "Analyze this Instagram profile" },
  { icon: Heart, label: "Dating Profile", type: "dating_profile", prompt: "Analyze this dating profile" },
];

const EXAMPLE_QUESTIONS = [
  "Why isn't he texting me back?",
  "Is this a red flag?",
  "How do I bring up exclusivity?",
  "Help me rewire my dating thoughts",
];

const QUICK_REPLIES = [
  "Tell me more",
  "What should I do?",
  "Help me rewire my thoughts",
];

const MAX_MESSAGE_LENGTH = 400;

// Message bubble with truncation for long messages
const MessageBubble: React.FC<{ 
  message: Message; 
  isLast?: boolean;
  onQuickReply?: (reply: string) => void;
  isLoading?: boolean;
}> = ({ message, isLast, onQuickReply, isLoading }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = message.role === 'assistant' && message.content.length > MAX_MESSAGE_LENGTH;
  const displayContent = isLong && !expanded 
    ? message.content.slice(0, MAX_MESSAGE_LENGTH) + "..." 
    : message.content;

  const showQuickReplies = message.role === 'assistant' && isLast && !isLoading && onQuickReply;

  return (
    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl p-3 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        }`}
      >
        {message.imageData && (
          <img 
            src={message.imageData} 
            alt="Uploaded" 
            className="max-w-full rounded-lg mb-2 max-h-48 object-cover"
          />
        )}
        <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline"
          >
            {expanded ? "Show less" : "Continue reading"}
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {showQuickReplies && (
        <div className="flex flex-wrap gap-2 mt-2">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => onQuickReply(reply)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const USER_PROFILE_FIELDS = [
  { key: "relationship_goal", weight: 2, label: "Relationship Goal" },
  { key: "religion", weight: 2, label: "Religion" },
  { key: "politics", weight: 2, label: "Politics" },
  { key: "kids_desire", weight: 2, label: "Kids Preference" },
  { key: "attachment_style", weight: 2, label: "Attachment Style" },
  { key: "gender_identity", weight: 1, label: "Gender" },
  { key: "birth_date", weight: 1, label: "Birth Date" },
  { key: "country", weight: 1, label: "Country" },
  { key: "city", weight: 1, label: "City" },
];

const CANDIDATE_PROFILE_FIELDS = [
  { key: "age", weight: 2, label: "Age" },
  { key: "their_religion", weight: 2, label: "Religion" },
  { key: "their_politics", weight: 2, label: "Politics" },
  { key: "their_relationship_goal", weight: 2, label: "Relationship Goal" },
  { key: "their_kids_desire", weight: 2, label: "Kids Preference" },
  { key: "their_attachment_style", weight: 2, label: "Attachment Style" },
  { key: "gender_identity", weight: 1, label: "Gender" },
];

const calculateCompleteness = (data: Record<string, unknown>, fields: { key: string; weight: number; label: string }[]) => {
  let filledWeight = 0;
  let totalWeight = 0;
  const missingFields: string[] = [];
  
  fields.forEach(field => {
    totalWeight += field.weight;
    const value = data[field.key];
    if (value !== null && value !== undefined && value !== "") {
      filledWeight += field.weight;
    } else {
      missingFields.push(field.label);
    }
  });
  
  return {
    percentage: Math.round((filledWeight / totalWeight) * 100),
    missingFields,
  };
};

const Devi = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription } = useSubscription();
  const { startTour, hasCompletedTour } = useTour();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ data: string; type: string } | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);
  
  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  // Conversation choice dialog state
  const [showConversationChoice, setShowConversationChoice] = useState(false);
  const [pendingCandidateSelection, setPendingCandidateSelection] = useState<Candidate | null>(null);
  const [existingConversationForChoice, setExistingConversationForChoice] = useState<Conversation | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isFree = subscription?.plan === "free";
  const candidateIdFromState = (location.state as { candidateId?: string })?.candidateId;

  // Start tour for new users
  useEffect(() => {
    if (!profilesLoading && !isFree && !hasCompletedTour("devi")) {
      const timer = setTimeout(() => {
        startTour("devi", DEVI_TOUR_STEPS);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [profilesLoading, isFree, startTour, hasCompletedTour]);
  const candidateNameFromState = (location.state as { candidateName?: string })?.candidateName;

  // Calculate profile completeness
  const profileCompletenessResult = userProfile 
    ? calculateCompleteness(userProfile as unknown as Record<string, unknown>, USER_PROFILE_FIELDS)
    : { percentage: 0, missingFields: USER_PROFILE_FIELDS.map(f => f.label) };
  
  const userProfileCompleteness = profileCompletenessResult.percentage;
  const missingProfileFields = profileCompletenessResult.missingFields;
  
  // Check if user has full profile and at least one interaction
  const hasFullProfile = userProfileCompleteness === 100;
  const hasInteractions = interactions.length > 0;
  const canChat = hasFullProfile && hasInteractions;

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

  // Fetch conversations (last 30 days only)
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      
      setConversationsLoading(true);
      
      // Calculate 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Clean up old conversations (older than 30 days)
      await supabase
        .from("devi_conversations")
        .delete()
        .eq("user_id", user.id)
        .lt("updated_at", thirtyDaysAgo.toISOString());
      
      // Fetch remaining conversations
      const { data } = await supabase
        .from("devi_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      
      if (data) {
        setConversations(data as Conversation[]);
      }
      setConversationsLoading(false);
    };

    fetchConversations();
  }, [user]);

  // Fetch interactions when candidate changes
  useEffect(() => {
    const fetchInteractions = async () => {
      if (!user || !selectedCandidate) {
        setInteractions([]);
        return;
      }
      
      const { data } = await supabase
        .from("interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("candidate_id", selectedCandidate.id)
        .order("interaction_date", { ascending: false })
        .limit(20);
      
      if (data) {
        setInteractions(data);
      }
    };

    fetchInteractions();
  }, [user, selectedCandidate]);

  // Track which candidate we last loaded conversation for
  const lastLoadedCandidateRef = useRef<string | null>(null);

  // Auto-load most recent conversation for selected candidate
  useEffect(() => {
    const loadCandidateConversation = async () => {
      if (!user || !selectedCandidate || conversationsLoading) return;
      
      // Create a unique key combining candidate + conversation state
      const stateKey = `${selectedCandidate.id}-${conversations.length}`;
      
      // Skip if we already loaded for this exact state
      if (lastLoadedCandidateRef.current === stateKey) return;
      lastLoadedCandidateRef.current = stateKey;
      
      // Find most recent conversation for this candidate
      const candidateConv = conversations.find(c => c.candidate_id === selectedCandidate.id);
      
      if (candidateConv) {
        // Load the existing conversation
        const { data: messagesData } = await supabase
          .from("devi_messages")
          .select("*")
          .eq("conversation_id", candidateConv.id)
          .order("created_at", { ascending: true });
        
        if (messagesData && messagesData.length > 0) {
          setMessages(messagesData.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            imageData: m.image_url || undefined,
          })));
          setCurrentConversationId(candidateConv.id);
        } else {
          // Conversation exists but no messages, start fresh
          setMessages([]);
          setCurrentConversationId(null);
        }
      } else {
        // No existing conversation, start fresh
        setMessages([]);
        setCurrentConversationId(null);
      }
    };
    
    loadCandidateConversation();
  }, [selectedCandidate?.id, user, conversations, conversationsLoading]);

  useEffect(() => {
    if (candidateNameFromState && messages.length === 0 && !currentConversationId) {
      setInput(`I want to ask about ${candidateNameFromState}...`);
      textareaRef.current?.focus();
    }
  }, [candidateNameFromState, currentConversationId]);

  // Load messages when conversation changes
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    const { data: messagesData } = await supabase
      .from("devi_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (messagesData) {
      setMessages(messagesData.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        imageData: m.image_url || undefined,
      })));
    }
    
    // Get conversation to set candidate
    const { data: convData } = await supabase
      .from("devi_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();
    
    if (convData?.candidate_id) {
      const candidate = candidates.find(c => c.id === convData.candidate_id);
      if (candidate) setSelectedCandidate(candidate);
    }
    
    setCurrentConversationId(conversationId);
    setHistoryOpen(false);
  }, [user, candidates]);

  // Save message to database
  const saveMessage = useCallback(async (
    conversationId: string, 
    message: Message,
    imageUrl?: string
  ) => {
    if (!user) return;
    
    await supabase.from("devi_messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: message.role,
      content: message.content,
      image_url: imageUrl || null,
    });
    
    // Update conversation timestamp
    await supabase
      .from("devi_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }, [user]);

  // Create new conversation
  const createConversation = useCallback(async (firstMessage: string) => {
    if (!user) return null;
    
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    
    const { data, error } = await supabase
      .from("devi_conversations")
      .insert({
        user_id: user.id,
        candidate_id: selectedCandidate?.id || null,
        title,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
    
    setConversations(prev => [data as Conversation, ...prev]);
    setCurrentConversationId(data.id);
    return data.id;
  }, [user, selectedCandidate]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setHistoryOpen(false);
    lastLoadedCandidateRef.current = null; // Reset so new conversation can be created
  }, []);

  // Handle candidate selection with conversation choice
  const handleCandidateSelect = useCallback((candidate: Candidate) => {
    // Check if there's an existing conversation for this candidate
    const existingConv = conversations.find(c => c.candidate_id === candidate.id);
    
    if (existingConv && candidate.id !== selectedCandidate?.id) {
      // Show choice dialog
      setPendingCandidateSelection(candidate);
      setExistingConversationForChoice(existingConv);
      setShowConversationChoice(true);
    } else {
      // No existing conversation, just select
      setSelectedCandidate(candidate);
    }
  }, [conversations, selectedCandidate]);

  // Continue existing conversation
  const handleContinueConversation = useCallback(async () => {
    if (!pendingCandidateSelection || !existingConversationForChoice) return;
    
    setSelectedCandidate(pendingCandidateSelection);
    lastLoadedCandidateRef.current = pendingCandidateSelection.id;
    
    // Load the existing conversation
    const { data: messagesData } = await supabase
      .from("devi_messages")
      .select("*")
      .eq("conversation_id", existingConversationForChoice.id)
      .order("created_at", { ascending: true });
    
    if (messagesData) {
      setMessages(messagesData.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        imageData: m.image_url || undefined,
      })));
    }
    setCurrentConversationId(existingConversationForChoice.id);
    
    // Reset dialog state
    setShowConversationChoice(false);
    setPendingCandidateSelection(null);
    setExistingConversationForChoice(null);
  }, [pendingCandidateSelection, existingConversationForChoice]);

  // Start new conversation for candidate
  const handleStartNewConversation = useCallback(() => {
    if (!pendingCandidateSelection) return;
    
    setSelectedCandidate(pendingCandidateSelection);
    lastLoadedCandidateRef.current = pendingCandidateSelection.id;
    setMessages([]);
    setCurrentConversationId(null);
    
    // Reset dialog state
    setShowConversationChoice(false);
    setPendingCandidateSelection(null);
    setExistingConversationForChoice(null);
  }, [pendingCandidateSelection]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    await supabase
      .from("devi_conversations")
      .delete()
      .eq("id", conversationId);
    
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    if (currentConversationId === conversationId) {
      startNewChat();
    }
    
    toast.success("Conversation deleted");
  }, [user, currentConversationId, startNewChat]);

  const handleImageUpload = (type: string) => {
    if (!selectedCandidate) {
      toast.error("Please select a candidate first");
      return;
    }
    if (!canChat) {
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

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be less than 20MB");
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

  const handleUpdateScore = async () => {
    if (!selectedCandidate || isUpdatingScore) return;
    
    setIsUpdatingScore(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in");
        return;
      }

      const response = await supabase.functions.invoke("calculate-compatibility", {
        body: { candidateId: selectedCandidate.id },
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      // Check if score was actually calculated
      const hasNewScore = result?.score !== undefined && result?.score !== null;
      
      if (hasNewScore) {
        // Update local state with new score
        setSelectedCandidate(prev => prev ? {
          ...prev,
          compatibility_score: result.score,
          score_breakdown: result.breakdown,
          red_flags: result.breakdown?.red_flags || prev.red_flags,
          green_flags: result.breakdown?.green_flags || prev.green_flags,
        } : null);

        // Add a message about the score update
        const scoreMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `✨ Done! I've updated ${selectedCandidate.nickname}'s compatibility score.\n\n**New Score: ${result.score}%**\n\n${result.breakdown?.advice || "The score reflects the latest information we discussed."}\n\nWant me to break down what changed?`,
        };
        setMessages(prev => [...prev, scoreMessage]);
        
        // Save score message to conversation
        if (currentConversationId) {
          await saveMessage(currentConversationId, scoreMessage);
        }

        toast.success(`Score updated: ${result.score}%`);
      } else {
        // No change to score
        const noChangeMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I checked ${selectedCandidate.nickname}'s compatibility score, but there's no change based on current information.\n\nWant to add more details about them so I can refine the score?`,
        };
        setMessages(prev => [...prev, noChangeMessage]);
        
        if (currentConversationId) {
          await saveMessage(currentConversationId, noChangeMessage);
        }

        toast.info("No change to score");
      }
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score");
    } finally {
      setIsUpdatingScore(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if ((!textToSend && !pendingImage) || isLoading) return;
    
    // Require candidate selection and profile completion
    if (!selectedCandidate) {
      toast.error("Please select a candidate first");
      return;
    }
    if (!canChat) {
      setShowProfileDialog(true);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend || (pendingImage ? getImagePrompt(pendingImage.type) : ''),
      imageData: pendingImage?.data,
      imageType: pendingImage?.type,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setPendingImage(null);
    setIsLoading(true);

    // Create or use existing conversation
    let convId = currentConversationId;
    if (!convId) {
      convId = await createConversation(userMessage.content);
      if (!convId) {
        toast.error("Failed to create conversation");
        setIsLoading(false);
        return;
      }
    }

    // Save user message
    await saveMessage(convId, userMessage, userMessage.imageData);

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
            userProfile,
            candidateProfile: selectedCandidate,
            interactions,
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
      let textBuffer = "";
      
      // Single message bubble with cumulative content
      const assistantMessageId = crypto.randomUUID();
      let fullContent = "";
      let displayedContent = "";
      let messageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process complete lines
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              
              // Only display up to the last complete word (ends with space, punctuation, or newline)
              const lastWordBoundary = fullContent.search(/[\s.,!?:;\n][^\s.,!?:;\n]*$/);
              const contentToDisplay = lastWordBoundary > 0 
                ? fullContent.slice(0, lastWordBoundary + 1)
                : "";
              
              // Only update UI if we have new complete words to show
              if (contentToDisplay.length > displayedContent.length) {
                displayedContent = contentToDisplay;
                
                if (!messageAdded) {
                  // Add the message bubble on first displayable content
                  messageAdded = true;
                  setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: displayedContent }]);
                } else {
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, content: displayedContent }
                        : m
                    )
                  );
                }
              }
            }
          } catch {
            // Partial JSON - put back and wait for more data
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Display any remaining content after stream ends
      if (fullContent !== displayedContent) {
        if (!messageAdded) {
          setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: fullContent }]);
        } else {
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessageId 
                ? { ...m, content: fullContent }
                : m
            )
          );
        }
      }

      // Save the single assistant message after streaming completes
      if (convId && fullContent) {
        await saveMessage(convId, {
          id: assistantMessageId,
          role: 'assistant',
          content: fullContent,
        });
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
            <p className="text-muted-foreground">Upgrade to chat with your AI assistant and get personalized advice.</p>
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
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-area-top">
        <div className="container mx-auto px-4 py-3 max-w-lg">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-xl shrink-0">
              <Home className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-foreground">D.E.V.I.</h1>
                <p className="text-xs text-muted-foreground truncate">Your AI assistant</p>
              </div>
            </div>
            
            {/* New Chat Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewChat}
              className="rounded-xl shrink-0"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </Button>
            
            {/* Chat History Sheet */}
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl shrink-0" title="Chat History" data-tour="devi-history">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Chat History
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)]">
                  <div className="p-2 space-y-1">
                    {conversationsLoading ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Loading...
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No conversations yet
                      </div>
                    ) : (
                      conversations.map((conv) => {
                        const candidate = candidates.find(c => c.id === conv.candidate_id);
                        return (
                          <div
                            key={conv.id}
                            className={`group flex items-start gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                              currentConversationId === conv.id ? 'bg-muted' : ''
                            }`}
                            onClick={() => loadConversation(conv.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{conv.title || "New conversation"}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {candidate && (
                                  <span className="text-xs text-primary truncate">{candidate.nickname}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(conv.updated_at), "MMM d")}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
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
                  <Button variant="outline" size="sm" className="h-8 gap-2" data-tour="devi-candidate-select">
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
                  {candidates.map((c) => {
                    const hasConversation = conversations.some(conv => conv.candidate_id === c.id);
                    return (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => handleCandidateSelect(c)}
                        className="gap-2"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium">{c.nickname.charAt(0)}</span>
                        </div>
                        <span className="flex-1">{c.nickname}</span>
                        {hasConversation && (
                          <MessageCircle className="w-3 h-3 text-muted-foreground" />
                        )}
                        {selectedCandidate?.id === c.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Update Score Button */}
            {selectedCandidate && messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 ml-auto"
                onClick={handleUpdateScore}
                disabled={isUpdatingScore}
              >
                {isUpdatingScore ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span className="text-xs">Update Score</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Choice Dialog */}
      <Dialog open={showConversationChoice} onOpenChange={setShowConversationChoice}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Continue or Start Fresh?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You have an existing conversation with {pendingCandidateSelection?.nickname}. What would you like to do?
            </p>
            
            <div className="space-y-2">
              <Button
                className="w-full gap-2 justify-start"
                onClick={handleContinueConversation}
              >
                <History className="w-4 h-4" />
                Continue conversation
              </Button>
              
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
                onClick={handleStartNewConversation}
              >
                <Plus className="w-4 h-4" />
                Start new chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Requirements Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              No Fluff. Just Real Advice.
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-foreground font-medium">
                Unlike other apps, D.E.V.I. doesn't guess or give generic tips.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                We use your actual data, patterns, and history to give you real, personalized advice backed by logic — not vibes.
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Complete these to unlock D.E.V.I.:
            </p>
            
            <div className="space-y-3">
              {/* Your Profile */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Your Profile</span>
                  </div>
                  <span className={`text-sm font-medium ${hasFullProfile ? 'text-primary' : 'text-muted-foreground'}`}>
                    {userProfileCompleteness}%
                  </span>
                </div>
                <Progress value={userProfileCompleteness} className="h-1.5" />
                {!hasFullProfile && missingProfileFields.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Missing: {missingProfileFields.slice(0, 3).join(", ")}
                    {missingProfileFields.length > 3 && ` +${missingProfileFields.length - 3} more`}
                  </p>
                )}
                {!hasFullProfile && (
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

              {/* Logged Interaction */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Logged Interaction</span>
                  </div>
                  <span className={`text-sm font-medium ${hasInteractions ? 'text-primary' : 'text-muted-foreground'}`}>
                    {hasInteractions ? `${interactions.length} logged` : "None"}
                  </span>
                </div>
                <Progress value={hasInteractions ? 100 : 0} className="h-1.5" />
                {!hasInteractions && selectedCandidate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 gap-2"
                    onClick={() => {
                      setShowProfileDialog(false);
                      navigate(`/candidate/${selectedCandidate.id}`);
                    }}
                  >
                    Log an Interaction
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
          {messages.length === 0 ? (
            <div className="py-4">
              {/* Single welcome bubble - feels like a chat */}
              <div className="flex items-start gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md p-3 max-w-[85%]">
                  <p className="text-sm">
                    {selectedCandidate 
                      ? `Hey! 👋 What's going on with ${selectedCandidate.nickname}?`
                      : "Hey babe! 👋 Pick who we're talking about and spill the tea ☕"}
                  </p>
                </div>
              </div>

              {/* Quick prompts as tappable suggestions */}
              {selectedCandidate && canChat && (
                <div className="pl-10 space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(q)}
                        className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  
                  {/* Upload hint - very subtle */}
                  <button
                    onClick={() => handleImageUpload('text_screenshot')}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-3"
                  >
                    <Camera className="w-3 h-3" />
                    or send a screenshot
                  </button>
                </div>
              )}

              {/* Locked state - inline */}
              {selectedCandidate && !canChat && (
                <div className="pl-10">
                  <button
                    onClick={() => setShowProfileDialog(true)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    Complete profile to unlock chat
                  </button>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, index) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isLast={index === messages.length - 1}
                onQuickReply={(reply) => sendMessage(reply)}
                isLoading={isLoading}
              />
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 bg-background border-t border-border pb-16 safe-area-bottom">
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
          
          {/* Show locked state if requirements not met */}
          {selectedCandidate && !canChat ? (
            <button
              onClick={() => setShowProfileDialog(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm">Complete profile & log interaction to unlock</span>
            </button>
          ) : !selectedCandidate ? (
            <div className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border bg-muted/50 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">Select a candidate to start chatting</span>
            </div>
          ) : (
            <div className="flex gap-2 items-end" data-tour="devi-input">
              <TooltipProvider delayDuration={400}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleImageUpload('general')}
                      className="shrink-0"
                      disabled={isLoading}
                      data-tour="devi-image-upload"
                    >
                      <ImagePlus className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Upload text screenshots or dating profiles for analysis</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about ${selectedCandidate.nickname}...`}
                className="min-h-[44px] max-h-32 resize-none"
                rows={1}
                disabled={isLoading}
              />
              <TooltipProvider delayDuration={400}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      onClick={() => sendMessage()}
                      disabled={(!input.trim() && !pendingImage) || isLoading}
                      className="shrink-0 bg-[image:var(--gradient-hero)]"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Send your message to D.E.V.I.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
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
