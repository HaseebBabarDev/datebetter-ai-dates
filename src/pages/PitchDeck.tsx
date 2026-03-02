import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const DECK_PASSWORD = "DateBetter2025";

/* ─── Slide data ─── */
const slides = [
  {
    id: 1,
    title: "DateBetter",
    subtitle: "Relationship Intelligence for Modern Dating",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
        <p className="text-2xl md:text-4xl font-light tracking-tight text-[#2d2a3e]">
          Not a dating app. A <span className="font-semibold text-[#7c5cbf]">decision engine</span>.
        </p>
        <div className="inline-block border border-[#7c5cbf]/30 rounded-full px-6 py-2 text-sm tracking-widest uppercase text-[#7c5cbf]">
          Raising $500K Pre-Seed
        </div>
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
          <p key={i} className="text-lg md:text-xl text-[#2d2a3e]/80 pl-4 border-l-2 border-[#7c5cbf]/40">{t}</p>
        ))}
        <p className="text-lg md:text-xl font-medium text-[#2d2a3e] pt-4">
          But generic AI has <span className="text-[#7c5cbf]">no memory, no structure, and no behavioral tracking</span>.
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
        <p className="text-lg text-[#2d2a3e]/70">No swiping. No matching. No engagement loops.</p>
        <p className="text-xl text-[#2d2a3e]">
          We sit <span className="font-semibold">after the match</span> — where emotional mistakes happen.
        </p>
        <div className="grid grid-cols-2 gap-6 pt-4">
          <div className="rounded-xl border border-[#e0dce8] p-6 text-center">
            <p className="text-sm uppercase tracking-wide text-[#2d2a3e]/50 mb-2">Dating Apps</p>
            <p className="text-2xl font-semibold text-[#2d2a3e]">Engagement</p>
          </div>
          <div className="rounded-xl border-2 border-[#7c5cbf] p-6 text-center bg-[#7c5cbf]/5">
            <p className="text-sm uppercase tracking-wide text-[#7c5cbf] mb-2">DateBetter</p>
            <p className="text-2xl font-semibold text-[#7c5cbf]">Decisions</p>
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
          <div key={i} className="rounded-xl border border-[#e0dce8] p-6 flex items-center gap-4">
            <span className="text-3xl">{item.icon}</span>
            <span className="text-lg text-[#2d2a3e]">{item.text}</span>
          </div>
        ))}
        <p className="col-span-2 text-lg text-[#2d2a3e]/80 pt-4 text-center">
          High-awareness women want <span className="font-semibold">logic before emotional investment</span>.
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
            <div key={i} className="flex items-center gap-3 text-lg text-[#2d2a3e]">
              <div className="w-2 h-2 rounded-full bg-[#7c5cbf] shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <div className="rounded-2xl border-2 border-[#e0dce8] bg-white/60 aspect-[9/16] max-h-[420px] flex items-center justify-center mx-auto w-full max-w-[220px]">
          <p className="text-sm text-[#2d2a3e]/40 text-center px-4">Dashboard Screenshot<br/>Placeholder</p>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    label: "Traction",
    title: "We Built It. It Works.",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {[
            { metric: "Live", label: "MVP Status" },
            { metric: "40", label: "Beta Users" },
            { metric: "10K", label: "User Capacity" },
          ].map((m, i) => (
            <div key={i} className="rounded-xl border border-[#e0dce8] p-6 text-center">
              <p className="text-3xl font-bold text-[#7c5cbf]">{m.metric}</p>
              <p className="text-sm text-[#2d2a3e]/60 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-lg text-[#2d2a3e]/80">
          <p>✓ Therapist-reviewed psychology framework</p>
          <p>✓ App Store submission in progress</p>
          <p>✓ AI marginal cost under <span className="font-semibold text-[#7c5cbf]">$0.15/user</span></p>
        </div>
        <p className="text-lg font-medium text-[#2d2a3e] border-t border-[#e0dce8] pt-6">
          We are raising to validate paid acquisition and reach $50K MRR — <span className="text-[#7c5cbf]">not to build</span>.
        </p>
      </div>
    ),
  },
  {
    id: 7,
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
              className={`rounded-xl p-8 text-center ${
                p.featured
                  ? "border-2 border-[#7c5cbf] bg-[#7c5cbf]/5 scale-105"
                  : "border border-[#e0dce8]"
              }`}
            >
              <p className="text-sm uppercase tracking-wide text-[#2d2a3e]/50 mb-3">{p.tier}</p>
              <p className={`text-3xl font-bold ${p.featured ? "text-[#7c5cbf]" : "text-[#2d2a3e]"}`}>
                {p.price}
              </p>
              <p className="text-xs text-[#2d2a3e]/40 mt-1">/month</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-xl text-[#2d2a3e]">
            Modeled blended ARPU: <span className="font-bold text-[#7c5cbf]">$15</span>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    label: "Unit Economics",
    title: "Platform-Adjusted Unit Economics",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto">
        <p className="text-sm text-[#2d2a3e]/60 text-center">Both Apple fee scenarios modeled</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border-2 border-[#7c5cbf] p-6 bg-[#7c5cbf]/5">
            <p className="text-sm font-medium text-[#7c5cbf] mb-4">15% Fee — Year 1 (Small Business)</p>
            <div className="space-y-2 text-[#2d2a3e]">
              <p>$15 ARPU → $12.75 net</p>
              <p>$12.25 contribution</p>
              <p className="text-2xl font-bold text-[#7c5cbf]">82% margin</p>
            </div>
          </div>
          <div className="rounded-xl border border-[#e0dce8] p-6">
            <p className="text-sm font-medium text-[#2d2a3e]/60 mb-4">30% Fee — Worst Case (&gt;$1M)</p>
            <div className="space-y-2 text-[#2d2a3e]">
              <p>$15 ARPU → $10.50 net</p>
              <p>$10.00 contribution</p>
              <p className="text-2xl font-bold text-[#2d2a3e]">67% margin</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-[#2d2a3e]/60 text-center">
          AI cost: $0.15/user · Payment + overhead: $0.35/user · Margin expands as model pricing drops
        </p>
      </div>
    ),
  },
  {
    id: 9,
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
            <div key={i} className="flex items-center justify-between rounded-xl border border-[#e0dce8] p-5">
              <span className="font-medium text-[#2d2a3e]">{c.channel}</span>
              <div className="flex gap-6 text-sm text-[#2d2a3e]/70">
                <span>{c.budget}</span>
                <span>CPA {c.cpa}</span>
                <span className="font-semibold text-[#7c5cbf]">{c.users} users</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-[#7c5cbf]/5 border border-[#7c5cbf]/20 p-6 text-center">
          <p className="text-xl text-[#2d2a3e]">
            Total: <span className="font-bold text-[#7c5cbf]">8,618 users</span> Year 1 · Blended CPA ~$44
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    label: "Capital",
    title: "Capital Deployment & Scenarios",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {[
            { amount: "$75K", label: "Final polish + launch" },
            { amount: "$300K", label: "CAC validation + growth" },
            { amount: "$125K", label: "Runway + contingency" },
          ].map((d, i) => (
            <div key={i} className="rounded-xl border border-[#e0dce8] p-5 text-center">
              <p className="text-2xl font-bold text-[#7c5cbf]">{d.amount}</p>
              <p className="text-xs text-[#2d2a3e]/60 mt-1">{d.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[
            { scenario: "Conservative ($55 CPA)", mrr: "~$50K MRR", color: "text-[#2d2a3e]/70" },
            { scenario: "Base Case ($44 CPA)", mrr: "~$77K MRR → $930K ARR", color: "text-[#7c5cbf] font-semibold" },
            { scenario: "Upside ($30 CPA)", mrr: "~$100K+ MRR", color: "text-[#2d2a3e]/70" },
          ].map((s, i) => (
            <div key={i} className="flex justify-between items-center border-b border-[#e0dce8] pb-3">
              <span className="text-[#2d2a3e]">{s.scenario}</span>
              <span className={s.color}>{s.mrr}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-center text-[#2d2a3e]/60">
          Cash-flow positive by Month 12 at base case with capital remaining.
        </p>
      </div>
    ),
  },
  {
    id: 11,
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
            <div key={i} className="rounded-xl border border-[#e0dce8] p-6 flex items-center gap-4">
              <span className="text-3xl">{d.icon}</span>
              <span className="text-lg text-[#2d2a3e]">{d.text}</span>
            </div>
          ))}
        </div>
        <p className="text-xl text-center text-[#2d2a3e] font-medium pt-4">
          Generic AI <span className="text-[#7c5cbf]">cannot replicate</span> structured historical user data.
        </p>
      </div>
    ),
  },
  {
    id: 12,
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
          <div key={i} className="flex items-center gap-4 text-xl text-[#2d2a3e]">
            <div className="w-8 h-8 rounded-full bg-[#7c5cbf]/10 flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#7c5cbf]" />
            </div>
            {t}
          </div>
        ))}
        <p className="text-xl font-semibold text-[#7c5cbf] text-center pt-8">
          Relationship intelligence is an emerging category.
        </p>
      </div>
    ),
  },
  {
    id: 13,
    label: "Valuation",
    title: "$500K for 15% Equity",
    content: (
      <div className="space-y-6 max-w-3xl mx-auto text-center">
        <p className="text-3xl font-light text-[#2d2a3e]">
          ~<span className="font-bold text-[#7c5cbf]">$3.3M</span> post-money
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {[
            "Live product",
            "Therapist-reviewed",
            "10K infrastructure",
            "67–82% margin",
          ].map((v, i) => (
            <div key={i} className="rounded-xl border border-[#7c5cbf]/20 bg-[#7c5cbf]/5 p-4">
              <p className="text-sm font-medium text-[#7c5cbf]">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-[#2d2a3e]/70 pt-4">
          Capital accelerates <span className="font-semibold">scale</span> — not development.
        </p>
      </div>
    ),
  },
  {
    id: 14,
    label: "The Ask",
    title: "The Ask",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center max-w-2xl mx-auto">
        <p className="text-3xl md:text-4xl font-light text-[#2d2a3e]">
          Raising <span className="font-bold text-[#7c5cbf]">$500K</span>
        </p>
        <p className="text-xl text-[#2d2a3e]/70">12–15 month runway. Focused on CAC validation and early scale.</p>
        <div className="w-24 h-px bg-[#7c5cbf]/30" />
        <p className="text-2xl font-semibold text-[#2d2a3e]">
          We are building the operating system for <span className="text-[#7c5cbf]">relationship decisions</span>.
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
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl border border-[#e0dce8] bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#7c5cbf]/10 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[#7c5cbf]" />
            </div>
            <h1 className="text-xl font-semibold text-[#2d2a3e]">DateBetter Pitch Deck</h1>
            <p className="text-sm text-[#2d2a3e]/50 mt-1">Enter password to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false); }}
                placeholder="Password"
                className="pr-10 bg-[#FAF9F6] border-[#e0dce8]"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2d2a3e]/40 hover:text-[#2d2a3e]"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500">Incorrect password</p>}
            <Button
              type="submit"
              disabled={!pw}
              className="w-full bg-[#7c5cbf] hover:bg-[#6a4daa] text-white"
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

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const slide = slides[current];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-[#e0dce8]/60">
        <button
          onClick={() => navigate("/")}
          className="text-[#2d2a3e]/40 hover:text-[#2d2a3e] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs tracking-widest uppercase text-[#2d2a3e]/30 font-medium">
          DateBetter · Confidential
        </span>
        <span className="text-xs text-[#2d2a3e]/40 tabular-nums">
          {current + 1} / {slides.length}
        </span>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-hidden">
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
              <p className="text-xs uppercase tracking-[0.2em] text-[#7c5cbf] mb-3 text-center">{slide.label}</p>
            )}
            <h2 className="text-2xl md:text-4xl font-semibold text-[#2d2a3e] text-center mb-10 leading-tight">
              {slide.title}
            </h2>
            {slide.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <Button
          variant="ghost"
          size="icon"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
          className="text-[#2d2a3e]/50 hover:text-[#2d2a3e]"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Dots */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? "bg-[#7c5cbf] w-6" : "bg-[#2d2a3e]/15 hover:bg-[#2d2a3e]/30"
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={current === slides.length - 1}
          onClick={() => setCurrent((c) => c + 1)}
          className="text-[#2d2a3e]/50 hover:text-[#2d2a3e]"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Keyboard nav */}
      <KeyboardNav current={current} setCurrent={setCurrent} total={slides.length} />
    </div>
  );
};

function KeyboardNav({
  current,
  setCurrent,
  total,
}: {
  current: number;
  setCurrent: React.Dispatch<React.SetStateAction<number>>;
  total: number;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrent((c) => Math.min(c + 1, total - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrent((c) => Math.max(c - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCurrent, total]);
  return null;
}

export default PitchDeck;
