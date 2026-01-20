import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, ArrowRight, Heart, MessageCircle, Brain, Target } from "lucide-react";

interface QuizCompletionScreenProps {
  onContinue: () => void;
  onTakeAnother: () => void;
  quizType?: "attachment" | "love_language" | "personality" | "dating_style";
  result?: string;
}

const ATTACHMENT_RESULTS: Record<string, { label: string; description: string }> = {
  secure: { 
    label: "Secure", 
    description: "You're comfortable with intimacy and independence. You communicate needs openly, trust your partners, and handle conflict constructively. You don't fear abandonment or avoid closeness." 
  },
  anxious: { 
    label: "Anxious", 
    description: "You crave closeness and often worry about your relationships. You may seek frequent reassurance, be highly attuned to your partner's moods, and fear rejection or abandonment." 
  },
  avoidant: { 
    label: "Avoidant", 
    description: "You value independence and self-sufficiency. You may find deep intimacy uncomfortable, prefer emotional distance, and tend to withdraw when relationships become too close." 
  },
  fearful: { 
    label: "Fearful-Avoidant", 
    description: "You experience conflicting desires for closeness and distance. You may want intimacy but fear getting hurt, leading to push-pull dynamics in relationships." 
  },
  "fearful-avoidant": { 
    label: "Fearful-Avoidant", 
    description: "You experience conflicting desires for closeness and distance. You may want intimacy but fear getting hurt, leading to push-pull dynamics in relationships." 
  },
};

const LOVE_LANGUAGE_RESULTS: Record<string, { label: string; description: string }> = {
  words_of_affirmation: { 
    label: "Words of Affirmation", 
    description: "You feel most loved through verbal expressions—compliments, encouragement, and hearing 'I love you.' Words of appreciation and acknowledgment deeply resonate with you." 
  },
  quality_time: { 
    label: "Quality Time", 
    description: "You feel most loved when someone gives you their undivided attention. Meaningful conversations, shared activities, and being fully present together matter most to you." 
  },
  acts_of_service: { 
    label: "Acts of Service", 
    description: "You feel most loved when someone helps you with tasks or responsibilities. Actions speak louder than words—when someone eases your burden, you feel truly cared for." 
  },
  physical_touch: { 
    label: "Physical Touch", 
    description: "You feel most loved through physical connection—hugs, hand-holding, cuddling, and affectionate touch. Physical presence and contact make you feel secure and valued." 
  },
  receiving_gifts: { 
    label: "Receiving Gifts", 
    description: "You feel most loved through thoughtful gifts and gestures. It's not about materialism—it's about the thought, effort, and symbolism behind the gift that makes you feel cherished." 
  },
};

const PERSONALITY_RESULTS: Record<string, { label: string; description: string }> = {
  INTJ: { label: "INTJ - The Architect", description: "Strategic and independent, you approach relationships with logic and long-term thinking." },
  INTP: { label: "INTP - The Logician", description: "Curious and analytical, you thrive on intellectual exploration in relationships." },
  ENTJ: { label: "ENTJ - The Commander", description: "Confident and decisive, you bring direction and ambition to relationships." },
  ENTP: { label: "ENTP - The Debater", description: "Innovative and energetic, you love exploring ideas and challenging conventions." },
  INFJ: { label: "INFJ - The Advocate", description: "Insightful and idealistic, you seek deep, meaningful connections." },
  INFP: { label: "INFP - The Mediator", description: "Creative and empathetic, you approach relationships with idealism and deep feeling." },
  ENFJ: { label: "ENFJ - The Protagonist", description: "Charismatic and nurturing, you invest deeply in your relationships." },
  ENFP: { label: "ENFP - The Campaigner", description: "Enthusiastic and imaginative, you bring creativity and passion to relationships." },
  ISTJ: { label: "ISTJ - The Logistician", description: "Reliable and dedicated, you approach relationships with commitment and loyalty." },
  ISFJ: { label: "ISFJ - The Defender", description: "Warm and conscientious, you show love through acts of care and devotion." },
  ESTJ: { label: "ESTJ - The Executive", description: "Organized and direct, you bring structure and reliability to relationships." },
  ESFJ: { label: "ESFJ - The Consul", description: "Caring and sociable, you thrive on creating harmony in relationships." },
  ISTP: { label: "ISTP - The Virtuoso", description: "Practical and observant, you prefer showing love through actions rather than words." },
  ISFP: { label: "ISFP - The Adventurer", description: "Gentle and sensitive, you express yourself through creativity and presence." },
  ESTP: { label: "ESTP - The Entrepreneur", description: "Bold and energetic, you bring excitement and spontaneity to relationships." },
  ESFP: { label: "ESFP - The Entertainer", description: "Spontaneous and fun-loving, you bring joy and energy to relationships." },
};

