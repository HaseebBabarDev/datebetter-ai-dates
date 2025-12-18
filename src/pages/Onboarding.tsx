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
    <div className="min-h-screen bg-[image:var(--gradient-page)]">
      <header className="px-4 py-4 md:py-8 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-primary/10 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
            dateBetter
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-12 max-w-6xl">
        <div className="text-center mb-6 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-bold mb-3 md:mb-6">
            Your Journey to Better Dating Starts Here
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
            Meet our AI — <Sparkles className="inline w-4 h-4 md:w-5 md:h-5 text-primary" /> <span className="font-semibold text-primary">D.E.V.I.</span>
          </p>
          <p className="text-xs md:text-sm text-muted-foreground/80 max-w-xl mx-auto">
            Your Dating Evaluation & Vetting Intelligence personalized AI assistant
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-5 md:p-8 bg-[image:var(--gradient-glass)] backdrop-blur-sm border-border/30 hover:shadow-[var(--shadow-soft)] hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex md:block items-center gap-4 md:gap-0">
                  <div className="mb-0 md:mb-6 w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-[var(--shadow-soft)]">
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-xl font-semibold mb-1 md:mb-3">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
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
            className="font-semibold w-full md:w-auto"
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
