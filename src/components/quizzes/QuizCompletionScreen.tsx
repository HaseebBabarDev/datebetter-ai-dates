import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, ArrowRight, Heart, MessageCircle, Brain } from "lucide-react";

interface QuizCompletionScreenProps {
  onContinue: () => void;
  onTakeAnother: () => void;
  quizType?: "attachment" | "love_language" | "personality";
  result?: string;
}

const RESULT_LABELS: Record<string, { label: string; description: string }> = {
  // Attachment styles
  secure: { 
    label: "Secure", 
    description: "You feel comfortable with intimacy and independence" 
  },
  anxious: { 
    label: "Anxious", 
    description: "You tend to seek closeness and worry about relationships" 
  },
  avoidant: { 
    label: "Avoidant", 
    description: "You value independence and can find intimacy challenging" 
  },
  "fearful-avoidant": { 
    label: "Fearful-Avoidant", 
    description: "You experience mixed feelings about closeness and distance" 
  },
  // Love languages
  words_of_affirmation: { 
    label: "Words of Affirmation", 
    description: "You feel loved through verbal expressions and compliments" 
  },
  quality_time: { 
    label: "Quality Time", 
    description: "You feel loved through undivided attention and togetherness" 
  },
  acts_of_service: { 
    label: "Acts of Service", 
    description: "You feel loved when others help and support you" 
  },
  physical_touch: { 
    label: "Physical Touch", 
    description: "You feel loved through physical connection and affection" 
  },
  receiving_gifts: { 
    label: "Receiving Gifts", 
    description: "You feel loved through thoughtful gifts and gestures" 
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
  const resultInfo = result ? RESULT_LABELS[result.toLowerCase()] : null;
  const Icon = quizInfo?.icon || CheckCircle2;

  // For personality type (MBTI), just show the type code
  const isPersonality = quizType === "personality";
  const displayResult = isPersonality ? result?.toUpperCase() : resultInfo?.label || result;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
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
      {displayResult && (
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {displayResult}
          </h1>
          {resultInfo?.description && !isPersonality && (
            <p className="text-muted-foreground text-sm max-w-xs">
              {resultInfo.description}
            </p>
          )}
          {isPersonality && result && (
            <p className="text-muted-foreground text-sm max-w-xs">
              Your personality preference has been recorded
            </p>
          )}
        </div>
      )}

      {/* Message */}
      <div className="bg-muted/50 rounded-xl p-4 mb-8 max-w-xs">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Your results have been added to personalize your guidance and make our conversations more meaningful.
          </p>
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
