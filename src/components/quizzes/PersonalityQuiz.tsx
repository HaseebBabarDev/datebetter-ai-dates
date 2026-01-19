import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import QuizLayout, { QuizOption } from "./QuizLayout";
import { toast } from "sonner";

interface PersonalityQuizProps {
  onComplete: (result: string) => void;
  onBack: () => void;
}

type Dimension = "EI" | "SN" | "TF" | "JP";
type Pole = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

interface Question {
  id: string;
  dimension: Dimension;
  text: string;
  options: {
    text: string;
    pole: Pole;
  }[];
}

const QUESTIONS: Question[] = [
  // E/I Questions
  {
    id: "ei1",
    dimension: "EI",
    text: "After a long week, what helps you recharge?",
    options: [
      { text: "Going out with friends or meeting new people", pole: "E" },
      { text: "Having quiet time alone or with one close person", pole: "I" },
    ],
  },
  {
    id: "ei2",
    dimension: "EI",
    text: "In social situations, you usually...",
    options: [
      { text: "Start conversations and enjoy meeting new people", pole: "E" },
      { text: "Wait for others to approach or stick with familiar faces", pole: "I" },
    ],
  },
  {
    id: "ei3",
    dimension: "EI",
    text: "When processing your thoughts, you prefer to...",
    options: [
      { text: "Talk it out with others", pole: "E" },
      { text: "Think it through internally first", pole: "I" },
    ],
  },
  // S/N Questions
  {
    id: "sn1",
    dimension: "SN",
    text: "When learning something new, you focus on...",
    options: [
      { text: "Practical details and step-by-step instructions", pole: "S" },
      { text: "The big picture and underlying concepts", pole: "N" },
    ],
  },
  {
    id: "sn2",
    dimension: "SN",
    text: "You're more drawn to conversations about...",
    options: [
      { text: "Real experiences and what's happening now", pole: "S" },
      { text: "Ideas, possibilities, and what could be", pole: "N" },
    ],
  },
  {
    id: "sn3",
    dimension: "SN",
    text: "When making plans, you tend to...",
    options: [
      { text: "Rely on what's worked before", pole: "S" },
      { text: "Try new and creative approaches", pole: "N" },
    ],
  },
  // T/F Questions
  {
    id: "tf1",
    dimension: "TF",
    text: "When a friend asks for advice on a problem, you usually...",
    options: [
      { text: "Analyze the situation and offer logical solutions", pole: "T" },
      { text: "Consider their feelings first and offer support", pole: "F" },
    ],
  },
  {
    id: "tf2",
    dimension: "TF",
    text: "In disagreements, what matters more to you?",
    options: [
      { text: "Being right and fair", pole: "T" },
      { text: "Maintaining harmony and connection", pole: "F" },
    ],
  },
  {
    id: "tf3",
    dimension: "TF",
    text: "When making important decisions, you rely more on...",
    options: [
      { text: "Logic, facts, and objective analysis", pole: "T" },
      { text: "Values, intuition, and how it affects people", pole: "F" },
    ],
  },
  // J/P Questions
  {
    id: "jp1",
    dimension: "JP",
    text: "When it comes to plans and schedules, you...",
    options: [
      { text: "Prefer having things decided and organized", pole: "J" },
      { text: "Prefer staying flexible and spontaneous", pole: "P" },
    ],
  },
  {
    id: "jp2",
    dimension: "JP",
    text: "On your to-do list, you typically...",
    options: [
      { text: "Work through it methodically and finish early", pole: "J" },
      { text: "Work in bursts and often finish close to deadlines", pole: "P" },
    ],
  },
  {
    id: "jp3",
    dimension: "JP",
    text: "You feel most comfortable when...",
    options: [
      { text: "Things are settled and you know what to expect", pole: "J" },
      { text: "Options are open and you can adapt as needed", pole: "P" },
    ],
  },
];

const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({ onComplete, onBack }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Pole>>({});
  const [saving, setSaving] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];

  const handleSelect = (pole: Pole) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: pole }));
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
    const dimensionScores: Record<Dimension, Record<string, number>> = {
      EI: { E: 0, I: 0 },
      SN: { S: 0, N: 0 },
      TF: { T: 0, F: 0 },
      JP: { J: 0, P: 0 },
    };

    QUESTIONS.forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        dimensionScores[q.dimension][answer]++;
      }
    });

    // Determine type
    const type = [
      dimensionScores.EI.E >= dimensionScores.EI.I ? "E" : "I",
      dimensionScores.SN.S >= dimensionScores.SN.N ? "S" : "N",
      dimensionScores.TF.T >= dimensionScores.TF.F ? "T" : "F",
      dimensionScores.JP.J >= dimensionScores.JP.P ? "J" : "P",
    ].join("");

    // Calculate percentages for each dimension
    const dimensions = {
      EI: {
        E: Math.round((dimensionScores.EI.E / 3) * 100),
        I: Math.round((dimensionScores.EI.I / 3) * 100),
      },
      SN: {
        S: Math.round((dimensionScores.SN.S / 3) * 100),
        N: Math.round((dimensionScores.SN.N / 3) * 100),
      },
      TF: {
        T: Math.round((dimensionScores.TF.T / 3) * 100),
        F: Math.round((dimensionScores.TF.F / 3) * 100),
      },
      JP: {
        J: Math.round((dimensionScores.JP.J / 3) * 100),
        P: Math.round((dimensionScores.JP.P / 3) * 100),
      },
    };

    return { type, dimensions };
  };

  const saveResults = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { type, dimensions } = calculateResult();

      await supabase
        .from("profiles")
        .update({
          personality_type: type,
          personality_dimensions: dimensions,
          quiz_personality_completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      onComplete(type);
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
      title="Personality Preferences"
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
        <p className="text-sm text-muted-foreground mt-2">
          Choose the option that feels more natural to you
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option, index) => (
          <QuizOption
            key={index}
            selected={selectedAnswer === option.pole}
            onClick={() => handleSelect(option.pole)}
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

export default PersonalityQuiz;
