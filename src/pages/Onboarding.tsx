import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Brain, Shield, TrendingUp, ArrowLeft, Sparkles, Zap, Clock, ChevronRight } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [showSetupDialog, setShowSetupDialog] = useState(false);

  const features = [
    {
      icon: TrendingUp,
      title: "Score Every Candidate",
      description: "Our AI evaluates compatibility and red flags—removing emotional bias from your decisions",
    },
    {
      icon: Brain,
      title: "Get Smart Insights",
      description: "Your personalized scoring system helps you make better dating decisions",
    },
    {
      icon: Shield,
      title: "Stay Protected",
      description: "AI tracks patterns and alerts you to manipulation during your most vulnerable moments",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[image:var(--gradient-page)]">
      <header className="px-4 py-3 pt-safe-top flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-primary/10 rounded-xl h-9 w-9">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
            dateBetter
          </span>
        </div>
      </header>

      <main className="px-4 py-3 md:py-8 max-w-6xl mx-auto pb-safe-bottom">
        <div className="text-center mb-5 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-5xl font-bold mb-2 md:mb-4">
            Your Journey to Better Dating Starts Here
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mb-1">
            Meet our AI — <Sparkles className="inline w-4 h-4 text-primary" /> <span className="font-semibold text-primary">D.E.V.I.</span>
          </p>
          <p className="text-xs md:text-sm text-muted-foreground/80 max-w-xl mx-auto">
            Your Dating Evaluation & Vetting Intelligence personalized AI assistant
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-4 md:p-6 bg-[image:var(--gradient-glass)] backdrop-blur-sm border-border/30 hover:shadow-[var(--shadow-soft)] hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex md:block items-center gap-3 md:gap-0">
                  <div className="mb-0 md:mb-4 w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-[var(--shadow-soft)]">
                    <Icon className="w-5 h-5 md:w-7 md:h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-lg font-semibold mb-0.5 md:mb-2">{feature.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Get Started Button */}
        <div className="max-w-lg mx-auto mb-6">
          <Button
            onClick={() => setShowSetupDialog(true)}
            className="w-full py-6 text-lg font-semibold rounded-2xl bg-[image:var(--gradient-hero)] hover:opacity-90 transition-opacity"
          >
            Get Started
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <button onClick={() => navigate("/auth")} className="text-primary font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </main>

      {/* Setup Options Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm mx-auto rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Choose Your Setup</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 pt-2">
            {/* Quick Setup Option */}
            <button
              onClick={() => navigate("/auth?mode=signup&setup=quick")}
              className="w-full p-4 rounded-2xl bg-[image:var(--gradient-glass)] backdrop-blur-sm border-2 border-primary/30 hover:border-primary/60 hover:shadow-[var(--shadow-soft)] transition-all duration-300 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-foreground">Quick Setup</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">2 MIN</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Get AI scoring right away—refine accuracy later</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>

            {/* Full Onboarding Option */}
            <button
              onClick={() => navigate("/auth?mode=signup&setup=full")}
              className="w-full p-4 rounded-2xl bg-[image:var(--gradient-hero)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-white">Full Onboarding</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold">10-15 MIN</span>
                  </div>
                  <p className="text-xs text-white/80">Most accurate AI scoring & personalized insights</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-2 ml-15 pl-15">
                <span className="text-[10px] text-white/60 flex items-center gap-1 ml-[60px]">
                  <Sparkles className="w-3 h-3" /> Recommended for best results
                </span>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Onboarding;
