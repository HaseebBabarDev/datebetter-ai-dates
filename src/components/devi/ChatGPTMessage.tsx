import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoicePlayButton } from "./VoicePlayButton";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageData?: string;
  imageType?: string;
  imagesData?: string[];
  candidateId?: string;
}

const QUICK_REPLIES = [
  "Tell me more",
  "What should I do?",
  "Explain the science",
  "Be my dating advisor",
  "Help me rewire my thoughts",
];

// Parse and render markdown-like content in ChatGPT style
const renderChatGPTContent = (content: string): React.ReactNode => {
  const sections = content.split(/\n\n+/);
  
  return sections.map((section, sectionIdx) => {
    const lines = section.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let numberedItems: { num: string; text: string }[] = [];
    
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${sectionIdx}-${elements.length}`} className="space-y-2 my-4">
            {listItems.map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-muted-foreground mt-1.5 flex-shrink-0 text-sm">•</span>
                <span className="text-base leading-relaxed">{formatInlineText(item)}</span>
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
          <ol key={`ol-${sectionIdx}-${elements.length}`} className="space-y-3 my-4">
            {numberedItems.map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-muted-foreground font-medium flex-shrink-0 min-w-[1.5rem] text-base">{item.num}</span>
                <span className="text-base leading-relaxed">{formatInlineText(item.text)}</span>
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
        // Check if it looks like a header/title - require more context to avoid streaming artifacts
        // Only treat as header if it ends with colon OR starts with # AND has reasonable length
        const isHeader = (trimmed.endsWith(':') && trimmed.length > 3 && trimmed.length < 60) || 
                         (trimmed.startsWith('#') && trimmed.length > 2);
        
        // Check for blockquote style (only explicit > prefix)
        const isBlockquote = trimmed.startsWith('>');
        const blockquoteText = isBlockquote ? trimmed.slice(1).trim() : trimmed;
        
        // Check if this is a short, impactful statement (like ChatGPT's emphasis blocks)
        // Require COMPLETE bold markers to avoid streaming issues where ** appears before closing **
        const hasCompleteBold = /^\*\*.+\*\*$/.test(trimmed);
        const isEmphasisBlock = !isBlockquote && 
                                hasCompleteBold &&
                                trimmed.length < 80 && 
                                lines.length > 1;
        
        if (isBlockquote || isEmphasisBlock) {
          elements.push(
            <blockquote 
              key={`bq-${sectionIdx}-${lineIdx}`} 
              className="border-l-4 border-foreground/20 pl-4 my-4 text-base font-medium leading-relaxed"
            >
              {formatInlineText(isBlockquote ? blockquoteText : trimmed)}
            </blockquote>
          );
        } else if (isHeader) {
          const headerText = trimmed.replace(/^#+\s*/, '').replace(/:$/, '');
          elements.push(
            <h3 
              key={`h-${sectionIdx}-${lineIdx}`} 
              className="text-lg font-semibold text-foreground mt-6 mb-3 first:mt-0"
            >
              {headerText}
            </h3>
          );
        } else {
          elements.push(
            <p 
              key={`p-${sectionIdx}-${lineIdx}`} 
              className="text-base leading-relaxed my-2"
            >
              {formatInlineText(trimmed)}
            </p>
          );
        }
      }
    });
    
    // Flush any remaining lists
    flushList();
    flushNumberedList();
    
    // Add horizontal rule between major sections (if there's significant content)
    const hasSubstantialContent = elements.length > 2;
    
    return (
      <div key={sectionIdx}>
        {sectionIdx > 0 && hasSubstantialContent && (
          <hr className="border-border my-6" />
        )}
        {elements}
      </div>
    );
  });
};

// Format inline text (bold, italic, etc.)
const formatInlineText = (text: string): React.ReactNode => {
  // Replace **text** with bold and *text* or _text_ with italic
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  // Simple regex-based parsing for bold and italic
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__(.+?)__)|(_(.+?)_)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the formatted text
    if (match[2]) {
      // Bold **text**
      parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
    } else if (match[4]) {
      // Italic *text*
      parts.push(<em key={key++} className="italic">{match[4]}</em>);
    } else if (match[6]) {
      // Bold __text__
      parts.push(<strong key={key++} className="font-semibold">{match[6]}</strong>);
    } else if (match[8]) {
      // Italic _text_
      parts.push(<em key={key++} className="italic">{match[8]}</em>);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

interface ChatGPTMessageProps {
  message: Message;
  isLast?: boolean;
  onQuickReply?: (reply: string) => void;
  onLogInteraction?: () => void;
  isLoading?: boolean;
  hasCandidate?: boolean;
}

// Threshold for showing "Read more" - approximately 2 short paragraphs
const COLLAPSE_THRESHOLD = 300;

export const ChatGPTMessage: React.FC<ChatGPTMessageProps> = ({ 
  message, 
  isLast, 
  onQuickReply, 
  onLogInteraction,
  isLoading,
  hasCandidate,
}) => {
  const isLongMessage = message.role === 'assistant' && message.content.length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(!isLongMessage);
  const showQuickReplies = message.role === 'assistant' && isLast && !isLoading && onQuickReply;
  const showLogButton = message.role === 'assistant' && isLast && !isLoading && onLogInteraction && hasCandidate;

  if (message.role === 'user') {
    // User messages - simple right-aligned bubbles
    const images = message.imagesData && message.imagesData.length > 0
      ? message.imagesData
      : message.imageData ? [message.imageData] : [];

    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] rounded-2xl p-4 bg-muted rounded-br-md">
          {images.length > 0 && (
            <div className={`flex gap-2 mb-3 ${images.length > 1 ? 'flex-wrap' : ''}`}>
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Screenshot ${idx + 1}`}
                  className="rounded-lg object-cover max-h-48 max-w-full"
                  style={images.length > 1 ? { maxWidth: '48%' } : {}}
                />
              ))}
            </div>
          )}
          <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant messages - ChatGPT style (full width, clean typography)
  return (
    <div className="mb-8">
      {/* D.E.V.I. Avatar & Label with speaker button */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">D.E.V.I.</span>
        {/* Voice playback button next to label */}
        {!isLoading && message.content && (
          <VoicePlayButton text={message.content} variant="icon" size="sm" />
        )}
      </div>
      
      {/* Message content - full width, clean typography */}
      <div className="pl-9 pr-4">
        {message.imageData && (
          <img 
            src={message.imageData} 
            alt="Uploaded" 
            className="max-w-full rounded-lg mb-4 max-h-64 object-cover"
          />
        )}
        <div className={cn(
          "text-foreground",
          isLongMessage && !expanded && "relative"
        )}>
          {isLongMessage && !expanded ? (
            <>
              {/* Show truncated content with fade */}
              <div className="line-clamp-6">
                {renderChatGPTContent(message.content)}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
            </>
          ) : (
            renderChatGPTContent(message.content)
          )}
        </div>
        
        {/* Read more / Show less button */}
        {isLongMessage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-muted-foreground hover:text-foreground gap-1 px-0"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Keep reading
              </>
            )}
          </Button>
        )}
        
        {/* Voice playback blob - centered under message */}
        {!isLoading && message.content && (
          <VoicePlayButton text={message.content} variant="blob" />
        )}
      </div>
      
      {/* Log interaction button */}
      {showLogButton && (
        <div className="pl-9 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onLogInteraction}
            className="gap-2 rounded-full border-primary/30 text-primary hover:bg-primary/10"
          >
            <ClipboardList className="w-4 h-4" />
            Log this as an interaction
          </Button>
        </div>
      )}
      
      {/* Quick replies */}
      {showQuickReplies && (
        <div className="pl-9 mt-4 flex flex-wrap gap-2">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => onQuickReply(reply)}
              className="px-4 py-2 text-sm font-medium rounded-full border border-border text-foreground hover:bg-muted transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatGPTMessage;
