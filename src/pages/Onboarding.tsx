import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Shield, TrendingUp, ArrowLeft, Sparkles } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: "Score Every Candidate",
      description: "Our AI evaluates compatibility and red flags—removing emotional bias from your decisions",
    },
    {
      icon: Brain,
      title: "Get Smart Insights",
      description: "Setup takes 10-15 minutes but creates your personalized scoring system—worth every minute",
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
        <div className="text-center mb-5 md:mb-12">
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

        <div className="grid md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-10">
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

        <div className="text-center">
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/auth?mode=signup")}
            className="font-semibold w-full md:w-auto h-12"
          >
            Continue Setup
            <Sparkles className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
