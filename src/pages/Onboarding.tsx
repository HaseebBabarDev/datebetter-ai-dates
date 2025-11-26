import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Shield, TrendingUp } from "lucide-react";

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
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <header className="px-4 py-4 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
          dateBetter
        </h1>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-12 max-w-6xl">
        <div className="text-center mb-6 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-bold mb-3 md:mb-6">
            Your Journey to Better Dating Starts Here
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Let's set up your personalized AI dating assistant
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 md:gap-8 mb-6 md:mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-4 md:p-8 bg-[image:var(--gradient-card)] border-border/50 hover:shadow-[var(--shadow-soft)] transition-all duration-300"
              >
                <div className="flex md:block items-center gap-3 md:gap-0">
                  <div className="mb-0 md:mb-6 w-10 h-10 md:w-16 md:h-16 shrink-0 rounded-xl md:rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center">
                    <Icon className="w-5 h-5 md:w-8 md:h-8 text-primary-foreground" />
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
            onClick={() => {
              // For demo, navigate back to home or to a setup flow
              navigate("/");
            }}
            className="font-semibold w-full md:w-auto"
          >
            Continue Setup →
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
