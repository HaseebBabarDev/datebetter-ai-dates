import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizLayoutProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  onBack: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

const QuizLayout: React.FC<QuizLayoutProps> = ({
  title,
  currentQuestion,
  totalQuestions,
  onBack,
  onClose,
  children,
}) => {
  const progress = ((currentQuestion) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="w-9 h-9"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-medium">{title}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-9 h-9"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Progress */}
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">
            {currentQuestion}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        {children}
      </div>
    </div>
  );
};

interface QuizOptionProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  description?: string;
}

export const QuizOption: React.FC<QuizOptionProps> = ({
  selected,
  onClick,
  children,
  description,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 transition-all",
            selected
              ? "border-primary bg-primary"
              : "border-muted-foreground"
          )}
        >
          {selected && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className={cn(
            "font-medium",
            selected && "text-primary"
          )}>
            {children}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
};

export default QuizLayout;
