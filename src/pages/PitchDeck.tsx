import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Eye, EyeOff, ChevronLeft, ChevronRight, ArrowLeft, Maximize2, Minimize2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpg";
import logoTransparent from "@/assets/logo-transparent.png";
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
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
        
        <motion.img 
          src={logoTransparent} 
          alt="DateBetter" 
          className="w-24 h-24 relative z-10 drop-shadow-lg" 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        
        <div className="relative z-10 space-y-4">
          <motion.h2 
            className="text-6xl md:text-8xl font-black tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">DateBetter</span>
          </motion.h2>
          
          <motion.div 
            className="w-20 h-1 mx-auto rounded-full bg-primary/40"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
          
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground font-light max-w-xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            AI-powered relationship intelligence for modern dating.
          </motion.p>
          
          <motion.p 
            className="text-sm text-muted-foreground/60 font-medium uppercase tracking-[0.2em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Investor Deck · 2025
          </motion.p>
        </div>
      </div>
    ),
  },
  // 2. A bit of credibility
  {
    id: 2,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">A quick intro.</h2>
        <div className="space-y-5 text-lg md:text-xl text-foreground/80">
          <p>Live product with <span className="font-bold text-primary">40 beta users</span> on a working MVP.</p>
          <p>Infrastructure built to support <span className="font-bold text-primary">10,000 users</span> — no rebuild needed.</p>
          <p>Therapist-reviewed psychology framework.</p>
          <p><span className="font-bold text-primary">67–82% margins</span> modeled under both Apple fee scenarios.</p>
        </div>
      </div>
    ),
  },
  // 3. The Problem — data/personal story
  {
    id: 3,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">Women are already using AI for dating advice.</h2>
        <div className="space-y-5 text-lg md:text-xl text-muted-foreground">
          <p>They paste texts into ChatGPT. They crowdsource red flags on Reddit. They bring early dating confusion into <span className="font-bold text-primary">$200/hour therapy sessions</span>.</p>
          <p className="font-medium text-foreground">The behavior is already there — the infrastructure isn't.</p>
        </div>
      </div>
    ),
  },
  // 4. How they solve it today (icky)
  {
    id: 4,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">How they solve it today...</h2>
        <div className="space-y-4 text-lg md:text-xl text-muted-foreground">
          {["No memory across sessions", "No behavioral pattern detection", "No structured decision framework", "No compatibility scoring", "No dating-specific context"].map((gap, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
              <p>{gap}</p>
            </div>
          ))}
          <p className="text-foreground font-medium pt-4">Generic AI gives generic advice. Dating decisions need <span className="text-primary">structured intelligence</span>.</p>
        </div>
      </div>
    ),
  },
  // 5. What if instead...
  {
    id: 5,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">What if instead...</h2>
        <p className="text-xl md:text-2xl text-muted-foreground">You had an AI that <span className="font-bold text-primary">remembers every conversation</span>, tracks behavioral patterns across candidates, scores compatibility with real evidence, and tells you when something doesn't add up.</p>
        <p className="text-xl md:text-2xl text-foreground font-medium">Not a chatbot. A behavioral operating system for your dating life.</p>
      </div>
    ),
  },
  // 6. That's us. Show the product.
  {
    id: 6,
    content: (
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">That's us.</h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-2">Meet <span className="font-bold text-primary">D.E.V.I.</span> — she logs every interaction, maintains memory, detects patterns, and scores compatibility.</p>
        <div className="grid grid-cols-4 gap-3 items-start">
          {[
            { label: "Screenshot Analysis", Demo: ScreenshotDemo },
            { label: "Compatibility Engine", Demo: CompatibilityDemo },
            { label: "Healing Journey", Demo: HealingScoreDemo },
            { label: "D.E.V.I. Chat", Demo: ChatDemo },
          ].map(({ label, Demo }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-wider">{label}</p>
              <div className="scale-[0.48] origin-top -mb-44"><IPhoneMockup><Demo /></IPhoneMockup></div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 7. State the dream
  {
    id: 7,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">We're building the <span className="text-primary">operating system</span> for relationship decisions.</h2>
        <div className="space-y-5 text-lg md:text-xl text-muted-foreground">
          <p>Dating apps create users. We monetize the <span className="font-bold text-foreground">intelligence layer</span> that comes after the match.</p>
          <p>The <span className="font-bold text-primary">$5B+ dating app market</span> generates our demand. We own the decision space nobody else is building for.</p>
        </div>
      </div>
    ),
  },
  // 8. Traction / "So far, so good..."
  {
    id: 8,
    content: (
      <div className="max-w-3xl mx-auto space-y-8 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">So far, so good.</h2>
        <div className="grid grid-cols-3 gap-8 py-4">
          {[
            { metric: "40", label: "Beta Users", accent: true },
            { metric: "10K", label: "Ready Infrastructure" },
            { metric: "$0.15", label: "AI Cost / User" },
          ].map((m, i) => (
            <div key={i}>
              <p className={`text-5xl md:text-6xl font-black ${m.accent ? "text-primary" : "text-foreground"}`}>{m.metric}</p>
              <p className="text-sm text-muted-foreground mt-2">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-muted-foreground">Live product. Real users. Therapist-reviewed framework. App Store submission in progress.</p>
      </div>
    ),
  },
  // 9. Differentiated approach
  {
    id: 9,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">We don't compete with Bumble.</h2>
        <div className="grid grid-cols-2 gap-8 text-center">
          <div className="space-y-3 rounded-2xl border border-border/50 p-6">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">Dating Apps</p>
            <p className="text-3xl font-black text-foreground">Engagement</p>
            <p className="text-base text-muted-foreground">More swipes. More time in-app.<br />Success = sessions.</p>
          </div>
          <div className="space-y-3 rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
            <p className="text-sm uppercase tracking-wider text-primary font-bold">DateBetter</p>
            <p className="text-3xl font-black bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">Decisions</p>
            <p className="text-base text-muted-foreground">Better clarity. Better choices.<br />Success = relationships.</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground text-center">We sit <span className="font-bold text-foreground">after the match</span> — in the emotionally volatile space where real decisions happen.</p>
      </div>
    ),
  },
  // 10. Bigger trend / wave
  {
    id: 10,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">The wave we're riding.</h2>
        <div className="space-y-5 text-lg md:text-xl text-muted-foreground">
          <p><span className="font-bold text-primary">AI is normalized</span> — consumers already use it for personal advice.</p>
          <p><span className="font-bold text-primary">Therapy demand is surging</span> — supply is constrained by cost and access.</p>
          <p><span className="font-bold text-primary">Dating burnout is real</span> — users want depth and clarity, not more matches.</p>
          <p><span className="font-bold text-primary">Self-optimization is mainstream</span> — fitness, finance, and now relationships.</p>
        </div>
      </div>
    ),
  },
  // 11. Why now?
  {
    id: 11,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">Why now?</h2>
        <div className="space-y-5 text-lg md:text-xl text-muted-foreground">
          <p>AI model costs are dropping <span className="font-bold text-primary">quarterly</span> — making behavioral AI affordable at scale for the first time.</p>
          <p>ChatGPT normalized AI for personal advice — but <span className="font-bold text-foreground">nobody has built the vertical product</span> for dating decisions.</p>
          <p>Relationship intelligence is an emerging category. The window to <span className="font-bold text-primary">define and own it</span> is open now.</p>
        </div>
      </div>
    ),
  },
  // 12. Why you?
  {
    id: 12,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">Why us?</h2>
        <div className="space-y-5 text-lg md:text-xl text-muted-foreground">
          <p>We already <span className="font-bold text-foreground">built the product</span>. Live MVP. Real users. Working AI pipeline.</p>
          <p>We modeled <span className="font-bold text-foreground">both Apple fee scenarios</span> transparently — 67% margin at worst case, 82% at best.</p>
          <p>Infrastructure is ready for <span className="font-bold text-foreground">10,000 users</span> without an architectural rebuild.</p>
          <p className="font-medium text-foreground">We are not raising to build. We are raising to <span className="text-primary font-bold">scale</span>.</p>
        </div>
      </div>
    ),
  },
  // 13. Where will we be with this money?
  {
    id: 13,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">Where we'll be in 12 months.</h2>
        <div className="grid grid-cols-3 gap-8 text-center py-4">
          {[
            { metric: "$50K–$100K", label: "Monthly Recurring Revenue", accent: true },
            { metric: "8,600+", label: "Paid Users" },
            { metric: "$44", label: "Blended CPA" },
          ].map((m, i) => (
            <div key={i}>
              <p className={`text-3xl md:text-4xl font-black ${m.accent ? "text-primary" : "text-foreground"}`}>{m.metric}</p>
              <p className="text-sm text-muted-foreground mt-2">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3 text-lg text-muted-foreground">
          <p><span className="font-bold text-primary">$300K</span> → CAC validation across 3 channels (Meta, TikTok, AppLovin, Creator)</p>
          <p><span className="font-bold text-primary">$75K</span> → Product polish + App Store launch</p>
          <p><span className="font-bold text-primary">$125K</span> → Runway extension + contingency</p>
        </div>
      </div>
    ),
  },
  // 14. Sweeten the pot
  {
    id: 14,
    content: (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight">A few more things.</h2>
        <div className="space-y-5 text-lg md:text-xl text-muted-foreground">
          <p>Every interaction logged compounds into <span className="font-bold text-primary">structured behavioral data</span> — a moat generic AI cannot replicate.</p>
          <p>Subscription SaaS at <span className="font-bold text-foreground">$9.99 / $15.99 / $29.99</span> per month. Blended ARPU: <span className="font-bold text-primary">$15</span>.</p>
          <p>Cash-flow positive by <span className="font-bold text-primary">Month 12</span> at base case with capital remaining.</p>
          <p>Creator/affiliate channel offers the most efficient CPA at <span className="font-bold text-primary">$25/user</span>.</p>
        </div>
      </div>
    ),
  },
  // 15. The Ask / CTA
  {
    id: 15,
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-2xl mx-auto">
        <motion.img src={logo} alt="DateBetter" className="w-16 h-16 rounded-2xl shadow-lg ring-2 ring-primary/20" whileHover={{ scale: 1.05 }} />
        <h2 className="text-4xl md:text-5xl font-black leading-tight">
          <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">$500K for 15% equity.</span>
        </h2>
        <p className="text-xl text-muted-foreground">~$3.3M post-money valuation.</p>
        <div className="w-16 h-px bg-primary/30 my-2" />
        <p className="text-lg text-muted-foreground max-w-md">Relationship intelligence doesn't have a market leader yet. We intend to be it.</p>
        <p className="text-base text-foreground font-bold mt-4">datebetterapp.com</p>
        <p className="text-sm text-muted-foreground">nakita@datebetterapp.com</p>
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

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

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
                  ? "bg-foreground w-6 h-2"
                  : "w-1.5 h-1.5 bg-foreground/20 hover:bg-foreground/40"
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
