import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import QuizLayout, { QuizOption } from "./QuizLayout";
import { toast } from "sonner";

interface LoveLanguageQuizProps {
  onComplete: (result: string) => void;
  onBack: () => void;
}

type LoveLanguage = "words" | "time" | "acts" | "touch" | "gifts";

interface Question {
  id: string;
  text: string;
  options: {
    text: string;
    language: LoveLanguage;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "I feel most appreciated when my partner...",
    options: [
      { text: "Tells me how much they love and appreciate me", language: "words" },
      { text: "Gives me their undivided attention", language: "time" },
      { text: "Does something helpful for me", language: "acts" },
      { text: "Gives me a warm hug or holds my hand", language: "touch" },
      { text: "Surprises me with a thoughtful gift", language: "gifts" },
    ],
  },
  {
    id: "q2",
    text: "When I want to show someone I care, I usually...",
    options: [
      { text: "Tell them what I admire about them", language: "words" },
      { text: "Plan quality time together", language: "time" },
      { text: "Help them with tasks or errands", language: "acts" },
      { text: "Give them physical affection", language: "touch" },
      { text: "Pick out something special for them", language: "gifts" },
    ],
  },
  {
    id: "q3",
    text: "I feel hurt when my partner...",
    options: [
      { text: "Criticizes me or rarely compliments me", language: "words" },
      { text: "Doesn't prioritize spending time with me", language: "time" },
      { text: "Doesn't help out when I'm overwhelmed", language: "acts" },
      { text: "Is physically distant or cold", language: "touch" },
      { text: "Forgets special occasions or never surprises me", language: "gifts" },
    ],
  },
  {
    id: "q4",
    text: "On a perfect date, I'd most want my partner to...",
    options: [
      { text: "Express how they feel about me", language: "words" },
      { text: "Be fully present without distractions", language: "time" },
      { text: "Plan and handle all the details", language: "acts" },
      { text: "Be affectionate throughout the evening", language: "touch" },
      { text: "Surprise me with something thoughtful", language: "gifts" },
    ],
  },
  {
    id: "q5",
    text: "After a hard day, what would comfort me most is...",
    options: [
      { text: "Hearing encouraging words from my partner", language: "words" },
      { text: "Having uninterrupted time together", language: "time" },
      { text: "Having my partner take care of something for me", language: "acts" },
      { text: "A long hug or back rub", language: "touch" },
      { text: "A small surprise to cheer me up", language: "gifts" },
    ],
  },
  {
    id: "q6",
    text: "I feel most connected to my partner when...",
    options: [
      { text: "We have deep, meaningful conversations", language: "words" },
      { text: "We spend the whole day together", language: "time" },
      { text: "They notice what I need and help without asking", language: "acts" },
      { text: "We're physically close and cuddling", language: "touch" },
      { text: "They remember the little things I like", language: "gifts" },
    ],
  },
];

const LANGUAGE_LABELS: Record<LoveLanguage, string> = {
  words: "Words of Affirmation",
  time: "Quality Time",
  acts: "Acts of Service",
  touch: "Physical Touch",
  gifts: "Receiving Gifts",
};

const LoveLanguageQuiz: React.FC<LoveLanguageQuizProps> = ({ onComplete, onBack }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, LoveLanguage>>({});
  const [saving, setSaving] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];

  const handleSelect = (language: LoveLanguage) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: language }));
  };

  const handleNext = async () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
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
    const scores: Record<LoveLanguage, number> = {
      words: 0,
      time: 0,
      acts: 0,
      touch: 0,
      gifts: 0,
    };

    Object.values(answers).forEach(language => {
      scores[language]++;
    });

    const sortedLanguages = Object.entries(scores).sort((a, b) => b[1] - a[1]) as [LoveLanguage, number][];
    const primary = LANGUAGE_LABELS[sortedLanguages[0][0]];
    const secondary = sortedLanguages[1][1] > 0 ? LANGUAGE_LABELS[sortedLanguages[1][0]] : null;

    return { primary, secondary };
  };

  const saveResults = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { primary, secondary } = calculateResult();

      await supabase
        .from("profiles")
        .update({
          primary_love_language: primary,
          secondary_love_language: secondary,
          quiz_love_language_completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      onComplete(primary);
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
      title="Love Language"
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
            selected={selectedAnswer === option.language}
            onClick={() => handleSelect(option.language)}
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

export default LoveLanguageQuiz;
