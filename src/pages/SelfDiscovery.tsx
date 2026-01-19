import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Brain, CheckCircle2, Clock, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import AttachmentStyleQuiz from "@/components/quizzes/AttachmentStyleQuiz";
import LoveLanguageQuiz from "@/components/quizzes/LoveLanguageQuiz";
import PersonalityQuiz from "@/components/quizzes/PersonalityQuiz";
import QuizCompletionScreen from "@/components/quizzes/QuizCompletionScreen";

type QuizType = "attachment" | "love_language" | "personality" | null;

interface QuizInfo {
  id: QuizType;
  title: string;
  description: string;
  time: string;
  icon: React.ElementType;
  completedAtField: string;
}

const QUIZZES: QuizInfo[] = [
  {
    id: "attachment",
    title: "Attachment Style",
    description: "Understand how you emotionally connect, seek closeness, and respond to intimacy in relationships.",
    time: "5 min",
    icon: Heart,
    completedAtField: "quiz_attachment_completed_at",
  },
  {
    id: "love_language",
    title: "Love Language",
    description: "Learn how you naturally give and receive love and care.",
    time: "3 min",
    icon: MessageCircle,
    completedAtField: "quiz_love_language_completed_at",
  },
  {
    id: "personality",
    title: "Personality Preferences",
    description: "Explore how you process information, make decisions, and interact with the world.",
    time: "6-7 min",
    icon: Brain,
    completedAtField: "quiz_personality_completed_at",
  },
];

const SelfDiscovery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeQuiz, setActiveQuiz] = useState<QuizType>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<QuizType>>(new Set());
  const [showCompletion, setShowCompletion] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadQuizStatus();
  }, [user, navigate]);

  const loadQuizStatus = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("quiz_attachment_completed_at, quiz_love_language_completed_at, quiz_personality_completed_at")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const completed = new Set<QuizType>();
        if ((profile as any).quiz_attachment_completed_at) completed.add("attachment");
        if ((profile as any).quiz_love_language_completed_at) completed.add("love_language");
        if ((profile as any).quiz_personality_completed_at) completed.add("personality");
        setCompletedQuizzes(completed);
      }
    } catch (error) {
      console.error("Error loading quiz status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (quizType: QuizType) => {
    setCompletedQuizzes(prev => new Set([...prev, quizType]));
    setShowCompletion(true);
    setActiveQuiz(null);
  };

  const handleContinueToDevi = () => {
    navigate("/devi");
  };

  const handleTakeAnotherQuiz = () => {
    setShowCompletion(false);
  };

  // Show completion screen
  if (showCompletion) {
    return (
      <QuizCompletionScreen
        onContinue={handleContinueToDevi}
        onTakeAnother={handleTakeAnotherQuiz}
      />
    );
  }

  // Show active quiz
  if (activeQuiz === "attachment") {
    return <AttachmentStyleQuiz onComplete={() => handleQuizComplete("attachment")} onBack={() => setActiveQuiz(null)} />;
  }
  if (activeQuiz === "love_language") {
    return <LoveLanguageQuiz onComplete={() => handleQuizComplete("love_language")} onBack={() => setActiveQuiz(null)} />;
  }
  if (activeQuiz === "personality") {
    return <PersonalityQuiz onComplete={() => handleQuizComplete("personality")} onBack={() => setActiveQuiz(null)} />;
  }

  // Show quiz hub
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Self-Discovery</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Complete these quizzes to help D.E.V.I. personalize your guidance
        </p>
      </div>

      {/* Quiz Cards */}
      <div className="px-4 space-y-4">
        {QUIZZES.map((quiz) => {
          const Icon = quiz.icon;
          const isCompleted = completedQuizzes.has(quiz.id);

          return (
            <Card 
              key={quiz.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg",
                isCompleted && "border-primary/30 bg-primary/5"
              )}
              onClick={() => setActiveQuiz(quiz.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isCompleted 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {quiz.title}
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {quiz.time}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-3">
                  {quiz.description}
                </CardDescription>
                <Button 
                  variant={isCompleted ? "outline" : "default"}
                  size="sm"
                  className="w-full group"
                >
                  {isCompleted ? "Retake Quiz" : "Start Quiz"}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="px-4 mt-6">
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">How D.E.V.I. uses your results</p>
                <p>
                  Your quiz results help personalize advice, adjust communication tone, 
                  and provide guidance that resonates with your unique patterns and preferences.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelfDiscovery;
