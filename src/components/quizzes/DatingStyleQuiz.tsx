import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import QuizLayout, { QuizOption } from "./QuizLayout";
import { toast } from "sonner";

interface DatingStyleQuizProps {
  onComplete: (result: string) => void;
  onBack: () => void;
}

interface Question {
  id: string;
  category: "honesty" | "security" | "motivation" | "triggers" | "skills";
  text: string;
  options: {
    text: string;
    score: number;
    flag?: string;
  }[];
}

const QUESTIONS: Question[] = [
  // Honesty & Intent
  {
    id: "honesty_1",
    category: "honesty",
    text: "She asks 'What are you looking for?' You...",
    options: [
      { text: "Tell her exactly what I want, even if it's not what she wants to hear", score: 10 },
      { text: "Give a vague answer to keep my options open", score: 4 },
      { text: "Say what I think she wants to hear", score: 2, flag: "deceptive" },
      { text: "Deflect with humor and change the subject", score: 3 },
    ],
  },
  {
    id: "honesty_2",
    category: "honesty",
    text: "You're talking to multiple women at once. If one asks, you...",
    options: [
      { text: "I'm honest—we're not exclusive yet", score: 10 },
      { text: "Say I'm 'getting to know people' without details", score: 6 },
      { text: "Tell her she's the only one even if she isn't", score: 1, flag: "deceptive" },
      { text: "Avoid the question entirely", score: 3 },
    ],
  },
  // Security & Attachment
  {
    id: "security_1",
    category: "security",
    text: "She hasn't texted back in 6 hours. You feel...",
    options: [
      { text: "Fine—she's probably busy", score: 10 },
      { text: "A little anxious but I distract myself", score: 7 },
      { text: "Checking my phone constantly, wondering what I did wrong", score: 3, flag: "anxious" },
      { text: "Annoyed—I'd never do that to her", score: 4, flag: "entitled" },
    ],
  },
  {
    id: "security_2",
    category: "security",
    text: "She mentions a close male friend. Your first thought is...",
    options: [
      { text: "Cool, friends are healthy", score: 10 },
      { text: "I'd want to meet him eventually", score: 8 },
      { text: "Is there something between them?", score: 4, flag: "jealousy" },
      { text: "That's a red flag for me", score: 2, flag: "jealousy" },
    ],
  },
  // Motivation
  {
    id: "motivation_1",
    category: "motivation",
    text: "What do you like most about dating someone new?",
    options: [
      { text: "Getting to know someone deeply", score: 10 },
      { text: "The excitement and validation", score: 6 },
      { text: "Physical connection", score: 5 },
      { text: "Having someone to do things with", score: 7 },
    ],
  },
  {
    id: "motivation_2",
    category: "motivation",
    text: "If things got serious, what would concern you most?",
    options: [
      { text: "Losing my freedom/independence", score: 5, flag: "avoidant" },
      { text: "That she might lose interest in me", score: 4, flag: "anxious" },
      { text: "That we might not be compatible long-term", score: 8 },
      { text: "Nothing—I'd be excited", score: 10 },
    ],
  },
  // Jealousy Triggers (Values)
  {
    id: "triggers_1",
    category: "triggers",
    text: "She likes another guy's thirst trap on Instagram. You...",
    options: [
      { text: "Don't care—it's just a like", score: 10 },
      { text: "Notice it but don't say anything", score: 7 },
      { text: "Feel bothered and might bring it up", score: 4, flag: "controlling" },
      { text: "Feel disrespected and it's a dealbreaker", score: 2, flag: "controlling" },
    ],
  },
  {
    id: "triggers_2",
    category: "triggers",
    text: "She's still friends with an ex. Honestly, you...",
    options: [
      { text: "Get it—not everyone cuts people off", score: 10 },
      { text: "Am okay if there's transparency", score: 8 },
      { text: "Feel uncomfortable but try to trust", score: 5, flag: "jealousy" },
      { text: "That's a dealbreaker for me", score: 2, flag: "jealousy" },
    ],
  },
  // Dating Skills
  {
    id: "skills_1",
    category: "skills",
    text: "On a first date, conversation usually...",
    options: [
      { text: "Flows naturally—we lose track of time", score: 10 },
      { text: "Goes well once I get comfortable", score: 8 },
      { text: "Feels like I'm asking all the questions", score: 4, flag: "interview_mode" },
      { text: "Is awkward—I struggle to keep it going", score: 3, flag: "needs_practice" },
    ],
  },
  {
    id: "skills_2",
    category: "skills",
    text: "She challenges your opinion. You typically...",
    options: [
      { text: "Enjoy the debate—different views are interesting", score: 10 },
      { text: "Listen and consider her perspective", score: 9 },
      { text: "Feel the need to defend myself", score: 4, flag: "defensive" },
      { text: "Get quiet or change the subject", score: 5, flag: "avoidant" },
    ],
  },
  {
    id: "skills_3",
    category: "skills",
    text: "After a great first date, how soon do you text her?",
    options: [
      { text: "When I feel like it—I don't overthink timing", score: 10 },
      { text: "Next day to keep momentum", score: 9 },
      { text: "Wait a few days so I don't seem too eager", score: 4, flag: "games" },
      { text: "Right away—I'm excited", score: 6, flag: "overeager" },
    ],
  },
  {
    id: "skills_4",
    category: "skills",
    text: "She shares something vulnerable. You usually...",
    options: [
      { text: "Listen and validate her feelings", score: 10 },
      { text: "Share something vulnerable too", score: 7 },
      { text: "Try to fix the problem or give advice", score: 5, flag: "fixer" },
      { text: "Feel awkward and don't know what to say", score: 4, flag: "emotional_difficulty" },
    ],
  },
];

