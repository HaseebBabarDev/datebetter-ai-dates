import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowLeft, Sparkles, Home, Send, ImagePlus, X, Camera, Instagram, Heart, Loader2, User, UserPlus, Users, ArrowRight, ChevronDown, Check, Lock, RefreshCw, MessageSquare, Plus, Clock, Trash2, MessageCircle, History, Brain, SlidersHorizontal, LayoutGrid, AlignLeft, Unlink, Zap } from "lucide-react";
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
import { useTour, DEVI_TOUR_STEPS, TourRestartButton } from "@/components/tour";
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
import { detectCrisisContent, CrisisDetectionResult } from "@/lib/crisisDetection";
import { CrisisAlertDialog } from "@/components/devi/CrisisAlertDialog";
import { DeviWinDialog, DeviWinPrompt } from "@/components/devi/DeviWinDialog";
import { ProfileSectionsNudge } from "@/components/devi/ProfileSectionsNudge";
import { HealingJourney } from "@/components/devi/HealingJourney";
import { ChatGPTMessage } from "@/components/devi/ChatGPTMessage";
import { AIDisclosure } from "@/components/AIDisclosure";
import TextSimulator, { TextSimulatorCTA } from "@/components/candidate/TextSimulator";
import { VoiceInputButton } from "@/components/devi/VoiceInputButton";
import { VoicePlayButton } from "@/components/devi/VoicePlayButton";
import { DeviThinkingIndicator } from "@/components/devi/DeviThinkingIndicator";
import { DatingAdvisorCard } from "@/components/devi/DatingAdvisorCard";
import { FirstTimeIntake } from "@/components/devi/FirstTimeIntake";
import { CompleteProfileNudge } from "@/components/devi/CompleteProfileNudge";
import { OnboardingProgressCTA } from "@/components/devi/OnboardingProgressCTA";
import { ConversationUploadSheet } from "@/components/devi/ConversationUploadSheet";
import { InlineProfileEditor } from "@/components/devi/InlineProfileEditor";
import { CandidateIntakeCTA } from "@/components/candidate/CandidateIntakeCTA";
import { InlineCandidateEditor } from "@/components/candidate/InlineCandidateEditor";

type Candidate = Tables<"candidates">;
type Profile = Tables<"profiles">;

const buildSimulatorContext = (c: Candidate): string => {
  const flags = (arr: unknown) => Array.isArray(arr) && arr.length > 0 ? arr.join(", ") : null;
  const parts: (string | null)[] = [
    c.notes,
    c.status ? `Current status: ${c.status.replace(/_/g, " ")}` : null,
    c.their_attachment_style ? `Their attachment style: ${c.their_attachment_style}` : null,
    c.their_relationship_goal ? `Their relationship goal: ${c.their_relationship_goal.replace(/_/g, " ")}` : null,
    c.their_relationship_status ? `Their relationship status: ${c.their_relationship_status.replace(/_/g, " ")}` : null,
    c.end_reason ? `Reason the relationship ended: ${c.end_reason}` : null,
    flags(c.red_flags) ? `Red flags observed: ${flags(c.red_flags)}` : null,
    flags(c.green_flags) ? `Green flags observed: ${flags(c.green_flags)}` : null,
    flags(c.cons) ? `Cons: ${flags(c.cons)}` : null,
    flags(c.pros) ? `Pros: ${flags(c.pros)}` : null,
    c.met_via ? `Met via: ${c.met_via}${c.met_app ? ` (${c.met_app})` : ""}` : null,
    c.their_social_style ? `Social style: ${c.their_social_style}` : null,
    c.their_in_therapy ? `In therapy: ${c.their_in_therapy}` : null,
    c.their_mental_health_awareness ? `Mental health awareness: ${c.their_mental_health_awareness}` : null,
    c.their_drinking ? `Drinking: ${c.their_drinking}` : null,
    c.their_smoking ? `Smoking: ${c.their_smoking}` : null,
    c.their_kids_desire ? `Kids desire: ${c.their_kids_desire.replace(/_/g, " ")}` : null,
    c.their_religion ? `Religion: ${c.their_religion}` : null,
    c.their_politics ? `Politics: ${c.their_politics}` : null,
    c.their_career_stage ? `Career stage: ${c.their_career_stage}` : null,
    c.their_education_level ? `Education: ${c.their_education_level}` : null,
    c.their_schedule_flexibility ? `Schedule flexibility: ${c.their_schedule_flexibility}` : null,
    c.their_family_stability ? `Family stability: ${c.their_family_stability}` : null,
    c.their_parents_relationship ? `Parents relationship: ${c.their_parents_relationship}` : null,
    flags(c.their_parent_wounds) ? `Parent wounds: ${flags(c.their_parent_wounds)}` : null,
    flags(c.their_generational_patterns) ? `Generational patterns: ${flags(c.their_generational_patterns)}` : null,
    c.their_family_notes ? `Family notes: ${c.their_family_notes}` : null,
    c.their_relationship_notes ? `Relationship notes: ${c.their_relationship_notes}` : null,
    c.user_goal_for_candidate ? `User's goal for this person: ${c.user_goal_for_candidate}` : null,
    c.no_contact_active ? `Currently in no-contact mode (day ${c.no_contact_day || 0})` : null,
    c.ai_description ? `AI description: ${c.ai_description}` : null,
    c.distance_approximation ? `Distance: ${c.distance_approximation}` : null,
    c.age ? `Age: ${c.age}` : null,
    c.zodiac_sign ? `Zodiac: ${c.zodiac_sign}` : null,
  ];
  return parts.filter(Boolean).join(". ");
};
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageData?: string;      // kept for backward-compat (single, stored in DB)
  imageType?: string;
  imagesData?: string[];   // multiple images for a single message
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

// Get gender-appropriate greeting based on user profile
const getDeviGreeting = (profile: Profile | null): string => {
  const isMale = profile?.gender_identity === "man_cis" || profile?.gender_identity === "man_trans";
  
  if (isMale) {
    return "Hey! 👋 I'm here to help with anything dating-related. Ask me about dating advice, red flags, self-improvement, or select a candidate to discuss someone specific!";
  }
  return "Hey babe! 👋 I'm here to help with anything dating-related. Ask me about dating advice, red flags, self-improvement, or select a candidate to discuss someone specific!";
};

// Get pronoun based on user's dating preferences
const getTargetPronoun = (profile: Profile | null): string => {
  const interestedIn = profile?.interested_in || [];
  
  // If interested in only men
  if (interestedIn.length === 1 && interestedIn[0] === "men") {
    return "he";
  }
  // If interested in only women
  if (interestedIn.length === 1 && interestedIn[0] === "women") {
    return "she";
  }
  // If interested in multiple or non-binary/all - use "they"
  return "they";
};

// Mental health focused questions (when no candidate selected)
const GENERAL_QUESTIONS = [
  "How do I stop overthinking after dates?",
  "Am I ready to start dating again?",
  "Why do I keep attracting unavailable people?",
  "Help me build my self-worth",
];

// Relationship focused questions (when candidate selected)
const getRelationshipQuestions = (profile: Profile | null): string[] => {
  const pronoun = getTargetPronoun(profile);
  const verb = pronoun === "they" ? "aren't" : "isn't";
  
  return [
    `Why ${verb} ${pronoun} texting me back?`,
    "Is this a red flag?",
    "How do I bring up exclusivity?",
    "Should I end things?",
  ];
};

// Get example questions based on context
const getExampleQuestions = (profile: Profile | null, hasCandidate: boolean): string[] => {
  if (hasCandidate) {
    return getRelationshipQuestions(profile);
  }
  return GENERAL_QUESTIONS;
};

const QUICK_REPLIES = [
  "Tell me more",
  "What should I do?",
  "Help me rewire my thoughts",
];

const MAX_MESSAGE_LENGTH = 400;
const SOFT_LIMIT_MESSAGES = 30; // Soft warning
const MAX_CONVERSATION_MESSAGES = 40; // Hard nudge to start new chat

// Phrases that suggest a user is struggling and might benefit from a detachment plan
// Phrases that indicate passive distress / struggling emotionally
const DETACHMENT_DISTRESS_PHRASES = [
  "can't stop thinking about", "can't move on", "can't let go", "obsessing",
  "keeps coming back to mind", "miss them so much", "heartbroken", "devastated",
  "can't get over", "still not over", "hurts so much", "it hurts",
  "crying", "feel lost without", "don't know how to move on", "how do i move on",
  "can't stop thinking about him", "can't stop thinking about her",
  "stuck", "can't heal", "can't heal from", "spiraling", "ruminating",
  "shouldn't have feelings for", "still love them", "still have feelings",
  "hard to detach", "hard to let go", "so attached",
];

