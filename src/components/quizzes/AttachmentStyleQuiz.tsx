import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import QuizLayout, { QuizOption } from "./QuizLayout";
import { toast } from "sonner";

interface AttachmentStyleQuizProps {
  onComplete: () => void;
  onBack: () => void;
}

interface Question {
  id: string;
  text: string;
  options: {
    text: string;
    style: "secure" | "anxious" | "avoidant" | "fearful";
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "When someone I'm dating doesn't text back for a while, I usually...",
    options: [
      { text: "Give them space and assume they're busy", style: "secure" },
      { text: "Start worrying if I did something wrong", style: "anxious" },
      { text: "Feel relieved I have some alone time", style: "avoidant" },
      { text: "Feel both worried and want to pull away", style: "fearful" },
    ],
  },
  {
    id: "q2",
    text: "In relationships, I find it easiest to...",
    options: [
      { text: "Be open about my needs and feelings", style: "secure" },
      { text: "Focus on my partner's needs over my own", style: "anxious" },
      { text: "Keep things light and not too deep", style: "avoidant" },
      { text: "Go back and forth between closeness and distance", style: "fearful" },
    ],
  },
  {
    id: "q3",
    text: "When conflict arises in a relationship, I tend to...",
    options: [
      { text: "Address it directly but calmly", style: "secure" },
      { text: "Worry it means the relationship is ending", style: "anxious" },
      { text: "Shut down or need space to process", style: "avoidant" },
      { text: "Feel overwhelmed and unsure how to respond", style: "fearful" },
    ],
  },
  {
    id: "q4",
    text: "When things are going well with someone new, I typically...",
    options: [
      { text: "Feel excited and let things develop naturally", style: "secure" },
      { text: "Worry something will go wrong", style: "anxious" },
      { text: "Start to feel a bit suffocated", style: "avoidant" },
      { text: "Feel both drawn in and scared at the same time", style: "fearful" },
    ],
  },
  {
    id: "q5",
    text: "My past relationships have often ended because...",
    options: [
      { text: "We grew apart or wanted different things", style: "secure" },
      { text: "I needed more reassurance than they could give", style: "anxious" },
      { text: "I felt like I needed more independence", style: "avoidant" },
      { text: "I pushed them away when things got serious", style: "fearful" },
    ],
  },
  {
    id: "q6",
    text: "When I think about long-term commitment, I feel...",
    options: [
      { text: "Hopeful and looking forward to it", style: "secure" },
      { text: "Eager but worried I'll be left", style: "anxious" },
      { text: "A bit trapped or uncertain", style: "avoidant" },
      { text: "Both wanting it and terrified of it", style: "fearful" },
    ],
  },
  {
    id: "q7",
    text: "I feel most loved when my partner...",
    options: [
      { text: "Shows up consistently and reliably", style: "secure" },
      { text: "Constantly reassures me of their love", style: "anxious" },
      { text: "Respects my need for personal space", style: "avoidant" },
      { text: "Proves they won't abandon me", style: "fearful" },
    ],
  },
  {
    id: "q8",
    text: "When starting to date someone new, I usually...",
    options: [
      { text: "Take time to get to know them authentically", style: "secure" },
      { text: "Fall hard and fast", style: "anxious" },
      { text: "Keep my options open and stay guarded", style: "avoidant" },
      { text: "Feel excited then suddenly scared", style: "fearful" },
    ],
  },
];

const STYLE_LABELS: Record<string, string> = {
  secure: "Secure",
  anxious: "Anxious",
  avoidant: "Avoidant",
  fearful: "Fearful-Avoidant",
};

const AttachmentStyleQuiz: React.FC<AttachmentStyleQuizProps> = ({ onComplete, onBack }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];

  const handleSelect = (style: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: style }));
  };

  const handleNext = async () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Calculate results
      await saveResults();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const calculateResult = () => {
    const scores: Record<string, number> = {
      secure: 0,
      anxious: 0,
      avoidant: 0,
      fearful: 0,
    };

    Object.values(answers).forEach(style => {
      scores[style]++;
    });

    // Find primary style
    const sortedStyles = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = sortedStyles[0][0];

    // Calculate tendencies for secondary signals
    const tendencies: Record<string, number> = {};
    Object.entries(scores).forEach(([style, score]) => {
      tendencies[style] = Math.round((score / QUESTIONS.length) * 100);
    });

    return { primary, tendencies };
  };

  const saveResults = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { primary, tendencies } = calculateResult();

      await supabase
        .from("profiles")
        .update({
          attachment_style: primary as any,
          attachment_tendencies: tendencies,
          quiz_attachment_completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      onComplete();
    } catch (error) {
      console.error("Error saving quiz results:", error);
      toast.error("Failed to save results. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedAnswer = answers[currentQuestion.id];

  return (
    <QuizLayout
      title="Attachment Style"
      currentQuestion={currentIndex + 1}
      totalQuestions={QUESTIONS.length}
      onBack={handleBack}
      onClose={onBack}
    >
      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold leading-tight">
          {currentQuestion.text}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option, index) => (
          <QuizOption
            key={index}
            selected={selectedAnswer === option.style}
            onClick={() => handleSelect(option.style)}
          >
            {option.text}
          </QuizOption>
        ))}
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <Button
          onClick={handleNext}
          disabled={!selectedAnswer || saving}
          className="w-full"
          size="lg"
        >
          {currentIndex === QUESTIONS.length - 1 
            ? (saving ? "Saving..." : "Complete Quiz") 
            : "Continue"
          }
        </Button>
      </div>
    </QuizLayout>
  );
};

export default AttachmentStyleQuiz;