const RESULT_PROFILES: Record<string, { title: string; description: string }> = {
  secure_honest: {
    title: "The Grounded Guy",
    description: "You're confident, honest, and secure. You date from a healthy place and can handle the ups and downs. D.E.V.I. will help you find the right match for your level.",
  },
  developing: {
    title: "Work in Progress",
    description: "You have good instincts but some areas to grow. D.E.V.I. will help you identify patterns and build better dating habits.",
  },
  needs_growth: {
    title: "Building Foundations",
    description: "You're self-aware enough to want to improve. D.E.V.I. will focus on helping you develop confidence and healthier dating patterns.",
  },
  red_flags: {
    title: "Time for Self-Reflection",
    description: "Some patterns might be holding you back. D.E.V.I. will gently challenge you to grow—because you deserve better relationships too.",
  },
};

const DatingStyleQuiz: React.FC<DatingStyleQuizProps> = ({ onComplete, onBack }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { score: number; flag?: string }>>({});
  const [saving, setSaving] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];

  const handleSelect = (score: number, flag?: string) => {
    setAnswers(prev => ({ 
      ...prev, 
      [currentQuestion.id]: { score, flag } 
    }));
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
    let totalScore = 0;
    const flags: Record<string, number> = {};
    const categoryScores: Record<string, number[]> = {
      honesty: [],
      security: [],
      motivation: [],
      triggers: [],
      skills: [],
    };

    Object.entries(answers).forEach(([questionId, answer]) => {
      totalScore += answer.score;
      if (answer.flag) {
        flags[answer.flag] = (flags[answer.flag] || 0) + 1;
      }
      
      const question = QUESTIONS.find(q => q.id === questionId);
      if (question) {
        categoryScores[question.category].push(answer.score);
      }
    });

    const maxScore = QUESTIONS.length * 10;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Calculate category averages
    const categoryAverages: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([category, scores]) => {
      if (scores.length > 0) {
        categoryAverages[category] = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        );
      }
    });

    // Determine result profile
    let profile = "developing";
    const hasRedFlags = (flags.deceptive || 0) >= 2 || 
                        (flags.controlling || 0) >= 2 ||
                        (flags.jealousy || 0) >= 2;

    if (hasRedFlags) {
      profile = "red_flags";
    } else if (percentage >= 80) {
      profile = "secure_honest";
    } else if (percentage >= 60) {
      profile = "developing";
    } else {
      profile = "needs_growth";
    }

    return {
      profile,
      percentage,
      flags,
      categoryAverages,
      jealousyTriggers: {
        social_media: flags.controlling || 0,
        exes: flags.jealousy || 0,
        friends: categoryAverages.triggers < 7,
      },
    };
  };

  const saveResults = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const result = calculateResult();

      await supabase
        .from("profiles")
        .update({
          attachment_security_level: result.profile,
          jealousy_triggers: result.jealousyTriggers,
          quiz_dating_style_completed_at: new Date().toISOString(),
        } as any)
        .eq("user_id", user.id);

      onComplete(result.profile);
    } catch (error) {
      console.error("Error saving quiz results:", error);
      toast.error("Failed to save results. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedAnswer = answers[currentQuestion.id];
  const selectedScore = selectedAnswer?.score;

  return (
    <QuizLayout
      title="Dating Style Assessment"
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
            selected={selectedScore === option.score && selectedAnswer?.flag === option.flag}
            onClick={() => handleSelect(option.score, option.flag)}
          >
            {option.text}
          </QuizOption>
        ))}
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <Button
          onClick={handleNext}
          disabled={selectedAnswer === undefined || saving}
          className="w-full"
          size="lg"
        >
          {currentIndex === QUESTIONS.length - 1 
            ? (saving ? "Saving..." : "Complete Assessment") 
            : "Continue"
          }
        </Button>
      </div>
    </QuizLayout>
  );
};

export default DatingStyleQuiz;
