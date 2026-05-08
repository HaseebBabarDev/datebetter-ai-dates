import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Eye, EyeOff, ChevronLeft, ChevronRight, ArrowLeft, Maximize2, Minimize2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-db.png";
import logoTransparent from "@/assets/logo-transparent.png";
import datebetterTextLogo from "@/assets/datebetter-text-logo.png";
import { IPhoneMockup } from "@/components/website/IPhoneMockup";
import { ScreenshotDemo } from "@/components/website/ScreenshotDemo";
import { CompatibilityDemo } from "@/components/website/CompatibilityDemo";
import { ChatDemo } from "@/components/website/ChatDemo";
import { HealingScoreDemo } from "@/components/website/HealingScoreDemo";

const DECK_PASSWORD = "DateBetter2025";

/* ─── Track view ─── */
const trackView = async (slidesViewed = 1) => {
  try {
    const sessionId = sessionStorage.getItem("pitch_session_id") || crypto.randomUUID();
    sessionStorage.setItem("pitch_session_id", sessionId);
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-pitch-view`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ session_id: sessionId, slides_viewed: slidesViewed }),
      }
    );
  } catch {
    // silent fail
  }
};

/* ─── Simple fade animation ─── */
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Slide data — Shaan Puri storytelling format ─── */
const slides = [
  // 1. Company Name / Subtitle
  {
    id: 1,
    content: (
      <div className="flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-4 px-4">
          <motion.h1 
            className="font-black leading-none"
            style={{ 
              fontSize: "clamp(60px, 14vw, 240px)",
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(160, 60%, 40%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            dateBetter
          </motion.h1>

          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground font-light max-w-xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            AI-powered relationship intelligence for modern dating.
          </motion.p>
          
          <motion.span 
            className="text-sm text-muted-foreground/60 font-medium uppercase tracking-[0.2em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            Investor Deck · 2026
          </motion.span>
        </div>
      </div>
    ),
  },
  // 2. Problem
  {
    id: 2,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">Apps swipe. Nobody <span className="text-primary">navigates</span>.</h2>
        <div className="space-y-4 text-xl md:text-2xl text-muted-foreground">
          <p>Tinder, Hinge, Bumble — built to <span className="font-bold text-foreground">find</span> people. Zero help once you do.</p>
          <p>So daters take their texts, screenshots, and confusion to <span className="font-bold text-primary">ChatGPT</span> — an AI with no memory, no patterns, no dating context.</p>
          <p className="font-medium text-foreground">The behavior is here. The product isn't.</p>
        </div>
      </div>
    ),
  },
  // 3. Product
  {
    id: 3,
    content: (
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">Meet <span className="text-primary">D.E.V.I.</span></h2>
        <p className="text-xl md:text-2xl text-muted-foreground mb-2">Knows you. Analyzes them. Spots the patterns. <span className="text-foreground font-medium">Coaches you in real time.</span></p>
        <div className="grid grid-cols-4 gap-3 items-start">
          {[
            { label: "Screenshot Analysis", Demo: ScreenshotDemo },
            { label: "Compatibility Engine", Demo: CompatibilityDemo },
            { label: "Healing Journey", Demo: HealingScoreDemo },
            { label: "D.E.V.I. Chat", Demo: ChatDemo },
          ].map(({ label, Demo }) => (
            <div key={label} className="flex flex-col items-center">
              <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-wider">{label}</p>
              <div className="scale-[0.48] origin-top -mb-44"><IPhoneMockup><Demo /></IPhoneMockup></div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 4. Market
  {
    id: 4,
    content: (
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">Massive. Underserved.</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border/50 p-5 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">TAM</p>
            <p className="text-3xl md:text-4xl font-black text-primary">$17.3B<sup className="text-xs">1</sup></p>
            <p className="text-sm text-muted-foreground">Global dating market by 2030</p>
          </div>
          <div className="rounded-2xl border border-border/50 p-5 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">SAM</p>
            <p className="text-3xl md:text-4xl font-black text-foreground">122M<sup className="text-xs">2</sup></p>
            <p className="text-sm text-muted-foreground">U.S. online daters in 2025</p>
          </div>
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 space-y-2">
            <p className="text-xs uppercase tracking-wider text-primary font-bold">SOM</p>
            <p className="text-3xl md:text-4xl font-black bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">80%<sup className="text-xs">3</sup></p>
            <p className="text-sm text-muted-foreground">Gen Z & Millennials burned out</p>
          </div>
        </div>
        <p className="text-xl text-muted-foreground text-center pt-2">Dating apps own the match. <span className="text-foreground font-medium">We own what happens after.</span></p>
        <p className="text-[10px] text-muted-foreground/70 text-center pt-4 leading-relaxed">
          <sup>1</sup> Mordor Intelligence, Online Dating Services Market Forecast (2025) &nbsp;·&nbsp;
          <sup>2</sup> Statista, U.S. Online Dating Users Forecast (March 2025) &nbsp;·&nbsp;
          <sup>3</sup> Forbes Health Dating App Burnout Survey (2024) — confirmed by Hily T.R.U.T.H. Report (2026)
        </p>
      </div>
    ),
  },
  // 5. Traction
  {
    id: 5,
    content: (
      <div className="max-w-3xl mx-auto space-y-8 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">Already built. Already live.</h2>
        <div className="grid grid-cols-3 gap-8 py-4">
          {[
            { metric: "40", label: "Beta Users", accent: true },
            { metric: "10K", label: "Infra Ready" },
            { metric: "67–82%", label: "Margins" },
          ].map((m, i) => (
            <div key={i}>
              <p className={`text-5xl md:text-6xl font-black ${m.accent ? "text-primary" : "text-foreground"}`}>{m.metric}</p>
              <p className="text-sm text-muted-foreground mt-2">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xl md:text-2xl text-muted-foreground">We're raising to <span className="text-primary font-bold">scale</span>, not build.</p>
      </div>
    ),
  },
  // 6. Team
  {
    id: 6,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">The team.</h2>
        <div className="space-y-4 text-xl md:text-2xl text-muted-foreground">
          <p>We've <span className="font-bold text-foreground">built and launched apps before</span> — including <span className="font-bold text-primary">Good Fitness</span>, a top women's app in the App Store.</p>
          <p>Operators who ship. Marketers who acquire. A therapist-reviewed psychology framework.</p>
          <p className="text-foreground font-medium">We know how to take a consumer app from <span className="text-primary font-bold">zero to category leader</span>.</p>
        </div>
      </div>
    ),
  },
  // 6b. Moat
  {
    id: 9,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">The moat.</h2>
        <div className="space-y-4 text-xl md:text-2xl text-muted-foreground">
          <p>Every interaction logged becomes <span className="font-bold text-primary">structured behavioral data</span> — candidate profiles, patterns, outcomes — that compounds per user, per month.</p>
          <p>ChatGPT forgets. <span className="font-bold text-foreground">D.E.V.I. remembers</span> — and gets sharper the longer you use it.</p>
          <p>A therapist-reviewed psychology framework + a proprietary scoring engine generic AI <span className="font-bold text-primary">can't replicate</span>.</p>
          <p className="text-foreground font-medium">Switching cost grows with every message. That's the moat.</p>
        </div>
      </div>
    ),
  },
  // 7. Model + 12 months
  {
    id: 7,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">The model.</h2>
        <p className="text-xl md:text-2xl text-muted-foreground">
          <span className="font-bold text-foreground">$15/mo Unlimited</span> — single plan. Add-ons (Detachment, Text Simulator) are pure upside.
        </p>
        <div className="grid grid-cols-3 gap-8 text-center pt-2">
          {[
            { metric: "$30K", label: "MRR by Month 12", accent: true },
            { metric: "2,000", label: "Net Paid @ $15" },
            { metric: "$44", label: "Blended CPA" },
          ].map((m, i) => (
            <div key={i}>
              <p className={`text-3xl md:text-4xl font-black ${m.accent ? "text-primary" : "text-foreground"}`}>{m.metric}</p>
              <p className="text-sm text-muted-foreground mt-2">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-muted-foreground text-center">$360K ARR base case. Seed-ready by Month 18.</p>
      </div>
    ),
  },
  // 8. Ask
  {
    id: 8,
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-5 text-center max-w-2xl mx-auto">
        <motion.img src={logo} alt="DateBetter" className="w-14 h-14 rounded-2xl shadow-lg ring-2 ring-primary/20" whileHover={{ scale: 1.05 }} />
        <h2 className="text-4xl md:text-6xl font-black leading-tight">
          <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">$500K · 15%</span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground">~$3.3M post-money · 18-month runway</p>
        <div className="grid grid-cols-3 gap-4 w-full pt-2">
          {[
            { pct: "55%", label: "Paid Acquisition", sub: "~2,000 net paid @ $15/mo" },
            { pct: "30%", label: "Product & AI", sub: "D.E.V.I. engine + iOS/Android" },
            { pct: "15%", label: "Ops & Runway", sub: "Compliance, support, buffer" },
          ].map((m, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 space-y-1">
              <p className="text-2xl md:text-3xl font-black text-primary">{m.pct}</p>
              <p className="text-sm font-bold text-foreground">{m.label}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{m.sub}</p>
            </div>
          ))}
        </div>
        <div className="w-full rounded-xl border-2 border-primary/40 bg-primary/5 p-4 mt-2">
          <p className="text-[11px] uppercase tracking-wider text-primary font-bold mb-2">Pre-Seed Payback Path (Conservative)</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl md:text-2xl font-black text-foreground">2×</p>
              <p className="text-[10px] text-muted-foreground">Mark-up at Seed (~18mo)</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black text-foreground">4–6×</p>
              <p className="text-[10px] text-muted-foreground">Series A (~36mo)</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">8–15×</p>
              <p className="text-[10px] text-muted-foreground">Exit / Acquisition</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/80 text-center pt-2">Base case: $15/mo only, no add-ons. $360K ARR → Seed at ~$6M post → Series A at ~$15M.</p>
        </div>
        <p className="text-base text-foreground font-medium max-w-md pt-1">Relationship intelligence has no leader yet. <span className="text-primary font-bold">We intend to be it.</span></p>
        <p className="text-xs text-foreground font-bold">datebetterapp.com · nakita@datebetterapp.com</p>
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
      trackView(1);
      onUnlock();
    } else {
      setError(true);
      setPw("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background font-poppins">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border/60 bg-card p-10 shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="DateBetter" className="w-16 h-16 rounded-xl shadow-md mb-5" />
            <h1 className="text-xl font-black text-foreground">DateBetter Pitch Deck</h1>
            <p className="text-sm text-muted-foreground mt-2">Enter password to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false); }}
                placeholder="Password"
                className="pr-10 h-12 rounded-xl"
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
            <Button type="submit" disabled={!pw} className="w-full h-12 rounded-xl text-base font-semibold">
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
    className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col font-poppins"
    onClick={onClose}
  >
    <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
      <h3 className="text-lg font-black text-foreground">All Slides</h3>
      <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
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
              i === current ? "border-foreground bg-foreground/5" : "border-border/40 hover:border-foreground/30"
            }`}
          >
            <p className="text-xs text-foreground font-medium truncate">Slide {i + 1}</p>
          </motion.button>
        ))}
      </div>
    </div>
  </motion.div>
);

