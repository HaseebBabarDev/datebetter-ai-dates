import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpg";
import { IPhoneMockup } from "@/components/website/IPhoneMockup";
import { ScreenshotDemo } from "@/components/website/ScreenshotDemo";
import { CompatibilityDemo } from "@/components/website/CompatibilityDemo";
import { ChatDemo } from "@/components/website/ChatDemo";

const DECK_PASSWORD = "DateBetter2025";

/* ─── Reusable styled components ─── */
const Pill = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
    {children}
  </div>
);

const MetricCard = ({ metric, label, accent = false }: { metric: string; label: string; accent?: boolean }) => (
  <div className={`rounded-2xl p-6 text-center transition-all ${accent ? "border-2 border-primary bg-primary/5 shadow-[var(--shadow-soft)]" : "border border-border bg-card"}`}>
    <p className={`text-3xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{metric}</p>
    <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
  </div>
);

/* ─── Slide data ─── */
const slides = [
  {
    id: 1,
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <img src={logo} alt="DateBetter" className="w-20 h-20 rounded-2xl shadow-[var(--shadow-elegant)]" />
        <h2 className="font-poppins text-3xl md:text-5xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent leading-tight">
          dateBetter
        </h2>
        <p className="text-xl md:text-2xl font-light text-foreground/80 max-w-lg">
          Relationship Intelligence for Modern Dating
        </p>
        <div className="w-16 h-px bg-primary/30 my-2" />
        <p className="text-lg text-muted-foreground">
          Not a dating app. A <span className="font-semibold text-primary">decision engine</span>.
        </p>
        <Pill>Raising $500K Pre-Seed</Pill>
      </div>
    ),
  },
  {
    id: 2,
    label: "Behavioral Shift",
    title: "AI Is Already Being Used for Dating Decisions",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto">
        {[
          "Women paste texts into ChatGPT.",
          "They crowdsource red flags.",
          "They bring early dating confusion into therapy.",
        ].map((t, i) => (
          <p key={i} className="text-lg md:text-xl text-foreground/80 pl-4 border-l-2 border-primary/40">{t}</p>
        ))}
        <p className="text-lg md:text-xl font-medium text-foreground pt-4">
          But generic AI has <span className="text-primary">no memory, no structure, and no behavioral tracking</span>.
        </p>
      </div>
    ),
  },
  {
    id: 3,
    label: "Positioning",
    title: "We Do Not Compete With Bumble",
    content: (
      <div className="space-y-8 max-w-3xl mx-auto">
        <p className="text-lg text-muted-foreground">No swiping. No matching. No engagement loops.</p>
        <p className="text-xl text-foreground">
          We sit <span className="font-semibold">after the match</span> — where emotional mistakes happen.
        </p>
        <div className="grid grid-cols-2 gap-6 pt-4">
          <div className="rounded-2xl border border-border p-6 text-center bg-card">
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Dating Apps</p>
            <p className="text-2xl font-semibold text-foreground">Engagement</p>
          </div>
          <div className="rounded-2xl border-2 border-primary p-6 text-center bg-primary/5 shadow-[var(--shadow-soft)]">
            <p className="text-sm uppercase tracking-wide text-primary mb-2">DateBetter</p>
            <p className="text-2xl font-semibold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">Decisions</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    label: "Problem",
    title: "Modern Dating Is Emotionally Reactive",
    content: (
      <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
        {[
          { icon: "💬", text: "Overanalyzing texts" },
          { icon: "🚩", text: "Ignoring early red flags" },
          { icon: "💔", text: "Attachment before clarity" },
          { icon: "😩", text: "Burnout & decision fatigue" },
        ].map((item, i) => (
          <div key={i} className="rounded-2xl border border-border p-6 flex items-center gap-4 bg-card">
            <span className="text-3xl">{item.icon}</span>
            <span className="text-lg text-foreground">{item.text}</span>
          </div>
        ))}
        <p className="col-span-2 text-lg text-muted-foreground pt-4 text-center">
          High-awareness women want <span className="font-semibold text-foreground">logic before emotional investment</span>.
        </p>
      </div>
    ),
  },
  {
    id: 5,
    label: "Solution",
    title: "Meet D.E.V.I. — A 24/7 Relationship Intelligence Engine",
    content: (
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
        <div className="space-y-4">
          {[
            "Logs dating interactions",
            "Maintains memory across conversations",
            "Detects behavioral patterns",
            "Generates compatibility scoring",
            "Provides structured decision guidance",
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-lg text-foreground">
              <div className="w-2.5 h-2.5 rounded-full bg-[image:var(--gradient-primary)] shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <div className="flex justify-center scale-[0.7] origin-center">
          <IPhoneMockup>
            <ScreenshotDemo />
          </IPhoneMockup>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    label: "Product Demo",
    title: "See It In Action",
    content: (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          <div className="text-center">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Screenshot Analysis</p>
            <div className="scale-[0.6] origin-top">
              <IPhoneMockup>
                <ScreenshotDemo />
              </IPhoneMockup>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Compatibility Engine</p>
            <div className="scale-[0.6] origin-top">
              <IPhoneMockup>
                <CompatibilityDemo />
              </IPhoneMockup>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">D.E.V.I. Chat</p>
            <div className="scale-[0.6] origin-top">
              <IPhoneMockup>
                <ChatDemo />
              </IPhoneMockup>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    label: "Live Demo",
    title: "App Walkthrough",
    content: (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl overflow-hidden border-2 border-primary/20 shadow-[var(--shadow-elegant)] bg-black">
          <video
            src="/videos/splash-video.mp4"
            poster="/videos/splash-poster.jpg"
            controls
            className="w-full aspect-video"
            playsInline
          />
        </div>
        <p className="text-sm text-muted-foreground text-center mt-4">
          Live product demo — recorded from the beta app
        </p>
      </div>
    ),
  },
  {
    id: 8,
    label: "Traction",
    title: "We Built It. It Works.",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard metric="Live" label="MVP Status" accent />
          <MetricCard metric="40" label="Beta Users" />
          <MetricCard metric="10K" label="User Capacity" />
        </div>
        <div className="space-y-2 text-lg text-foreground/80">
          <p>✓ Therapist-reviewed psychology framework</p>
          <p>✓ App Store submission in progress</p>
          <p>✓ AI marginal cost under <span className="font-semibold text-primary">$0.15/user</span></p>
        </div>
        <p className="text-lg font-medium text-foreground border-t border-border pt-6">
          We are raising to validate paid acquisition and reach $50K MRR — <span className="text-primary">not to build</span>.
        </p>
      </div>
    ),
  },
  {
    id: 9,
    label: "Business Model",
    title: "Subscription SaaS",
    content: (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {[
            { price: "$9.99", tier: "Basic" },
            { price: "$15.99", tier: "Core", featured: true },
            { price: "$29.99", tier: "Premium" },
          ].map((p, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 text-center transition-all ${
                p.featured
                  ? "border-2 border-primary bg-primary/5 shadow-[var(--shadow-soft)] scale-105"
                  : "border border-border bg-card"
              }`}
            >
              <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">{p.tier}</p>
              <p className={`text-3xl font-bold ${p.featured ? "bg-[image:var(--gradient-hero)] bg-clip-text text-transparent" : "text-foreground"}`}>
                {p.price}
              </p>
              <p className="text-xs text-muted-foreground mt-1">/month</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-xl text-foreground">
            Modeled blended ARPU: <span className="font-bold text-primary">$15</span>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    label: "Unit Economics",
    title: "Platform-Adjusted Unit Economics",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto">
        <p className="text-sm text-muted-foreground text-center">Both Apple fee scenarios modeled</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border-2 border-primary p-6 bg-primary/5 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-medium text-primary mb-4">15% Fee — Year 1 (Small Business)</p>
            <div className="space-y-2 text-foreground">
              <p>$15 ARPU → $12.75 net</p>
              <p>$12.25 contribution</p>
              <p className="text-2xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">82% margin</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border p-6 bg-card">
            <p className="text-sm font-medium text-muted-foreground mb-4">30% Fee — Worst Case (&gt;$1M)</p>
            <div className="space-y-2 text-foreground">
              <p>$15 ARPU → $10.50 net</p>
              <p>$10.00 contribution</p>
              <p className="text-2xl font-bold text-foreground">67% margin</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          AI cost: $0.15/user · Payment + overhead: $0.35/user · Margin expands as model pricing drops
        </p>
      </div>
    ),
  },
  {
    id: 11,
    label: "Growth",
    title: "Growth Strategy — $300K Acquisition Budget",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="space-y-4">
          {[
            { channel: "Meta / TikTok", budget: "$150K", cpa: "$50", users: "3,000" },
            { channel: "AppLovin", budget: "$100K", cpa: "$55", users: "1,818" },
            { channel: "Creator / Affiliate", budget: "$50K", cpa: "$25", users: "2,000" },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl border border-border p-5 bg-card">
              <span className="font-medium text-foreground">{c.channel}</span>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>{c.budget}</span>
                <span>CPA {c.cpa}</span>
                <span className="font-semibold text-primary">{c.users} users</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center shadow-[var(--shadow-soft)]">
          <p className="text-xl text-foreground">
            Total: <span className="font-bold text-primary">8,618 users</span> Year 1 · Blended CPA ~$44
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 12,
    label: "Capital",
    title: "Capital Deployment & Scenarios",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard metric="$75K" label="Final polish + launch" />
          <MetricCard metric="$300K" label="CAC validation + growth" accent />
          <MetricCard metric="$125K" label="Runway + contingency" />
        </div>
        <div className="space-y-3">
          {[
            { scenario: "Conservative ($55 CPA)", mrr: "~$50K MRR", accent: false },
            { scenario: "Base Case ($44 CPA)", mrr: "~$77K MRR → $930K ARR", accent: true },
            { scenario: "Upside ($30 CPA)", mrr: "~$100K+ MRR", accent: false },
          ].map((s, i) => (
            <div key={i} className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-foreground">{s.scenario}</span>
              <span className={s.accent ? "text-primary font-semibold" : "text-muted-foreground"}>{s.mrr}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Cash-flow positive by Month 12 at base case with capital remaining.
        </p>
      </div>
    ),
  },
  {
    id: 13,
    label: "Moat",
    title: "Structured Behavioral Data Moat",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: "📊", text: "Logged decisions" },
            { icon: "🧠", text: "Emotional pattern history" },
            { icon: "📈", text: "Compatibility evolution" },
            { icon: "🔮", text: "Predictive insights" },
          ].map((d, i) => (
            <div key={i} className="rounded-2xl border border-border p-6 flex items-center gap-4 bg-card">
              <span className="text-3xl">{d.icon}</span>
              <span className="text-lg text-foreground">{d.text}</span>
            </div>
          ))}
        </div>
        <p className="text-xl text-center text-foreground font-medium pt-4">
          Generic AI <span className="text-primary">cannot replicate</span> structured historical user data.
        </p>
      </div>
    ),
  },
  {
    id: 14,
    label: "Timing",
    title: "Why Now",
    content: (
      <div className="space-y-5 max-w-3xl mx-auto">
        {[
          "AI normalized for personal advice",
          "Therapy demand increasing",
          "Dating burnout rising",
          "Women investing in self-optimization",
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-4 text-xl text-foreground">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[image:var(--gradient-primary)]" />
            </div>
            {t}
          </div>
        ))}
        <p className="text-xl font-semibold text-primary text-center pt-8">
          Relationship intelligence is an emerging category.
        </p>
      </div>
    ),
  },
  {
    id: 15,
    label: "Valuation",
    title: "$500K for 15% Equity",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto text-center">
        <p className="text-3xl font-light text-foreground">
          ~<span className="font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">$3.3M</span> post-money
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {[
            "Live product",
            "Therapist-reviewed",
            "10K infrastructure",
            "67–82% margin",
          ].map((v, i) => (
            <div key={i} className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-muted-foreground pt-4">
          Capital accelerates <span className="font-semibold text-foreground">scale</span> — not development.
        </p>
      </div>
    ),
  },
  {
    id: 16,
    label: "The Ask",
    title: "The Ask",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center max-w-2xl mx-auto">
        <img src={logo} alt="DateBetter" className="w-16 h-16 rounded-2xl shadow-[var(--shadow-soft)]" />
        <p className="text-3xl md:text-4xl font-light text-foreground">
          Raising <span className="font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">$500K</span>
        </p>
        <p className="text-xl text-muted-foreground">12–15 month runway. Focused on CAC validation and early scale.</p>
        <div className="w-24 h-px bg-primary/30" />
        <p className="text-2xl font-semibold text-foreground">
          We are building the operating system for{" "}
          <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">relationship decisions</span>.
        </p>
      </div>
    ),
  },
];

