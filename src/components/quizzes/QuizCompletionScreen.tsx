import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, ArrowRight, Heart, MessageCircle, Brain } from "lucide-react";

interface QuizCompletionScreenProps {
  onContinue: () => void;
  onTakeAnother: () => void;
  quizType?: "attachment" | "love_language" | "personality";
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
  INTJ: { 
    label: "INTJ - The Architect", 
    description: "Strategic and independent, you approach relationships with logic and long-term thinking. You value intellectual connection and seek partners who share your vision and depth." 
  },
  INTP: { 
    label: "INTP - The Logician", 
    description: "Curious and analytical, you thrive on intellectual exploration. In relationships, you value mental stimulation and partners who appreciate your unique way of seeing the world." 
  },
  ENTJ: { 
    label: "ENTJ - The Commander", 
    description: "Confident and decisive, you bring direction and ambition to relationships. You value partners who can match your drive and engage in meaningful discussions." 
  },
  ENTP: { 
    label: "ENTP - The Debater", 
    description: "Innovative and energetic, you love exploring ideas and challenging conventions. You're drawn to partners who can keep up with your wit and embrace spontaneity." 
  },
  INFJ: { 
    label: "INFJ - The Advocate", 
    description: "Insightful and idealistic, you seek deep, meaningful connections. You value authenticity and are drawn to partners who share your values and emotional depth." 
  },
  INFP: { 
    label: "INFP - The Mediator", 
    description: "Creative and empathetic, you approach relationships with idealism and deep feeling. You seek partners who understand your inner world and share your values." 
  },
  ENFJ: { 
    label: "ENFJ - The Protagonist", 
    description: "Charismatic and nurturing, you invest deeply in your relationships. You're attuned to others' needs and seek partners who appreciate your warmth and vision." 
  },
  ENFP: { 
    label: "ENFP - The Campaigner", 
    description: "Enthusiastic and imaginative, you bring creativity and passion to relationships. You value authentic connection and partners who embrace your free-spirited nature." 
  },
  ISTJ: { 
    label: "ISTJ - The Logistician", 
    description: "Reliable and dedicated, you approach relationships with commitment and loyalty. You value tradition, stability, and partners who share your sense of responsibility." 
  },
  ISFJ: { 
    label: "ISFJ - The Defender", 
    description: "Warm and conscientious, you show love through acts of care and devotion. You value security and seek partners who appreciate your nurturing nature." 
  },
  ESTJ: { 
    label: "ESTJ - The Executive", 
    description: "Organized and direct, you bring structure and reliability to relationships. You value clear communication and partners who share your practical approach to life." 
  },
  ESFJ: { 
    label: "ESFJ - The Consul", 
    description: "Caring and sociable, you thrive on creating harmony in relationships. You're attentive to others' needs and value partners who appreciate your warmth and dedication." 
  },
  ISTP: { 
    label: "ISTP - The Virtuoso", 
    description: "Practical and observant, you prefer showing love through actions rather than words. You value independence and partners who respect your need for space." 
  },
  ISFP: { 
    label: "ISFP - The Adventurer", 
    description: "Gentle and sensitive, you express yourself through creativity and presence. You value authenticity and seek partners who appreciate your quiet depth." 
  },
  ESTP: { 
    label: "ESTP - The Entrepreneur", 
    description: "Bold and energetic, you bring excitement and spontaneity to relationships. You live in the moment and value partners who can keep up with your adventurous spirit." 
  },
  ESFP: { 
    label: "ESFP - The Entertainer", 
    description: "Spontaneous and fun-loving, you bring joy and energy to relationships. You value experiences and partners who embrace life's pleasures with enthusiasm." 
  },
};

const QUIZ_TITLES: Record<string, { title: string; icon: React.ElementType }> = {
  attachment: { title: "Attachment Style", icon: Heart },
  love_language: { title: "Love Language", icon: MessageCircle },
  personality: { title: "Personality Type", icon: Brain },
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
