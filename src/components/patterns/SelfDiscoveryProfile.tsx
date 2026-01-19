import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sparkles, Heart, MessageSquare, Brain, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuizResults {
  attachmentStyle: string | null;
  attachmentTendencies: Record<string, number> | null;
  primaryLoveLanguage: string | null;
  secondaryLoveLanguage: string | null;
  personalityType: string | null;
  personalityDimensions: Record<string, { [key: string]: number }> | null;
  hasAnyQuiz: boolean;
}

// MBTI personality type descriptions
const PERSONALITY_DESCRIPTIONS: Record<string, { title: string; traits: string[]; description: string }> = {
  INTJ: {
    title: "The Architect",
    traits: ["Strategic", "Independent", "Decisive", "Ambitious"],
    description: "Imaginative and strategic thinkers with a plan for everything. You value competence and logic in relationships.",
  },
  INTP: {
    title: "The Logician", 
    traits: ["Analytical", "Objective", "Reserved", "Flexible"],
    description: "Innovative inventors with an unquenchable thirst for knowledge. You approach relationships with curiosity and need intellectual connection.",
  },
  ENTJ: {
    title: "The Commander",
    traits: ["Bold", "Efficient", "Strong-willed", "Strategic"],
    description: "Bold, imaginative leaders who always find a way. You seek partners who match your ambition and growth mindset.",
  },
  ENTP: {
    title: "The Debater",
    traits: ["Quick-witted", "Innovative", "Honest", "Energetic"],
    description: "Smart and curious thinkers who love intellectual challenges. You thrive with partners who can keep up with your ideas.",
  },
  INFJ: {
    title: "The Advocate",
    traits: ["Insightful", "Principled", "Compassionate", "Decisive"],
    description: "Quiet and mystical, yet inspiring and idealistic. You seek deep, meaningful connections built on authenticity.",
  },
  INFP: {
    title: "The Mediator",
    traits: ["Idealistic", "Empathetic", "Creative", "Open-minded"],
    description: "Poetic, kind, and altruistic, always eager to help a good cause. You value emotional depth and authenticity in love.",
  },
  ENFJ: {
    title: "The Protagonist",
    traits: ["Charismatic", "Empathetic", "Organized", "Diplomatic"],
    description: "Charismatic leaders who inspire others. You pour your heart into relationships and prioritize your partner's growth.",
  },
  ENFP: {
    title: "The Campaigner",
    traits: ["Enthusiastic", "Creative", "Sociable", "Optimistic"],
    description: "Enthusiastic, creative free spirits who can always find a reason to smile. You bring warmth and excitement to relationships.",
  },
  ISTJ: {
    title: "The Logistician",
    traits: ["Practical", "Reliable", "Organized", "Dedicated"],
    description: "Practical and fact-minded individuals with reliability. You show love through actions and commitment.",
  },
  ISFJ: {
    title: "The Defender",
    traits: ["Supportive", "Reliable", "Patient", "Observant"],
    description: "Dedicated protectors, always ready to defend loved ones. You express love through care, loyalty, and thoughtful gestures.",
  },
  ESTJ: {
    title: "The Executive",
    traits: ["Organized", "Dedicated", "Strong-willed", "Direct"],
    description: "Excellent administrators, managing things and people well. You provide stability and clear direction in relationships.",
  },
  ESFJ: {
    title: "The Consul",
    traits: ["Caring", "Social", "Loyal", "Tradition-minded"],
    description: "Extraordinarily caring and social, always eager to help. You create warmth and stability for those you love.",
  },
  ISTP: {
    title: "The Virtuoso",
    traits: ["Bold", "Practical", "Original", "Relaxed"],
    description: "Bold and practical experimenters, masters of all tools. You prefer showing love through actions rather than words.",
  },
  ISFP: {
    title: "The Adventurer",
    traits: ["Charming", "Sensitive", "Imaginative", "Passionate"],
    description: "Flexible and charming artists, always ready to explore. You bring spontaneity and genuine warmth to relationships.",
  },
  ESTP: {
    title: "The Entrepreneur",
    traits: ["Smart", "Energetic", "Perceptive", "Bold"],
    description: "Smart, energetic, and perceptive people who live on the edge. You keep relationships exciting and dynamic.",
  },
  ESFP: {
    title: "The Entertainer",
    traits: ["Spontaneous", "Energetic", "Friendly", "Playful"],
    description: "Spontaneous and energetic entertainers who love life. You bring joy and excitement to your relationships.",
  },
};

// Attachment style descriptions  
const ATTACHMENT_DESCRIPTIONS: Record<string, { traits: string[]; description: string }> = {
  secure: {
    traits: ["Trusting", "Comfortable with closeness", "Emotionally available"],
    description: "You feel comfortable with intimacy and interdependence. You communicate needs openly and handle conflict constructively.",
  },
  anxious: {
    traits: ["Highly attuned to partner", "Craves closeness", "Fear of abandonment"],
    description: "You deeply value connection and may worry about your partner's feelings. You benefit from reassurance and clear communication.",
  },
  avoidant: {
    traits: ["Values independence", "Self-reliant", "Needs space"],
    description: "You value autonomy and may need more personal space. Opening up gradually and setting healthy boundaries helps you thrive.",
  },
  "anxious-avoidant": {
    traits: ["Push-pull dynamic", "Conflicted about closeness", "Healing in progress"],
    description: "You may experience conflicting desires for connection and independence. Therapy and self-awareness support healing.",
  },
  fearful_avoidant: {
    traits: ["Push-pull dynamic", "Conflicted about closeness", "Healing in progress"],
    description: "You may experience conflicting desires for connection and independence. Therapy and self-awareness support healing.",
  },
  disorganized: {
    traits: ["Push-pull dynamic", "Conflicted about closeness", "Healing in progress"],
    description: "You may experience conflicting desires for connection and independence. Therapy and self-awareness support healing.",
  },
};