/* ─── Password Gate ─── */
const PasswordGate = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === DECK_PASSWORD) {
      sessionStorage.setItem("pitch_unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setPw("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-secondary/15 blur-[80px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="DateBetter" className="w-16 h-16 rounded-2xl shadow-[var(--shadow-soft)] mb-4" />
            <h1 className="text-xl font-semibold font-poppins bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              dateBetter Pitch Deck
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Enter password to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false); }}
                placeholder="Password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-destructive">Incorrect password</p>}
            <Button
              type="submit"
              disabled={!pw}
              className="w-full bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-soft)]"
            >
              View Deck
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Deck Viewer ─── */
const PitchDeck = () => {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("pitch_unlocked") === "1"
  );
  const [current, setCurrent] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrent((c) => Math.min(c + 1, slides.length - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrent((c) => Math.max(c - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const slide = slides[current];

  return (
    <div className="min-h-screen bg-background flex flex-col select-none relative">
      {/* Subtle glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-secondary/8 blur-[100px]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-8 py-3 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="w-6 h-6 rounded-md" />
          <span className="text-xs tracking-widest uppercase text-muted-foreground font-medium">
            Confidential
          </span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {current + 1} / {slides.length}
        </span>
      </div>

      {/* Slide area */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 md:p-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-5xl"
          >
            {slide.label && (
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3 text-center font-semibold">{slide.label}</p>
            )}
            {slide.title && (
              <h2 className="text-2xl md:text-4xl font-semibold text-foreground text-center mb-10 leading-tight">
                {slide.title}
              </h2>
            )}
            {slide.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="relative z-10 flex items-center justify-center gap-4 pb-6">
        <Button
          variant="ghost"
          size="icon"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? "bg-primary w-6" : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={current === slides.length - 1}
          onClick={() => setCurrent((c) => c + 1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default PitchDeck;
