import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

interface QuizCompletionScreenProps {
  onContinue: () => void;
  onTakeAnother: () => void;
}

const QuizCompletionScreen: React.FC<QuizCompletionScreenProps> = ({
  onContinue,
  onTakeAnother,
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Success Icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Message */}
      <h1 className="text-2xl font-bold text-center mb-3">
        Results Added to D.E.V.I.
      </h1>
      <p className="text-muted-foreground text-center max-w-xs mb-8">
        Your results have been added to personalize your guidance and make our conversations more meaningful.
      </p>

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