const DATING_STYLE_RESULTS: Record<string, { label: string; description: string }> = {
  secure_honest: {
    label: "The Grounded Dater",
    description: "You're confident, honest, and secure. You date from a healthy place and can handle the ups and downs. D.E.V.I. will help you find the right match for your level.",
  },
  developing: {
    label: "Work in Progress",
    description: "You have good instincts but some areas to grow. D.E.V.I. will help you identify patterns and build better dating habits.",
  },
  needs_growth: {
    label: "Building Foundations",
    description: "You're self-aware enough to want to improve. D.E.V.I. will focus on helping you develop confidence and healthier dating patterns.",
  },
  red_flags: {
    label: "Time for Self-Reflection",
    description: "Some patterns might be holding you back. D.E.V.I. will gently challenge you to grow—because you deserve better relationships too.",
  },
};

const QUIZ_TITLES: Record<string, { title: string; icon: React.ElementType }> = {
  attachment: { title: "Attachment Style", icon: Heart },
  love_language: { title: "Love Language", icon: MessageCircle },
  personality: { title: "Personality Type", icon: Brain },
  dating_style: { title: "Dating Style", icon: Target },
};

const QuizCompletionScreen: React.FC<QuizCompletionScreenProps> = ({
  onContinue,
  onTakeAnother,
  quizType,
  result,
}) => {
  const quizInfo = quizType ? QUIZ_TITLES[quizType] : null;
  const Icon = quizInfo?.icon || CheckCircle2;

  // Get the appropriate result info based on quiz type
  const getResultInfo = () => {
    if (!result) return null;
    
    const normalizedResult = result.toLowerCase();
    
    if (quizType === "attachment") {
      return ATTACHMENT_RESULTS[normalizedResult];
    }
    if (quizType === "love_language") {
      return LOVE_LANGUAGE_RESULTS[normalizedResult];
    }
    if (quizType === "personality") {
      return PERSONALITY_RESULTS[result.toUpperCase()];
    }
    if (quizType === "dating_style") {
      return DATING_STYLE_RESULTS[normalizedResult];
    }
    return null;
  };

  const resultInfo = getResultInfo();
  const displayLabel = resultInfo?.label || result;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Success Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Quiz Type */}
      {quizInfo && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <Icon className="w-4 h-4" />
          <span>{quizInfo.title}</span>
        </div>
      )}

      {/* Result Display */}
      {displayLabel && (
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary mb-3">
            {displayLabel}
          </h1>
          {resultInfo?.description && (
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              {resultInfo.description}
            </p>
          )}
        </div>
      )}

      {/* DEVI Integration Message */}
      <div className="bg-muted/50 rounded-xl p-4 mb-8 max-w-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Added to D.E.V.I.</p>
            <p>
              Your results will personalize your guidance, adjust communication style, 
              and make our conversations more meaningful.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="w-full max-w-xs space-y-3">
        <Button 
          onClick={onContinue} 
          className="w-full group"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Continue with D.E.V.I.
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
        
        <Button 
          onClick={onTakeAnother}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Take Another Quiz
        </Button>
      </div>
    </div>
  );
};

export default QuizCompletionScreen;
