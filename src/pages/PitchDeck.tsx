import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Eye, EyeOff, ChevronLeft, ChevronRight, ArrowLeft, Maximize2, Minimize2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpg";
import { IPhoneMockup } from "@/components/website/IPhoneMockup";
import { ScreenshotDemo } from "@/components/website/ScreenshotDemo";
import { CompatibilityDemo } from "@/components/website/CompatibilityDemo";
import { ChatDemo } from "@/components/website/ChatDemo";

const DECK_PASSWORD = "DateBetter2025";

/* ─── Staggered children wrapper ─── */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

const Stagger = ({ children }: { children: React.ReactNode }) => (
  <motion.div variants={staggerContainer} initial="hidden" animate="visible">
    {children}
  </motion.div>
);

const FadeUp = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div variants={staggerItem} className={className}>
    {children}
  </motion.div>
);

/* ─── Reusable styled components ─── */
const Pill = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.97 }}
    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider backdrop-blur-sm cursor-default"
  >
    {children}
  </motion.div>
);

const MetricCard = ({ metric, label, accent = false }: { metric: string; label: string; accent?: boolean }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={`rounded-2xl p-6 text-center transition-colors cursor-default ${accent ? "border-2 border-primary bg-primary/5 shadow-[var(--shadow-soft)]" : "border border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/30"}`}
  >
    <p className={`text-3xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{metric}</p>
    <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
  </motion.div>
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

/* ─── Animated Background ─── */
const DeckBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[image:var(--gradient-page)]" />
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px]"
      animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      style={{ top: "-10%", right: "10%" }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[130px]"
      animate={{ x: [0, -60, 50, 0], y: [0, 50, -30, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      style={{ bottom: "-5%", left: "5%" }}
    />
    <motion.div
      className="absolute w-[300px] h-[300px] rounded-full bg-accent/8 blur-[100px]"
      animate={{ x: [0, 40, -20, 0], y: [0, -40, 20, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      style={{ top: "40%", left: "40%" }}
    />
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    />
  </div>
);

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
    <div className="min-h-screen flex items-center justify-center p-4 relative font-poppins">
      <DeckBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-10 shadow-[var(--shadow-elegant)]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl shadow-[var(--shadow-glow)] mb-5 overflow-hidden ring-2 ring-primary/20">
              <img src={logo} alt="DateBetter" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              dateBetter Pitch Deck
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Enter password to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false); }}
                placeholder="Password"
                className="pr-10 h-12 rounded-xl bg-background/60 border-border/60 font-poppins"
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
              className="w-full h-12 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-soft)] text-base font-semibold font-poppins"
            >
              View Deck
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Slide Thumbnail Drawer ─── */
const SlideDrawer = ({ slides: sl, current, onSelect, onClose }: { slides: typeof slides; current: number; onSelect: (i: number) => void; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex flex-col font-poppins"
    onClick={onClose}
  >
    <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
      <h3 className="text-lg font-bold text-foreground">All Slides</h3>
      <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Close</button>
    </div>
    <div className="flex-1 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {sl.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => { onSelect(i); onClose(); }}
            className={`rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.03] ${
              i === current ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]" : "border-border/40 bg-card/60 hover:border-primary/30"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">{s.label || "Cover"}</p>
            <p className="text-xs text-foreground font-medium truncate">{s.title || "dateBetter"}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Slide {i + 1}</p>
          </motion.button>
        ))}
      </div>
    </div>
  </motion.div>
);

/* ─── Deck Viewer ─── */
const PitchDeck = () => {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("pitch_unlocked") === "1"
  );
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5]);

  const goTo = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => {
    if (current < slides.length - 1) goTo(current + 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    if (current > 0) goTo(current - 1);
  }, [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape" && isFullscreen) toggleFullscreen();
      if (e.key === "g" || e.key === "G") setShowDrawer((d) => !d);
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, isFullscreen]);

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (!isFullscreen) { setShowControls(true); return; }
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(controlsTimer.current);
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    };
    resetTimer();
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    return () => {
      clearTimeout(controlsTimer.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Swipe handler
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && info.velocity.x < 0) next();
    else if (info.offset.x > threshold && info.velocity.x > 0) prev();
  };

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const slide = slides[current];
  const progress = ((current + 1) / slides.length) * 100;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0, scale: 0.95 }),
  };

  return (
    <div className={`min-h-screen flex flex-col select-none relative font-poppins ${isFullscreen ? "bg-background" : ""}`}>
      <DeckBackground />

      {/* Progress bar at very top */}
      <div className="absolute top-0 left-0 right-0 z-30 h-[3px] bg-muted/20">
        <motion.div
          className="h-full bg-[image:var(--gradient-primary)] rounded-r-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Top bar */}
      <motion.div
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -60 }}
        transition={{ duration: 0.3 }}
        className="relative z-20 flex items-center justify-between px-4 md:px-8 py-3 border-b border-border/30 bg-card/40 backdrop-blur-xl"
      >
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all text-xs"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Slides</span>
          </motion.button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="w-5 h-5 rounded-md" />
            <span className="text-xs tracking-widest uppercase text-muted-foreground font-medium hidden md:inline">
              Confidential
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums font-medium">
            {current + 1} / {slides.length}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>

      {/* Slide area with drag/swipe */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-16 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ x: dragX, opacity: dragOpacity }}
            className="w-full max-w-5xl cursor-grab active:cursor-grabbing"
          >
            <Stagger>
              {slide.label && (
                <FadeUp>
                  <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4 text-center font-bold">{slide.label}</p>
                </FadeUp>
              )}
              {slide.title && (
                <FadeUp>
                  <h2 className="text-3xl md:text-5xl font-bold text-foreground text-center mb-12 leading-tight">
                    {slide.title}
                  </h2>
                </FadeUp>
              )}
              <FadeUp>{slide.content}</FadeUp>
            </Stagger>
          </motion.div>
        </AnimatePresence>

        {/* Edge click zones for navigation */}
        <button
          onClick={prev}
          className="absolute left-0 top-0 bottom-0 w-16 md:w-24 z-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-2"
          disabled={current === 0}
        >
          {current > 0 && <ChevronLeft className="w-8 h-8 text-muted-foreground/40" />}
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-0 bottom-0 w-16 md:w-24 z-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-2"
          disabled={current === slides.length - 1}
        >
          {current < slides.length - 1 && <ChevronRight className="w-8 h-8 text-muted-foreground/40" />}
        </button>
      </div>

      {/* Bottom navigation */}
      <motion.div
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 60 }}
        transition={{ duration: 0.3 }}
        className="relative z-20 flex items-center justify-center gap-4 pb-6 pt-2"
      >
        <Button
          variant="ghost"
          size="icon"
          disabled={current === 0}
          onClick={prev}
          className="text-muted-foreground hover:text-foreground w-10 h-10 rounded-full hover:bg-muted/40"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Mini progress dots */}
        <div className="flex gap-1 items-center">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              whileHover={{ scale: 1.3 }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-primary w-7 h-2.5 shadow-[var(--shadow-glow)]"
                  : Math.abs(i - current) <= 3
                    ? "w-2 h-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                    : "w-1.5 h-1.5 bg-muted-foreground/10"
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={current === slides.length - 1}
          onClick={next}
          className="text-muted-foreground hover:text-foreground w-10 h-10 rounded-full hover:bg-muted/40"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Slide drawer */}
      <AnimatePresence>
        {showDrawer && (
          <SlideDrawer
            slides={slides}
            current={current}
            onSelect={goTo}
            onClose={() => setShowDrawer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PitchDeck;
