import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Moon, Lock, Sparkles, Shield } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Welcome = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Brain, text: "AI scores every candidate for you" },
    { icon: Moon, text: "Cycle-aware dating guidance" },
    { icon: Lock, text: "Your privacy is completely protected" },
    { icon: Sparkles, text: "Learning algorithms that improve with each interaction" },
    { icon: Shield, text: "Built for women, by women" },
  ];

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <header className="px-6 py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
          dateBetter
        </h1>
      </header>

      <main className="container mx-auto px-6 pb-20">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-12 mb-20 pt-12">
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
                We put the data in dating
              </p>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                AI-backed app helping women select{" "}
                <span className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
                  better partners
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.1)] to-[hsl(var(--secondary)/0.1)] flex items-center justify-center group-hover:from-[hsl(var(--primary)/0.2)] group-hover:to-[hsl(var(--secondary)/0.2)] transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-lg">{feature.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-6">
              <Button 
                variant="hero" 
                size="lg"
                onClick={() => navigate("/onboarding")}
                className="font-semibold"
              >
                Get Started
              </Button>
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] transition-shadow duration-500">
              <img
                src={heroImage}
                alt="Abstract representation of AI-powered connection and intelligence"
                className="w-full h-auto aspect-video object-cover"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Welcome;