/* ─── Deck Viewer ─── */
const PitchDeck = () => {
  const navigate = useNavigate();
  const [unlocked] = useState(true);
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

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && info.velocity.x < 0) next();
    else if (info.offset.x > threshold && info.velocity.x > 0) prev();
  };

  

  const slide = slides[current];
  const progress = ((current + 1) / slides.length) * 100;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <div className={`min-h-screen flex flex-col select-none relative font-poppins bg-background`}>
      {/* Subtle warm background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/[0.02] blur-[100px]" />
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-30 h-[2px] bg-border/20">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Top bar — minimal */}
      <motion.div
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -60 }}
        transition={{ duration: 0.3 }}
        className="relative z-20 flex items-center justify-between px-4 md:px-8 py-3"
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
          </motion.button>
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

      {/* Slide area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 md:px-20 py-8 md:py-16 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ x: dragX, opacity: dragOpacity }}
            className="w-full max-w-5xl cursor-grab active:cursor-grabbing"
          >
            <FadeIn key={slide.id}>{slide.content}</FadeIn>
          </motion.div>
        </AnimatePresence>

        {/* Edge click zones */}
        <button
          onClick={prev}
          className="absolute left-0 top-0 bottom-0 w-16 md:w-24 z-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-2"
          disabled={current === 0}
        >
          {current > 0 && <ChevronLeft className="w-8 h-8 text-muted-foreground/30" />}
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-0 bottom-0 w-16 md:w-24 z-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-2"
          disabled={current === slides.length - 1}
        >
          {current < slides.length - 1 && <ChevronRight className="w-8 h-8 text-muted-foreground/30" />}
        </button>
      </div>

      {/* Bottom navigation — minimal dots */}
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
          className="text-muted-foreground hover:text-foreground w-10 h-10 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex gap-1.5 items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-primary w-6 h-2"
                  : "w-1.5 h-1.5 bg-primary/20 hover:bg-primary/40"
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={current === slides.length - 1}
          onClick={next}
          className="text-muted-foreground hover:text-foreground w-10 h-10 rounded-full"
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
