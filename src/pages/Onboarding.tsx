import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Heart, Unlink, TrendingUp, Search, Stethoscope, ChevronRight } from "lucide-react";
import { VoiceInputButton } from "@/components/devi/VoiceInputButton";

const GOALS = [
  { value: "evaluate", icon: TrendingUp, label: "Evaluate someone I'm dating", desc: "Get AI scoring & red flag detection" },
  { value: "detachment", icon: Unlink, label: "Detach from someone", desc: "Guided plan to move on" },
  { value: "healing", icon: Heart, label: "Heal from a past relationship", desc: "Process & rebuild self-worth" },
  { value: "explore", icon: Search, label: "Start dating better", desc: "Learn your patterns & what to look for" },
  { value: "checkup", icon: Stethoscope, label: "Relationship check-up", desc: "Assess a current situation" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState("");
  const [name, setName] = useState("");

  const handleContinue = () => {
    // Store goal + name in localStorage for after signup
    localStorage.setItem("onboarding_goal", selectedGoal);
    localStorage.setItem("onboarding_name", name);
    navigate("/auth?mode=signup&setup=quick");
  };

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

      <main className="px-4 py-4 max-w-lg mx-auto pb-safe-bottom space-y-5">
        {/* Name input */}
        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="name" className="text-sm font-medium">What should we call you?</Label>
          <Input
            id="name"
            placeholder="Your first name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
            autoFocus
          />
        </div>

        {/* Goal selection */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-lg font-bold">What brings you here?</h2>
          <p className="text-xs text-muted-foreground">This helps D.E.V.I. give you the right guidance from the start</p>
        </div>

        <div className="space-y-2">
          {GOALS.map((goal, idx) => {
            const Icon = goal.icon;
            const selected = selectedGoal === goal.value;
            return (
              <button
                key={goal.value}
                onClick={() => setSelectedGoal(goal.value)}
                className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all duration-200 animate-fade-in group ${
                  selected 
                    ? "border-primary bg-primary/5 shadow-[var(--shadow-soft)]" 
                    : "border-border/50 bg-[image:var(--gradient-glass)] hover:border-primary/30"
                }`}
                style={{ animationDelay: `${(idx + 2) * 80}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selected ? "bg-[image:var(--gradient-hero)]" : "bg-muted"
                  }`}>
                    <Icon className={`w-5 h-5 ${selected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{goal.label}</h3>
                    <p className="text-xs text-muted-foreground">{goal.desc}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-colors ${selected ? "text-primary" : "text-muted-foreground/40"}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="pt-2 space-y-2">
          <Button
            onClick={handleContinue}
            disabled={!selectedGoal || !name.trim()}
            className="w-full py-6 text-base font-semibold rounded-2xl bg-[image:var(--gradient-hero)] hover:opacity-90 transition-opacity"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => navigate("/auth")} className="text-primary font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