// Love language descriptions
const LOVE_LANGUAGE_DESCRIPTIONS: Record<string, { description: string }> = {
  words_of_affirmation: {
    description: "You feel most loved through verbal expressions of love, compliments, and words of appreciation.",
  },
  quality_time: {
    description: "You feel most loved when your partner gives you undivided attention and spends meaningful time together.",
  },
  physical_touch: {
    description: "You feel most loved through physical affection—hugs, kisses, holding hands, and being close.",
  },
  acts_of_service: {
    description: "You feel most loved when your partner does helpful things for you, easing your responsibilities.",
  },
  receiving_gifts: {
    description: "You feel most loved through thoughtful gifts and symbolic gestures that show you were on their mind.",
  },
};

interface SelfDiscoveryProfileProps {
  quizResults: QuizResults;
}

export function SelfDiscoveryProfile({ quizResults }: SelfDiscoveryProfileProps) {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const normalizedAttachment = quizResults.attachmentStyle?.toLowerCase().replace(/-/g, '_').replace(/ /g, '_');
  const attachmentInfo = normalizedAttachment ? ATTACHMENT_DESCRIPTIONS[normalizedAttachment] : null;
  const personalityInfo = quizResults.personalityType ? PERSONALITY_DESCRIPTIONS[quizResults.personalityType.toUpperCase()] : null;
  const primaryLangKey = quizResults.primaryLoveLanguage?.toLowerCase().replace(/ /g, '_');
  const loveLanguageInfo = primaryLangKey ? LOVE_LANGUAGE_DESCRIPTIONS[primaryLangKey] : null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Self-Discovery Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Attachment Style */}
        {quizResults.attachmentStyle && (
          <Collapsible open={openSections.attachment} onOpenChange={() => toggleSection('attachment')}>
            <CollapsibleTrigger asChild>
              <button className="w-full p-3 rounded-lg bg-background border border-border/50 text-left hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Attachment Style</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold capitalize text-primary">
                      {quizResults.attachmentStyle.replace(/-/g, ' ').replace(/_/g, ' ')}
                    </span>
                    {openSections.attachment ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3 pt-2 space-y-2">
                {attachmentInfo && (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {attachmentInfo.traits.map(trait => (
                        <Badge key={trait} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{attachmentInfo.description}</p>
                  </>
                )}
                {quizResults.attachmentTendencies && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(quizResults.attachmentTendencies)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([style, percentage]) => (
                        <Badge key={style} variant="outline" className="text-xs capitalize">
                          {style}: {percentage}%
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Love Language */}
        {quizResults.primaryLoveLanguage && (
          <Collapsible open={openSections.loveLanguage} onOpenChange={() => toggleSection('loveLanguage')}>
            <CollapsibleTrigger asChild>
              <button className="w-full p-3 rounded-lg bg-background border border-border/50 text-left hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Love Language</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold capitalize text-primary">
                      {quizResults.primaryLoveLanguage.replace(/_/g, ' ')}
                    </span>
                    {openSections.loveLanguage ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3 pt-2 space-y-2">
                {loveLanguageInfo && (
                  <p className="text-xs text-muted-foreground">{loveLanguageInfo.description}</p>
                )}
                {quizResults.secondaryLoveLanguage && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Secondary:</span> {quizResults.secondaryLoveLanguage.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Personality Type */}
        {quizResults.personalityType && (
          <Collapsible open={openSections.personality} onOpenChange={() => toggleSection('personality')}>
            <CollapsibleTrigger asChild>
              <button className="w-full p-3 rounded-lg bg-background border border-border/50 text-left hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Personality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {quizResults.personalityType.toUpperCase()}
                      {personalityInfo && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {personalityInfo.title}
                        </span>
                      )}
                    </span>
                    {openSections.personality ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3 pt-2 space-y-2">
                {personalityInfo && (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {personalityInfo.traits.map(trait => (
                        <Badge key={trait} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{personalityInfo.description}</p>
                  </>
                )}
                {quizResults.personalityDimensions && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {Object.entries(quizResults.personalityDimensions).map(([dim, values]) => {
                      const entries = Object.entries(values);
                      const dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b);
                      return (
                        <div key={dim} className="text-center p-1.5 bg-muted/50 rounded">
                          <div className="text-sm font-bold text-foreground">{dominant[0]}</div>
                          <div className="text-[10px] text-muted-foreground">{dominant[1]}%</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* CTA to take more quizzes */}
        {(!quizResults.attachmentStyle || !quizResults.primaryLoveLanguage || !quizResults.personalityType) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => navigate("/self-discovery")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Complete More Quizzes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