// Phrases where the user is explicitly asking for help detaching / moving on
const DETACHMENT_INTENT_PHRASES = [
  "help me detach", "help me move on", "help me let go", "help me get over",
  "want to detach", "want to move on", "want to let go", "want to get over",
  "need to detach", "need to move on", "need to let go", "need to get over",
  "ready to move on", "ready to let go", "ready to detach",
  "trying to move on", "trying to let go", "trying to detach",
  "how do i detach", "how to detach", "how to let go", "how to move on",
  "detach from", "detachment plan", "steps to move on", "process of letting go",
  "stop having feelings", "get over them", "get over him", "get over her",
  "stop thinking about", "stop loving", "fall out of love",
];

const detectsDetachmentNeed = (content: string): boolean => {
  const lower = content.toLowerCase();
  return DETACHMENT_DISTRESS_PHRASES.some(phrase => lower.includes(phrase)) ||
         DETACHMENT_INTENT_PHRASES.some(phrase => lower.includes(phrase));
};

const detectsDetachmentIntent = (content: string): boolean => {
  const lower = content.toLowerCase();
  return DETACHMENT_INTENT_PHRASES.some(phrase => lower.includes(phrase));
};

// Format assistant messages with better structure
const formatAssistantMessage = (content: string): React.ReactNode => {
  // Split by double newlines to get paragraphs/sections
  const sections = content.split(/\n\n+/);
  
  return sections.map((section, sectionIdx) => {
    const lines = section.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let numberedItems: { num: string; text: string }[] = [];
    
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${sectionIdx}-${elements.length}`} className="space-y-1.5 my-2 ml-1">
            {listItems.map((item, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };
    
    const flushNumberedList = () => {
      if (numberedItems.length > 0) {
        elements.push(
          <ol key={`ol-${sectionIdx}-${elements.length}`} className="space-y-1.5 my-2 ml-1">
            {numberedItems.map((item, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="text-primary font-medium flex-shrink-0 min-w-[1.25rem]">{item.num}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>
        );
        numberedItems = [];
      }
    };
    
    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      
      // Check for bullet points (-, *, •)
      const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
      if (bulletMatch) {
        flushNumberedList();
        listItems.push(bulletMatch[1]);
        return;
      }
      
      // Check for numbered lists (1., 2., etc.)
      const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
      if (numberedMatch) {
        flushList();
        numberedItems.push({ num: `${numberedMatch[1]}.`, text: numberedMatch[2] });
        return;
      }
      
      // Regular text - flush any pending lists first
      flushList();
      flushNumberedList();
      
      if (trimmed) {
        // Check for bold text (**text** or __text__)
        const formattedLine = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/__(.+?)__/g, '<strong>$1</strong>');
        
        // Check if it looks like a header/title (short, ends with : or is all caps portion)
        const isHeader = (trimmed.endsWith(':') && trimmed.length < 60) || 
                         (trimmed.length < 40 && /^[A-Z]/.test(trimmed) && !trimmed.includes('.'));
        
        elements.push(
          <p 
            key={`p-${sectionIdx}-${lineIdx}`} 
            className={isHeader ? "font-semibold text-foreground mt-2 first:mt-0" : ""}
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      }
    });
    
    // Flush any remaining lists
    flushList();
    flushNumberedList();
    
    return (
      <div key={sectionIdx} className={sectionIdx > 0 ? "mt-3" : ""}>
        {elements}
      </div>
    );
  });
};

// Message bubble with truncation for long messages
const MessageBubble: React.FC<{ 
  message: Message; 
  isLast?: boolean;
  onQuickReply?: (reply: string) => void;
  isLoading?: boolean;
}> = ({ message, isLast, onQuickReply, isLoading }) => {
  const [expanded, setExpanded] = useState(false);
  // Strip internal metadata markers from displayed content
  const cleanContent = message.content.replace(/\[User (?:also )?uploaded \d+ (?:file|screenshot|recording)\(s\)[^\]]*\]\n*/gi, '').trim();
  const isLong = message.role === 'assistant' && cleanContent.length > MAX_MESSAGE_LENGTH;
  const displayContent = isLong && !expanded 
    ? cleanContent.slice(0, MAX_MESSAGE_LENGTH) + "..." 
    : cleanContent;

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
        {message.role === 'assistant' ? (
          <div className="text-sm space-y-1">
            {formatAssistantMessage(displayContent)}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
        )}
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
      {/* Voice play button for assistant messages */}
      {message.role === 'assistant' && (
        <div className="mt-1 ml-1">
          <VoicePlayButton text={message.content} size="sm" />
        </div>
      )}
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

// Core fields that are required for onboarding completion
// Only include fields that are actually collected during the onboarding flow
const USER_PROFILE_FIELDS = [
  { key: "gender_identity", weight: 2, label: "Gender Identity" },
  { key: "pronouns", weight: 1, label: "Pronouns" },
  { key: "interested_in", weight: 2, label: "Dating Preferences" },
  { key: "relationship_goal", weight: 2, label: "Relationship Goal" },
  { key: "kids_desire", weight: 1, label: "Kids & Family" },
  { key: "career_stage", weight: 1, label: "Career" },
  { key: "education_level", weight: 1, label: "Education" },
  { key: "communication_style", weight: 1, label: "Communication Style" },
  { key: "attachment_style", weight: 1, label: "Attachment Style" },
  { key: "parents_relationship_dynamic", weight: 1, label: "Family Background" },
  { key: "felt_loved_as_child", weight: 1, label: "Upbringing" },
  { key: "boundary_strength", weight: 1, label: "Boundaries" },
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
  const [isThinking, setIsThinking] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ data: string; type: string }[]>([]);
  const [textScreenshotRightSide, setTextScreenshotRightSide] = useState<"me" | "them">("me");
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
  const [showTextSimFromDialog, setShowTextSimFromDialog] = useState(false);
  const [pendingCandidateSelection, setPendingCandidateSelection] = useState<Candidate | null>(null);
  const [existingConversationForChoice, setExistingConversationForChoice] = useState<Conversation | null>(null);
  
  // Crisis detection state
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<"moderate" | "severe">("moderate");
  const [crisisCategory, setCrisisCategory] = useState<"crisis" | "harmful_content" | "emergency">("crisis");
  
  // Win logging state
  const [showWinDialog, setShowWinDialog] = useState(false);
  
  // Soft warning dismissal state
  const [softWarningDismissed, setSoftWarningDismissed] = useState(false);
  
  // Profile sections nudge dismissal state
  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(false);

  // Detachment plan CTA dismissal
  const [detachmentCtaDismissed, setDetachmentCtaDismissed] = useState(false);
  
  // Dating advisor interactive card state
  const [showDatingAdvisorCard, setShowDatingAdvisorCard] = useState(false);
  
  // Conversation upload sheet state
  const [showConvoUpload, setShowConvoUpload] = useState(false);
  
  // Chat layout style - chatgpt (default) or bubble
  const [chatLayout, setChatLayout] = useState<"bubble" | "chatgpt">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('devi-chat-layout') as "bubble" | "chatgpt") || "chatgpt";
    }
    return "chatgpt";
  });
  
  // Feeling check-in prompt handling
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPromptTypeRef = useRef<string | null>(searchParams.get("prompt"));
  const feelingPromptHandled = useRef(false);
  
  // First-time user flow
  const isFirstTime = searchParams.get("firstTime") === "true";
  const [firstTimeIntakeComplete, setFirstTimeIntakeComplete] = useState(false);
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const [profileEditorSection, setProfileEditorSection] = useState<string | null>(null);
  const [candidateIntakeDismissed, setCandidateIntakeDismissed] = useState(false);
  const [candidateEditorSection, setCandidateEditorSection] = useState<string | null>(null);
  const firstTimeAnalysisShown = useRef(false);
  const onboardingContextSent = useRef(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isFree = subscription?.plan === "free";
  // All users now have full chat access during 15-day trial
  const FREE_EXCHANGE_LIMIT = 999999;
  const freeExchangesUsed = 0;
  const freeExchangesRemaining = 999999;
  const freeTrialExhausted = false;
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
  const hasCoreOnboardingProfile = !!(userProfile?.gender_identity && userProfile?.relationship_goal);
  const onboardingIncomplete = !profilesLoading && (!userProfile || !hasCoreOnboardingProfile || userProfileCompleteness < 80);
  
  // No gates - chat is always accessible with the new trial model
  const hasFullProfile = !onboardingIncomplete;
  const hasInteractions = interactions.length > 0;
  const canChatWithCandidate = true;
  const canChatGeneral = true;
  
  // Mode: "general" = no candidate, "candidate" = specific candidate
  const chatMode = selectedCandidate ? "candidate" : "general";

  // Track if this is an initial load vs new message
  const isInitialLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(null);
  
  // Only scroll to bottom when messages actually change (new message added or initial load)
  useEffect(() => {
    if (messages.length === 0) {
      isInitialLoadRef.current = true;
      prevMessagesLengthRef.current = 0;
      lastMessageIdRef.current = null;
      return;
    }

    const lastMessageId = messages[messages.length - 1]?.id;
    
    // Skip if the last message hasn't changed (prevents scroll on unrelated re-renders)
    if (lastMessageId === lastMessageIdRef.current) {
      return;
    }
    
    // Determine if this is initial load (loading existing conversation) or a new message
    const isInitialLoad = isInitialLoadRef.current;
    
    // Use requestAnimationFrame + setTimeout to ensure DOM is fully rendered
    const scrollToBottom = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const container = scrollContainerRef.current;
          if (container) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: isInitialLoad ? "instant" : "smooth"
            });
          }
        }, 0);
      });
    };

    scrollToBottom();
    
    // Update refs after scroll
    isInitialLoadRef.current = false;
    prevMessagesLengthRef.current = messages.length;
    lastMessageIdRef.current = lastMessageId;
  }, [messages]);

  // Fetch candidates, user profile, and conversations in parallel
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setProfilesLoading(true);
      setConversationsLoading(true);
      
      // Check if we started in "feeling" or "healing" mode (general chat - no candidate)
      const isGeneralChatMode = initialPromptTypeRef.current === "feeling" || initialPromptTypeRef.current === "healing";
      
      // Calculate 30 days ago for conversation cleanup
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Fetch all data in parallel
      const [candidatesRes, profileRes, conversationsRes] = await Promise.all([
        supabase
          .from("candidates")
          .select("*")
          .eq("user_id", user.id)
          .neq("status", "archived")
          .order("updated_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("devi_conversations")
          .select("*")
          .eq("user_id", user.id)
          .gte("updated_at", thirtyDaysAgo.toISOString())
          .order("updated_at", { ascending: false })
          .limit(50),
      ]);
      
      // Process candidates
      if (candidatesRes.data) {
        setCandidates(candidatesRes.data);
        // Auto-select candidate: explicit candidateId from navigation, or default to most recently added
        if (candidateIdFromState && !isGeneralChatMode) {
          const found = candidatesRes.data.find(c => c.id === candidateIdFromState);
          if (found) setSelectedCandidate(found);
        } else if (!isGeneralChatMode && !selectedCandidate) {
          // Default to the most recently added candidate
          const sorted = [...candidatesRes.data].sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          if (sorted.length > 0) setSelectedCandidate(sorted[0]);
        }
      }
      
      // Process profile
        if (profileRes.data) {
          setUserProfile(profileRes.data);
        }
      
      // Process conversations
      if (conversationsRes.data) {
        setConversations(conversationsRes.data as Conversation[]);
      }
      
      setProfilesLoading(false);
      setConversationsLoading(false);
    };

    fetchData();
  }, [user, candidateIdFromState]);

  // Clean up old conversations in background (non-blocking)
  useEffect(() => {
    if (!user) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Fire and forget - don't await
    supabase
      .from("devi_conversations")
      .delete()
      .eq("user_id", user.id)
      .lt("updated_at", thirtyDaysAgo.toISOString());
  }, [user]);

  // Fetch interactions and journal entries when candidate changes
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  useEffect(() => {
    const fetchInteractions = async () => {
      if (!user || !selectedCandidate) {
        setInteractions([]);
        setJournalEntries([]);
        return;
      }
      
      const [intRes, journalRes] = await Promise.all([
        supabase
          .from("interactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("candidate_id", selectedCandidate.id)
          .order("interaction_date", { ascending: false })
          .limit(20),
        supabase
          .from("journal_entries" as any)
          .select("*")
          .eq("user_id", user.id)
          .eq("candidate_id", selectedCandidate.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      
      if (intRes.data) setInteractions(intRes.data);
      if (journalRes.data) setJournalEntries(journalRes.data as any[]);
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
      const candidateConversations = conversations
        .filter(c => c.candidate_id === selectedCandidate.id)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      const candidateConv = candidateConversations[0];
      
      if (candidateConv) {
        // Don't overwrite optimistic UI while a message is actively being sent
        if (isLoading) return;

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
        } else if (!currentConversationId && messages.length === 0) {
          // Only reset if we're truly starting fresh, not if user just added unsaved optimistic content
          setMessages([]);
          setCurrentConversationId(null);
        }
      } else if (!currentConversationId && messages.length === 0) {
        // No existing conversation, start fresh only when there is no active/optimistic chat state
        setMessages([]);
        setCurrentConversationId(null);
      }
    };
    
    loadCandidateConversation();
  }, [selectedCandidate?.id, user, conversations, conversationsLoading, isLoading, currentConversationId, messages.length]);

  useEffect(() => {
    if (candidateNameFromState && messages.length === 0 && !currentConversationId) {
      setInput(`I want to ask about ${candidateNameFromState}...`);
      textareaRef.current?.focus();
    }
  }, [candidateNameFromState, currentConversationId]);

  // Load messages when conversation changes
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    // Reset soft warning when loading a conversation
    setSoftWarningDismissed(false);
    
    // Mark as initial load so scroll uses "instant" behavior
    isInitialLoadRef.current = true;
    prevMessagesLengthRef.current = 0;
    
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
    } else {
      // Clear candidate if conversation has no candidate
      setSelectedCandidate(null);
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
    
    const { error: insertError } = await supabase.from("devi_messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: message.role,
      content: message.content,
      image_url: imageUrl || null,
    });

    if (insertError) {
      console.error("Error saving message:", insertError);
      throw insertError;
    }
    
    // Update conversation timestamp
    const { error: updateError } = await supabase
      .from("devi_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (updateError) {
      console.warn("Error updating conversation timestamp:", updateError);
    }
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
    setSoftWarningDismissed(false); // Reset warning dismissal for new chat
    lastLoadedCandidateRef.current = null; // Reset so new conversation can be created
  }, []);

  // Handle candidate selection with conversation choice
  const handleCandidateSelect = useCallback(async (candidate: Candidate) => {
    // If there's a current general conversation (no candidate), link it to this candidate
    if (currentConversationId && !selectedCandidate && messages.length > 0) {
      await supabase
        .from("devi_conversations")
        .update({ candidate_id: candidate.id })
        .eq("id", currentConversationId);
      
      setSelectedCandidate(candidate);
      // Update conversations list to reflect the change
      setConversations(prev => prev.map(c => 
        c.id === currentConversationId ? { ...c, candidate_id: candidate.id } : c
      ));
      return;
    }

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
  }, [conversations, selectedCandidate, currentConversationId, messages.length]);

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
    
    // Set the ref to match the stateKey format used by the auto-load effect
    // so it won't re-load the old conversation
    const stateKey = `${pendingCandidateSelection.id}-${conversations.length}`;
    lastLoadedCandidateRef.current = stateKey;
    
    setSelectedCandidate(pendingCandidateSelection);
    setMessages([]);
    setCurrentConversationId(null);
    
    // Reset dialog state
    setShowConversationChoice(false);
    setPendingCandidateSelection(null);
    setExistingConversationForChoice(null);
  }, [pendingCandidateSelection, conversations.length]);

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
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-type', type);
      fileInputRef.current.click();
    }
  };

  const handleConversationUpload = (data: {
    platform: string;
    files: { data: string; type: string; isVideo: boolean }[];
    perspective: "me" | "them";
  }) => {
    // Add all files as pending images with the conversation context
    const newImages = data.files.map(f => ({
      data: f.data,
      type: f.isVideo ? "conversation_video" : "text_screenshot",
    }));
    setPendingImages(prev => [...prev, ...newImages]);
    setTextScreenshotRightSide(data.perspective);

    // Set a smart prompt
    const platformLabel = data.platform.replace(/_/g, " ");
    const candidateRef = selectedCandidate ? ` with ${selectedCandidate.nickname}` : "";
    setInput(
      `Analyze this ${platformLabel} conversation${candidateRef}. Tell me who's chasing, red/green flags, attachment patterns, and what I should do next.`
    );
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const imageType = e.target.getAttribute('data-type') || 'general';
    const newImages: { data: string; type: string }[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 20MB`);
        continue;
      }

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          newImages.push({ data: reader.result as string, type: imageType });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    if (newImages.length > 0) {
      setPendingImages(prev => [...prev, ...newImages]);
      // Set a default prompt based on image type if input is empty
      const prompt = QUICK_PROMPTS.find(p => p.type === imageType);
      if (prompt && !input) {
        setInput(prompt.prompt + (selectedCandidate ? ` for ${selectedCandidate.nickname}` : ''));
      }
    }

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
    if ((!textToSend && pendingImages.length === 0) || isLoading) return;
    

    // Free trial gate: 5 exchanges max
    if (freeTrialExhausted) {
      navigate("/subscription");
      return;
    }

    // Check for crisis content in user message
    const crisisResult = detectCrisisContent(textToSend);
    if (crisisResult.detected) {
      setCrisisSeverity(crisisResult.severity);
      setCrisisCategory(crisisResult.category || "crisis");
      setShowCrisisAlert(true);
      if (crisisResult.category === "harmful_content") {
        return;
      }
    }

    const draftInput = input;
    const draftImages = pendingImages;
    const draftTextScreenshotRightSide = textScreenshotRightSide;
    const firstImage = draftImages[0] ?? null;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend || (firstImage ? getImagePrompt(firstImage.type, draftTextScreenshotRightSide) : ''),
      imageData: firstImage?.data,
      imageType: firstImage?.type,
      imagesData: draftImages.length > 0 ? draftImages.map(i => i.data) : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setPendingImages([]);
    setIsLoading(true);
    setIsThinking(true);

    let convId = currentConversationId;
    try {
      // Create or use existing conversation
      if (!convId) {
        convId = await createConversation(userMessage.content);
        if (!convId) {
          throw new Error("Failed to create conversation");
        }
      }

      // Save user message
      await saveMessage(convId, userMessage, userMessage.imageData);

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
            imagesData: userMessage.imagesData,
            imageType: userMessage.imageType,
            textScreenshotRightSide:
              userMessage.imageType === "text_screenshot" ? textScreenshotRightSide : undefined,
            userProfile,
            candidateProfile: selectedCandidate,
            interactions,
            journalEntries,
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
      let messageAdded = false;
      
      // Minimum thinking display time (1.8s) so users see the research phases
      const thinkingStartTime = Date.now();
      const MIN_THINKING_MS = 1800;
      
      const stripMarkers = (text: string) => text
        .replace(/\[RECALCULATE_HEALING_SCORE\]/g, '')
        .replace(/\[SET_HEALING_SCORE:\d+\]/g, '')
        .replace(/\[SET_BOUNDARY_STRENGTH:\d+\]/g, '')
        .replace(/\[SET_RED_FLAG_SENSITIVITY:\d+\]/g, '')
        .replace(/\[SET_LOVE_BOMBING_SENSITIVITY:\d+\]/g, '')
        .replace(/\[SET_OVER_EX_LEVEL:\d+\]/g, '')
        .replace(/\[SET_ATTACHMENT_TO_PAST:\d+\]/g, '')
        .replace(/\[SET_COMPATIBILITY_SCORE:\d+\]/g, '')
        .replace(/\[LOG_INTERACTION:[^\]]*\]?/g, '')
        .replace(/\[SET_PROFILE:[^\]]*\]?/g, '')
        .replace(/\[[A-Z_]+:[^\]]*\]?/g, '')
        .replace(/\[[A-Z_]{3,}\]/g, '')
        .trim();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines
          const lines = textBuffer.split('\n');
          // Keep the last incomplete line in the buffer
          textBuffer = lines.pop() || '';
          
          for (const rawLine of lines) {
            const line = rawLine.replace(/\r$/, '');
            
            // Skip empty lines and comments
            if (!line || line.startsWith(':')) continue;
            
            // Only process data lines
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                
                const displayContent = stripMarkers(fullContent);
                
                // Don't show message until minimum thinking time has elapsed
                const elapsed = Date.now() - thinkingStartTime;
                if (elapsed < MIN_THINKING_MS) {
                  // Buffer content but keep thinking indicator visible
                  continue;
                }
                
                if (!messageAdded) {
                  messageAdded = true;
                  setIsThinking(false);
                  setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: displayContent }]);
                } else {
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, content: displayContent }
                        : m
                    )
                  );
                  // Keep scrolled to bottom during streaming
                  const container = scrollContainerRef.current;
                  if (container) {
                    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                  }
                }
              }
            } catch (parseError) {
              // Log parse errors for debugging but continue processing
              console.warn('SSE parse error:', parseError, 'Line:', jsonStr.substring(0, 100));
              continue;
            }
          }
        }
        
        // Process any remaining content in the buffer after stream ends
        if (textBuffer.trim()) {
          const line = textBuffer.replace(/\r$/, '');
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr !== '[DONE]') {
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                }
              } catch {
                // Final chunk parse error - ignore
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Ensure final content is displayed correctly with markers stripped
      if (fullContent) {
        const finalDisplay = stripMarkers(fullContent);
        if (!messageAdded) {
          setIsThinking(false);
          setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: finalDisplay }]);
        } else {
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessageId 
                ? { ...m, content: finalDisplay }
                : m
            )
          );
        }
        // Final scroll to bottom
        setTimeout(() => {
          const container = scrollContainerRef.current;
          if (container) {
            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
          }
        }, 100);
      }

      // Save the single assistant message after streaming completes
      if (convId && fullContent) {
        // Remove all markers before saving
        let cleanContent = stripMarkers(fullContent);
          
        await saveMessage(convId, {
          id: assistantMessageId,
          role: 'assistant',
          content: cleanContent,
        });
        
        // Process profile update markers
        const profileUpdates: Partial<Profile> = {};
        let hasUpdates = false;
        
        // Parse direct value markers
        const healingMatch = fullContent.match(/\[SET_HEALING_SCORE:(\d+)\]/);
        if (healingMatch) {
          // Cap at 98% - no one is 100% healed
          const value = Math.min(98, Math.max(0, parseInt(healingMatch[1])));
          profileUpdates.healing_score = value;
          hasUpdates = true;
          toast.success(`Healing score updated to ${value}%`);
        }
        
        const boundaryMatch = fullContent.match(/\[SET_BOUNDARY_STRENGTH:(\d+)\]/);
        if (boundaryMatch) {
          const value = Math.min(10, Math.max(1, parseInt(boundaryMatch[1])));
          profileUpdates.boundary_strength = value;
          hasUpdates = true;
          toast.success(`Boundary strength updated to ${value}/10`);
        }
        
        const redFlagMatch = fullContent.match(/\[SET_RED_FLAG_SENSITIVITY:(\d+)\]/);
        if (redFlagMatch) {
          const value = Math.min(10, Math.max(1, parseInt(redFlagMatch[1])));
          profileUpdates.red_flag_sensitivity = value;
          hasUpdates = true;
          toast.success(`Red flag sensitivity updated to ${value}/10`);
        }
        
        const loveBombingMatch = fullContent.match(/\[SET_LOVE_BOMBING_SENSITIVITY:(\d+)\]/);
        if (loveBombingMatch) {
          const value = Math.min(10, Math.max(1, parseInt(loveBombingMatch[1])));
          profileUpdates.love_bombing_sensitivity = value;
          hasUpdates = true;
          toast.success(`Love bombing sensitivity updated to ${value}/10`);
        }
        
        const overExMatch = fullContent.match(/\[SET_OVER_EX_LEVEL:(\d+)\]/);
        if (overExMatch) {
          const value = Math.min(10, Math.max(1, parseInt(overExMatch[1])));
          profileUpdates.over_ex_level = value;
          hasUpdates = true;
          toast.success(`Over ex level updated to ${value}/10`);
        }
        
        const attachmentMatch = fullContent.match(/\[SET_ATTACHMENT_TO_PAST:(\d+)\]/);
        if (attachmentMatch) {
          const value = Math.min(10, Math.max(1, parseInt(attachmentMatch[1])));
          profileUpdates.attachment_to_past = value;
          hasUpdates = true;
          toast.success(`Attachment to past updated to ${value}/10`);
        }
        
        // Parse SET_PROFILE markers for onboarding intake
        const profileFieldMatches = fullContent.matchAll(/\[SET_PROFILE:(\w+):([^\]]+)\]/g);
        for (const match of profileFieldMatches) {
          const field = match[1];
          const value = match[2];
          
          // Handle special cases
          if (field === 'interested_in') {
            profileUpdates.interested_in = value.split(',').map(v => v.trim());
          } else if (field === 'faith_importance') {
            profileUpdates.faith_importance = Math.min(10, Math.max(1, parseInt(value)));
          } else if (['gender_identity', 'pronouns', 'sexual_orientation', 'relationship_goal', 
                       'relationship_status', 'relationship_structure', 'religion', 'kids_desire',
                       'kids_status', 'communication_style', 'attachment_style', 'politics', 
                       'social_style'].includes(field)) {
            // Enum fields - set directly
            (profileUpdates as any)[field] = value;
          } else if (['name', 'city', 'country', 'conflict_style', 'career_stage', 
                       'education_level', 'typical_partner_type', 'parents_relationship_dynamic',
                       'felt_loved_as_child'].includes(field)) {
            // Free text fields
            (profileUpdates as any)[field] = value;
          }
          hasUpdates = true;
        }
        
        // Parse compatibility score marker for candidate
        const compatScoreMatch = fullContent.match(/\[SET_COMPATIBILITY_SCORE:(\d+)\]/);
        if (compatScoreMatch && selectedCandidate && user) {
          const value = Math.min(100, Math.max(0, parseInt(compatScoreMatch[1])));
          try {
            const { error } = await supabase
              .from('candidates')
              .update({ 
                compatibility_score: value,
                last_score_update: new Date().toISOString(),
              })
              .eq('id', selectedCandidate.id)
              .eq('user_id', user.id);
            
            if (!error) {
              setSelectedCandidate(prev => prev ? {
                ...prev,
                compatibility_score: value,
                last_score_update: new Date().toISOString(),
              } : prev);
              toast.success(`${selectedCandidate.nickname}'s compatibility score updated to ${value}%`);
            } else {
              console.error('Failed to update compatibility score:', error);
              toast.error('Failed to update compatibility score');
            }
          } catch (err) {
            console.error('Compatibility score update error:', err);
          }
        }

        // Parse CREATE_CANDIDATE marker
        const createCandidateMatch = fullContent.match(/\[CREATE_CANDIDATE:([^|]+)\|([^|]*)\|([^|]*)\|([^\]]*)\]/);
        if (createCandidateMatch && user && !selectedCandidate) {
          const nickname = createCandidateMatch[1].trim();
          const age = createCandidateMatch[2].trim() ? parseInt(createCandidateMatch[2].trim()) : null;
          const city = createCandidateMatch[3].trim() || null;
          const status = createCandidateMatch[4].trim() || 'talking';
          
          if (nickname) {
            try {
              const { data: newCandidate, error } = await supabase
                .from('candidates')
                .insert({
                  user_id: user.id,
                  nickname,
                  age,
                  city,
                  status: status as any,
                })
                .select()
                .single();
              
              if (!error && newCandidate) {
                setSelectedCandidate(newCandidate);
                setCandidates(prev => [newCandidate, ...prev]);
                toast.success(`${nickname} added as a candidate!`);
              } else {
                console.error('Failed to create candidate:', error);
              }
            } catch (err) {
              console.error('Candidate creation error:', err);
            }
          }
        }
        
        if (hasUpdates && user) {
          try {
            const { error } = await supabase
              .from('profiles')
              .update(profileUpdates)
              .eq('user_id', user.id);
              
            if (error) {
              console.error('Failed to update profile:', error);
              toast.error('Failed to save profile updates');
            } else {
              // Update local state
              setUserProfile(prev => prev ? { ...prev, ...profileUpdates } : prev);
            }
          } catch (err) {
            console.error('Profile update error:', err);
          }
        }
        
        // Check if D.E.V.I. triggered a healing score recalculation (legacy marker)
        if (fullContent.includes('[RECALCULATE_HEALING_SCORE]')) {
          console.log('Healing score recalculation triggered by D.E.V.I.');
          try {
            const { data, error } = await supabase.functions.invoke('calculate-healing-score', {
              body: { triggerType: 'devi_conversation' },
            });
            if (!error && data) {
              toast.success(`Healing score updated: ${data.healingScore}%`, {
                description: data.scoreChange !== null 
                  ? `${Math.abs(data.scoreChange)}% ${data.scoreChange >= 0 ? 'up' : 'down'} from last check`
                  : 'First score calculated!',
              });
              // Update user profile state if available
              if (userProfile) {
                setUserProfile(prev => prev ? { ...prev, healing_score: data.healingScore } : prev);
              }
            }
          } catch (err) {
            console.error('Failed to recalculate healing score:', err);
          }
        }
        
        // Process interaction logging marker
        const interactionMatch = fullContent.match(/\[LOG_INTERACTION:([^\]]+)\]/);
        if (interactionMatch && selectedCandidate && user) {
          const parts = interactionMatch[1].split('|');
          if (parts.length >= 2) {
            const [type, date, notes, feeling] = parts;
            const interactionType = type || 'other';
            const interactionDate = date || new Date().toISOString().split('T')[0];
            const interactionNotes = notes || null;
            const overallFeeling = feeling ? Math.min(5, Math.max(1, parseInt(feeling))) : null;
            
            try {
              // Insert the interaction
              const { error: insertError } = await supabase
                .from('interactions')
                .insert({
                  user_id: user.id,
                  candidate_id: selectedCandidate.id,
                  interaction_type: interactionType as any,
                  interaction_date: interactionDate,
                  notes: interactionNotes,
                  overall_feeling: overallFeeling,
                });
              
              if (insertError) {
                console.error('Failed to log interaction:', insertError);
              } else {
                console.log('Interaction logged from D.E.V.I. chat:', { type: interactionType, date: interactionDate });
                toast.success(`Logged ${interactionType.replace('_', ' ')} with ${selectedCandidate.nickname}`, {
                  description: 'Compatibility score will be updated',
                });
                
                // Trigger compatibility score recalculation
                try {
                  const { data: scoreData, error: scoreError } = await supabase.functions.invoke('calculate-compatibility', {
                    body: { candidateId: selectedCandidate.id },
                  });
                  if (scoreError) {
                    console.error('Failed to recalculate compatibility:', scoreError);
                  } else if (scoreData?.overall_score !== undefined) {
                    // Update local candidate state with the new score
                    setSelectedCandidate(prev => prev ? {
                      ...prev,
                      compatibility_score: scoreData.overall_score,
                      score_breakdown: scoreData,
                      last_score_update: new Date().toISOString(),
                    } : prev);
                    console.log(`Compatibility score updated: ${scoreData.overall_score}%`);
                  }
                } catch (scoreErr) {
                  console.error('Error calling compatibility function:', scoreErr);
                }
                
                // Refresh interactions list
                const { data: updatedInteractions } = await supabase
                  .from('interactions')
                  .select('*')
                  .eq('candidate_id', selectedCandidate.id)
                  .order('interaction_date', { ascending: false });
                
                if (updatedInteractions) {
                  setInteractions(updatedInteractions);
                }
              }
            } catch (err) {
              console.error('Error logging interaction:', err);
            }
          }
        }
        
        // Update the displayed content to remove all markers
        const hasMarkers = fullContent.includes('[RECALCULATE_HEALING_SCORE]') ||
          fullContent.includes('[SET_HEALING_SCORE:') ||
          fullContent.includes('[SET_BOUNDARY_STRENGTH:') ||
          fullContent.includes('[SET_RED_FLAG_SENSITIVITY:') ||
          fullContent.includes('[SET_LOVE_BOMBING_SENSITIVITY:') ||
          fullContent.includes('[SET_OVER_EX_LEVEL:') ||
          fullContent.includes('[SET_ATTACHMENT_TO_PAST:') ||
          fullContent.includes('[LOG_INTERACTION:') ||
          fullContent.includes('[SET_PROFILE:') ||
          fullContent.includes('[CREATE_CANDIDATE:');
          
        if (hasMarkers) {
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessageId 
                ? { ...m, content: cleanContent }
                : m
            )
          );
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");

      // Restore draft so screenshot uploads/text are not lost on failure
      setInput(draftInput);
      setPendingImages(draftImages);
      setTextScreenshotRightSide(draftTextScreenshotRightSide);

      // Remove optimistic user message if the request failed before getting a usable assistant response
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Sorry, I couldn't process that message. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const getImagePrompt = (type: string, rightSide: "me" | "them"): string => {
    switch (type) {
      case "text_screenshot": {
        const right = rightSide === "them" ? "the other person (candidate)" : "me (the user)";
        const left = rightSide === "them" ? "me (the user)" : "the other person (candidate)";
        return `Please analyze this text conversation screenshot. IMPORTANT: In this screenshot, messages on the RIGHT are from ${right}, and messages on the LEFT are from ${left}.`;
      }
      case "ig_profile":
        return "Please analyze this Instagram profile";
      case "dating_profile":
        return "Please analyze this dating profile";
      default:
        return "Please analyze this image";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && (input.trim() || pendingImages.length > 0)) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle feeling check-in prompt from dashboard
  useEffect(() => {
    const promptType = searchParams.get("prompt");
    
    if (promptType === "feeling" && !feelingPromptHandled.current && !profilesLoading && !conversationsLoading) {
      feelingPromptHandled.current = true;
      
      // Clear the query param to prevent re-triggering
      setSearchParams({}, { replace: true });
      
      // Clear any selected candidate - feeling check-in is always general chat
      setSelectedCandidate(null);
      
      // Start a new chat and pre-fill a sample prompt
      startNewChat();
      setInput("I'm feeling [describe your emotions] about dating right now because...");
      
      // Focus the textarea so user can edit
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(12, 32); // Select "[describe your emotions]"
      }, 150);
    }
    
    // Handle healing journey prompt from dashboard
    if (promptType === "healing" && !feelingPromptHandled.current && !profilesLoading && !conversationsLoading) {
      feelingPromptHandled.current = true;
      
      // Clear the query param to prevent re-triggering
      setSearchParams({}, { replace: true });
      
      // Clear any selected candidate - healing is always general chat
      setSelectedCandidate(null);
      
      // Start a new chat with healing-focused context
      startNewChat();
      
      // Get healing score for context
      const healingScore = (userProfile as any)?.healing_score;
      const contextMessage = healingScore 
        ? `My current healing score is ${healingScore}%. I'd like to work on my healing journey and talk about [what's on your mind about healing/your ex/moving forward].`
        : "I'd like to work on my healing journey. Can you help me understand where I am and what I can work on?";
      
      setInput(contextMessage);
      
      // Focus the textarea so user can edit
      setTimeout(() => {
        textareaRef.current?.focus();
        if (healingScore) {
          // Select the bracketed placeholder text
          const start = contextMessage.indexOf('[');
          const end = contextMessage.indexOf(']') + 1;
          textareaRef.current?.setSelectionRange(start, end);
        }
      }, 150);
    }
  }, [searchParams, profilesLoading, conversationsLoading, setSearchParams, startNewChat, userProfile]);

  // Keep onboarding nudge visible for incomplete profiles, and resurface it after AI replies
  useEffect(() => {
    if (!userProfile) return;

    const shouldShowNudge = onboardingIncomplete || userProfileCompleteness < 80;

    if (messages.length === 0) {
      setShowProfileNudge(shouldShowNudge);
      return;
    }

    if (!firstTimeAnalysisShown.current && messages.length >= 2) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant" && shouldShowNudge) {
        firstTimeAnalysisShown.current = true;
        setShowProfileNudge(true);
      }
    }
  }, [messages, userProfile, userProfileCompleteness]);

  // Auto-send onboarding context on first time if available
  useEffect(() => {
    if (isFirstTime && !onboardingContextSent.current) {
      const uploadContext = localStorage.getItem("onboarding_upload_context");
      if (uploadContext && uploadContext.trim()) {
        onboardingContextSent.current = true;
        setFirstTimeIntakeComplete(true);
        
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("firstTime");
        setSearchParams(newParams, { replace: true });
        
        const goal = localStorage.getItem("onboarding_goal") || "evaluate";
        const goalLabel = goal === "detachment" ? "detach from someone" 
          : goal === "healing" ? "heal from a past relationship"
          : goal === "evaluate" ? "evaluate someone I'm dating"
          : goal === "checkup" ? "do a relationship check-up"
          : "start dating better";
        
        const contextMessage = [
          `I'm here to ${goalLabel}.`,
          uploadContext,
          "Can you help me get started?",
        ].filter(Boolean).join("\n\n");
        
        setTimeout(() => {
          sendMessage(contextMessage);
        }, 500);
        
        localStorage.removeItem("onboarding_upload_context");
      }
    }
  }, [isFirstTime]);

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

  // D.E.V.I. chat is now available to all users (free trial included)

  // First-time intake submission handler
  const handleFirstTimeIntake = async (data: {
    candidateName: string;
    candidateAge: string;
    candidateLocation: string;
    candidateSex: string;
    freeformInfo: string;
  }) => {
    if (!user) return;
    
    // Create candidate
    const { data: newCandidate, error } = await supabase
      .from("candidates")
      .insert({
        user_id: user.id,
        nickname: data.candidateName,
        age: data.candidateAge ? parseInt(data.candidateAge) : null,
        city: data.candidateLocation || null,
        gender_identity: data.candidateSex as any || null,
        notes: data.freeformInfo || null,
      })
      .select()
      .single();
    
    if (error) {
      toast.error("Failed to create candidate");
      return;
    }
    
    if (newCandidate) {
      setCandidates(prev => [newCandidate, ...prev]);
      setSelectedCandidate(newCandidate);
    }
    
    setFirstTimeIntakeComplete(true);
    
    // Remove firstTime param from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("firstTime");
    setSearchParams(newParams, { replace: true });
    
    // Auto-send a guided message asking for screenshot
    const goal = localStorage.getItem("onboarding_goal") || "evaluate";
    const contextParts = [
      `I just started using the app to ${goal === "detachment" ? "detach from" : goal === "healing" ? "heal from" : "evaluate"} ${data.candidateName}.`,
      data.candidateAge ? `They're ${data.candidateAge} years old.` : "",
      data.candidateLocation ? `Based in ${data.candidateLocation}.` : "",
      data.freeformInfo ? `Here's what I know: ${data.freeformInfo}` : "",
      "Can you give me an initial analysis? I'll upload screenshots of our conversations next.",
    ].filter(Boolean).join(" ");
    
    // Slight delay to let state settle
    setTimeout(() => {
      sendMessage(contextParts);
    }, 300);
  };
  
  const handleSkipToChat = () => {
    setFirstTimeIntakeComplete(true);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("firstTime");
    setSearchParams(newParams, { replace: true });
  };

  
  // Show first-time intake form (only if no upload context was provided)
  if (isFirstTime && !firstTimeIntakeComplete) {
    const userName = localStorage.getItem("onboarding_name") || userProfile?.name || "";
    const userGoal = localStorage.getItem("onboarding_goal") || "evaluate";
    
    return (
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-area-top">
          <div className="container mx-auto px-2 py-2 max-w-lg">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-sm text-foreground leading-tight">D.E.V.I.</h1>
                <p className="text-xs text-muted-foreground">Let's get started</p>
              </div>
            </div>
          </div>
        </header>
        <FirstTimeIntake
          userName={userName}
          userGoal={userGoal}
          onSubmit={handleFirstTimeIntake}
          onSkipToChat={handleSkipToChat}
        />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-area-top">
        <div className="container mx-auto px-2 py-2 max-w-lg">
          <div className="flex items-center gap-1.5">
            {/* Navigate dropdown — replaces back/home buttons */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg shrink-0 h-8 w-8">
                  <Home className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2">
                  <LayoutGrid className="w-4 h-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/community")} className="gap-2">
                  <Users className="w-4 h-4" /> Community
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-sm text-foreground leading-tight">D.E.V.I.</h1>
                <p className="text-xs text-muted-foreground">Your dating advisor</p>
              </div>
            </div>
            

            {/* Add Candidate */}
            <Button variant="ghost" size="icon" onClick={() => navigate("/add-candidate?mode=smart")} className="rounded-lg shrink-0 h-8 w-8 text-primary" title="Add Candidate">
              <UserPlus className="w-4 h-4" />
            </Button>
            
            {/* More actions menu — houses layout toggle, chat history, tone, tour */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg shrink-0 h-8 w-8" title="More">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setHistoryOpen(true)} className="gap-2">
                  <Clock className="w-4 h-4" /> Chat History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const newLayout = chatLayout === "bubble" ? "chatgpt" : "bubble";
                    setChatLayout(newLayout);
                    localStorage.setItem('devi-chat-layout', newLayout);
                  }}
                  className="gap-2"
                >
                  {chatLayout === "bubble" ? <AlignLeft className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                  {chatLayout === "bubble" ? "Article View" : "Bubble View"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings?tab=preferences")} className="gap-2">
                  <Sparkles className="w-4 h-4" /> Adjust D.E.V.I.'s Tone
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Chat History Sheet (opened via More menu) */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
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

      {/* Candidate Selector Bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-2 max-w-lg">
          <div className="flex items-center gap-2">
            {profilesLoading ? (
              <div className="h-10 flex-1 bg-muted rounded-xl animate-pulse" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={selectedCandidate ? "outline" : "secondary"} 
                    size="sm" 
                    className={`h-10 gap-2 flex-1 justify-between ${!selectedCandidate ? "border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary" : ""}`}
                    data-tour="devi-candidate-select"
                  >
                    <div className="flex items-center gap-2">
                      {selectedCandidate ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-semibold">{selectedCandidate.nickname.charAt(0)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{selectedCandidate.nickname}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              selectedCandidate.compatibility_score != null
                                ? selectedCandidate.compatibility_score >= 70 
                                  ? "bg-green-500/15 text-green-600" 
                                  : selectedCandidate.compatibility_score >= 40 
                                    ? "bg-amber-500/15 text-amber-600" 
                                    : "bg-red-500/15 text-red-600"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {selectedCandidate.compatibility_score != null ? `${selectedCandidate.compatibility_score}%` : "New"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          <span className="font-medium">Select a candidate to discuss</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {/* Complete Onboarding option - shown when onboarding is incomplete */}
                  {onboardingIncomplete && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCandidate(null);
                          setMessages([]);
                          setCurrentConversationId(null);
                          lastLoadedCandidateRef.current = null;
                          sendMessage("Let's continue my onboarding — help me complete my profile setup.");
                        }}
                        className="gap-2 py-2.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">Complete Onboarding</span>
                          <p className="text-[11px] text-muted-foreground">Finish your profile setup</p>
                        </div>
                      </DropdownMenuItem>
                      <div className="h-px bg-border my-1" />
                    </>
                  )}

                  {/* General option - no candidate */}
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCandidate(null);
                      setMessages([]);
                      setCurrentConversationId(null);
                      lastLoadedCandidateRef.current = null;
                    }}
                    className="gap-2 py-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <span className="font-medium">General Chat</span>
                      <p className="text-[11px] text-muted-foreground">Dating advice, self-growth</p>
                    </div>
                    {!selectedCandidate && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                  
                  {candidates.length > 0 && (
                    <>
                      <div className="h-px bg-border my-1" />
                      <div className="px-2 py-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Your Candidates</span>
                      </div>
                    </>
                  )}
                  
                  {candidates.map((c) => {
                    const hasConversation = conversations.some(conv => conv.candidate_id === c.id);
                    return (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => handleCandidateSelect(c)}
                        className="gap-2 py-2.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold">{c.nickname.charAt(0)}</span>
                        </div>
                        <span className="flex-1 font-medium">{c.nickname}</span>
                        {c.compatibility_score != null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            c.compatibility_score >= 70 
                              ? "bg-green-500/15 text-green-600" 
                              : c.compatibility_score >= 40 
                                ? "bg-amber-500/15 text-amber-600" 
                                : "bg-red-500/15 text-red-600"
                          }`}>
                            {c.compatibility_score}%
                          </span>
                        )}
                        {hasConversation && !c.compatibility_score && (
                          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
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
            
            {/* View Profile + Update Score - only show for candidate mode */}
            {selectedCandidate && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 shrink-0"
                onClick={() => navigate(`/candidate/${selectedCandidate.id}`)}
              >
                <User className="w-3.5 h-3.5" />
                <span className="text-xs">Profile</span>
              </Button>
            )}
            {selectedCandidate && messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 shrink-0"
                onClick={handleUpdateScore}
                disabled={isUpdatingScore}
              >
                {isUpdatingScore ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span className="text-xs">Score</span>
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

              {pendingCandidateSelection && (
                <Button
                  variant="outline"
                  className="w-full gap-2 justify-start border-[#007AFF]/20 text-[#007AFF] hover:bg-[#007AFF]/10"
                  onClick={() => {
                    setShowConversationChoice(false);
                    setShowTextSimFromDialog(true);
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Text Simulator — Get closure
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Text Simulator opened from conversation choice dialog */}
      {pendingCandidateSelection && (
        <TextSimulator
          open={showTextSimFromDialog}
          onOpenChange={(open) => {
            setShowTextSimFromDialog(open);
            if (!open) setPendingCandidateSelection(null);
          }}
          candidateName={pendingCandidateSelection.nickname}
          candidateId={pendingCandidateSelection.id}
           candidateContext={buildSimulatorContext(pendingCandidateSelection)}
          userGender={userProfile?.gender_identity?.includes("man") ? "male" : "female"}
        />
      )}

      {/* Crisis Alert Dialog */}
      <CrisisAlertDialog
        open={showCrisisAlert}
        onClose={() => setShowCrisisAlert(false)}
        severity={crisisSeverity}
        category={crisisCategory}
      />

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
        <div className={`container mx-auto px-4 py-4 ${chatLayout === "chatgpt" ? "max-w-2xl" : "max-w-lg"} space-y-4`}>
          {messages.length === 0 ? (
            <div className="py-4">
              {/* Single welcome bubble - feels like a chat */}
              <div className={chatLayout === "chatgpt" ? "mb-6" : "flex items-start gap-2 mb-4"}>
                {chatLayout === "chatgpt" ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">D.E.V.I.</span>
                    </div>
                    <div className="pl-9">
                      <p className="text-base leading-relaxed">
                        {selectedCandidate 
                          ? `Hey! 👋 What's going on with ${selectedCandidate.nickname}?`
                          : getDeviGreeting(userProfile)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md p-3 max-w-[85%]">
                      <p className="text-sm">
                        {selectedCandidate 
                          ? `Hey! 👋 What's going on with ${selectedCandidate.nickname}?`
                          : getDeviGreeting(userProfile)}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Quick prompts - show for both general and candidate mode when can chat */}
              {((chatMode === "general" && canChatGeneral) || (chatMode === "candidate" && canChatWithCandidate)) && (
                <div className={chatLayout === "chatgpt" ? "pl-9 space-y-3" : "pl-10 space-y-2"}>
                  <p className={`text-muted-foreground ${chatLayout === "chatgpt" ? "text-sm" : "text-xs"} mb-2`}>Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {getExampleQuestions(userProfile, !!selectedCandidate).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(q)}
                        className={`rounded-full border border-border text-foreground hover:bg-muted transition-colors ${
                          chatLayout === "chatgpt" ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                    </div>
                    <button
                      onClick={() => navigate("/add-candidate?mode=smart")}
                      className={`rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 ${
                        chatLayout === "chatgpt" ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5"
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add a new candidate
                    </button>
                  
                  {/* Upload hint and Text Simulator - only for candidate mode */}
                  {selectedCandidate && (
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => handleImageUpload('text_screenshot')}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" />
                        or send a screenshot
                      </button>
                      <TextSimulatorCTA
                        candidateName={selectedCandidate.nickname}
                        candidateId={selectedCandidate.id}
                        candidateContext={buildSimulatorContext(selectedCandidate)}
                        userGender={userProfile?.gender_identity?.includes("man") ? "male" : "female"}
                      />
                    </div>
                  )}
                </div>
              )}



              {/* Healing Journey - show only after onboarding is complete and in general chat mode */}
              {hasFullProfile && !onboardingIncomplete && !selectedCandidate && (
                <div className="pl-10 mt-4">
                  <HealingJourney />
                </div>
              )}
            </div>
          ) : (
          <>
            {(() => {
              // Pre-compute detachment detection once for the whole message list
              const lastAssistantMsgIdx = [...messages].map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i >= 0).pop() ?? -1;
              const lastAssistantMsg = lastAssistantMsgIdx >= 0 ? messages[lastAssistantMsgIdx] : null;
              const lastUserMsg = [...messages].slice(0, lastAssistantMsgIdx >= 0 ? lastAssistantMsgIdx : messages.length).reverse().find(m => m.role === 'user') ?? null;
              const userContent = lastUserMsg?.content ?? '';
              const assistantContent = lastAssistantMsg?.content ?? '';
              const isActiveRequest = detectsDetachmentIntent(userContent) || detectsDetachmentIntent(assistantContent);
              const showDetachmentCTA = !isLoading && !detachmentCtaDismissed && selectedCandidate && messages.length >= 2 &&
                (isActiveRequest || detectsDetachmentNeed(userContent) || detectsDetachmentNeed(assistantContent));

              const detachmentCTANode = showDetachmentCTA ? (
                <div className="mt-5 mb-2 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Unlink className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {isActiveRequest ? "Ready to start your Detachment Plan?" : "D.E.V.I. senses you're having a hard time"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {isActiveRequest
                          ? `Your AI-powered 4-phase plan guides you through emotionally separating from ${selectedCandidate!.nickname} — Awareness, Distance, Reclaim, and Freedom.`
                          : `While working through these feelings, a personalized Detachment Plan can help you emotionally separate from ${selectedCandidate!.nickname} — phase by phase, at your own pace.`}
                      </p>
                    </div>
                    <button
                      onClick={() => setDetachmentCtaDismissed(true)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors shrink-0"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => navigate(`/detachment-plan/${selectedCandidate!.id}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium py-2.5 hover:bg-primary/90 transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                    {isActiveRequest ? "Start My Detachment Plan" : "View My Detachment Plan"}
                  </button>
                </div>
              ) : null;

              return (
                <>
                  {messages.map((msg, index) => {
                    const isLastMsg = index === messages.length - 1;
                    // Inject CTA right after the last assistant message that triggered detection
                    const injectCTA = showDetachmentCTA && index === lastAssistantMsgIdx;

                    return (
                      <React.Fragment key={msg.id}>
                        {chatLayout === "chatgpt" ? (
                          <ChatGPTMessage 
                            message={msg} 
                            isLast={isLastMsg}
                            onQuickReply={(reply) => {
                              if (reply === "My dating plan") {
                                setShowDatingAdvisorCard(true);
                              } else {
                                sendMessage(reply);
                              }
                            }}
                            onLogInteraction={() => {
                              if (selectedCandidate) {
                                const userMessages = messages.slice(0, index).filter(m => m.role === 'user');
                                const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
                                navigate(`/candidate/${selectedCandidate.id}`, { 
                                  state: { tab: "interactions", prefillNotes: lastUserMessage } 
                                });
                              }
                            }}
                            isLoading={isLoading}
                            hasCandidate={!!selectedCandidate}
                          />
                        ) : (
                          <MessageBubble 
                            message={msg} 
                            isLast={isLastMsg}
                            onQuickReply={(reply) => {
                              if (reply === "My dating plan") {
                                setShowDatingAdvisorCard(true);
                              } else {
                                sendMessage(reply);
                              }
                            }}
                            isLoading={isLoading}
                          />
                        )}
                        {injectCTA && detachmentCTANode}
                      </React.Fragment>
                    );
                  })}
                </>
              );
            })()}

            {showDatingAdvisorCard && userProfile && (
              <DatingAdvisorCard
                userProfile={userProfile}
                candidate={selectedCandidate}
                existingMessages={messages}
                onConfirm={(summary) => {
                  setShowDatingAdvisorCard(false);
                  sendMessage(summary);
                }}
                onDismiss={() => setShowDatingAdvisorCard(false)}
              />
            )}

            <DeviThinkingIndicator isVisible={isThinking} />
          </>
          )}
          
          {/* Soft warning at 30 messages */}
          {/* Free trial exchange counter */}
          {isFree && !freeTrialExhausted && freeExchangesUsed > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              <span className="flex-1 text-muted-foreground">
                <span className="text-foreground font-medium">{freeExchangesRemaining} of {FREE_EXCHANGE_LIMIT}</span> free exchanges remaining
              </span>
              <button
                onClick={() => navigate("/subscription")}
                className="text-primary font-medium hover:underline"
              >
                Upgrade
              </button>
            </div>
          )}

          {messages.length >= SOFT_LIMIT_MESSAGES && messages.length < MAX_CONVERSATION_MESSAGES && !isLoading && !softWarningDismissed && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <MessageSquare className="w-3 h-3 shrink-0" />
              <span className="flex-1">Long conversation — consider starting fresh soon for best results</span>
              <button 
                onClick={() => setSoftWarningDismissed(true)}
                className="p-0.5 hover:bg-muted rounded transition-colors"
                aria-label="Dismiss warning"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {/* Hard nudge at 40 messages */}
          {messages.length >= MAX_CONVERSATION_MESSAGES && !isLoading && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">This conversation is getting long</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    For better responses, consider starting a fresh chat. Your history is saved!
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs gap-1.5"
                    onClick={startNewChat}
                  >
                    <Plus className="w-3 h-3" />
                    Start new chat
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Progressive onboarding nudge */}
          {showProfileNudge && (
            <OnboardingProgressCTA 
              profile={userProfile}
              onDismiss={() => {
                setShowProfileNudge(false);
                setProfileNudgeDismissed(true);
              }}
              onOpenSection={(sectionId) => {
                setProfileEditorSection(sectionId);
              }}
              className="mt-4"
            />
          )}

          {/* Candidate intake nudge */}
          {selectedCandidate && !candidateIntakeDismissed && (
            <CandidateIntakeCTA
              candidate={selectedCandidate}
              onDismiss={() => setCandidateIntakeDismissed(true)}
              onOpenSection={(sectionId) => setCandidateEditorSection(sectionId)}
              className="mt-4"
            />
          )}
          
          {messages.length >= 2 && messages.length < MAX_CONVERSATION_MESSAGES && !isLoading && messages[messages.length - 1]?.role === 'assistant' && (
            <DeviWinPrompt onLogWin={() => setShowWinDialog(true)} className="mt-4" />
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
        <div className={`container mx-auto px-4 py-3 ${chatLayout === "chatgpt" ? "max-w-2xl" : "max-w-lg"}`}>
          {/* Pending Images Preview */}
          {pendingImages.length > 0 && (
            <div className="mb-2">
              <div className="flex gap-2 flex-wrap">
                {pendingImages.map((img, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img
                      src={img.data}
                      alt={`Screenshot ${idx + 1}`}
                      className="h-20 w-20 rounded-lg object-cover border border-border"
                    />
                    <button
                      onClick={() => setPendingImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {pendingImages.some(i => i.type === "text_screenshot") && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    In these screenshots, messages on the right are from:
                  </p>
                  <ToggleGroup
                    type="single"
                    value={textScreenshotRightSide}
                    onValueChange={(v) => v && setTextScreenshotRightSide(v as "me" | "them")}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    <ToggleGroupItem value="me">Me</ToggleGroupItem>
                    <ToggleGroupItem value="them">Them</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
            </div>
          )}
          
          {/* Show locked state if requirements not met */}
          {freeTrialExhausted ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">You've used your 5 free exchanges</p>
                <p className="text-xs text-muted-foreground mt-0.5">Upgrade to keep chatting with D.E.V.I.</p>
              </div>
              <Button size="sm" onClick={() => navigate("/subscription")} className="gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                See Plans
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-end" data-tour="devi-input">
              {/* Upload menu: screenshot or conversation analysis */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-11 w-11 rounded-xl border-primary/30 hover:bg-primary/10"
                    disabled={isLoading}
                    data-tour="devi-image-upload"
                  >
                    <ImagePlus className="w-6 h-6 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => handleImageUpload('text_screenshot')} className="gap-2">
                    <Camera className="w-4 h-4" />
                    Upload Screenshot
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleImageUpload('dating_profile')} className="gap-2">
                    <Heart className="w-4 h-4" />
                    Dating Profile Screenshot
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowConvoUpload(true)} className="gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <span className="font-medium">Analyze a Conversation</span>
                  </DropdownMenuItem>
                  {selectedCandidate && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setPendingCandidateSelection(selectedCandidate);
                          setShowTextSimFromDialog(true);
                        }}
                        className="gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Text Simulator
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(`/detachment-plan/${selectedCandidate.id}`)}
                        className="gap-2"
                      >
                        <Unlink className="w-4 h-4" />
                        Detachment Plan
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedCandidate ? `Ask about ${selectedCandidate.nickname}...` : "Ask me anything about dating..."}
                className="min-h-[52px] max-h-36 resize-none text-sm rounded-xl"
                rows={2}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={() => sendMessage()}
                disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
                className="shrink-0 h-11 w-11 rounded-xl bg-[image:var(--gradient-hero)]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          )}
          {/* AI Disclosure - at bottom for App Store compliance */}
          <AIDisclosure variant="compact" className="justify-center mt-2" />
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onFileChange}
        className="hidden"
      />

      {/* Win logging dialog */}
      <DeviWinDialog
        open={showWinDialog}
        onOpenChange={setShowWinDialog}
        userId={user.id}
        candidateId={selectedCandidate?.id}
        conversationId={currentConversationId || undefined}
      />

      {/* Conversation Upload Sheet */}
      <ConversationUploadSheet
        open={showConvoUpload}
        onOpenChange={setShowConvoUpload}
        candidateName={selectedCandidate?.nickname}
        onSubmit={handleConversationUpload}
      />

      {/* Inline Profile Editor */}
      {user && (
        <InlineProfileEditor
          open={!!profileEditorSection}
          sectionId={profileEditorSection}
          profile={userProfile}
          userId={user.id}
          onClose={() => setProfileEditorSection(null)}
          onSaved={(updatedProfile) => {
            setUserProfile(updatedProfile);
          }}
        />
      )}

      {/* Inline Candidate Editor */}
      {user && selectedCandidate && (
        <InlineCandidateEditor
          open={!!candidateEditorSection}
          sectionId={candidateEditorSection}
          candidate={selectedCandidate}
          userId={user.id}
          onClose={() => setCandidateEditorSection(null)}
          onSaved={(updatedCandidate) => {
            setSelectedCandidate(updatedCandidate);
            setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
          }}
        />
      )}
    </div>
  );
};

export default Devi;
