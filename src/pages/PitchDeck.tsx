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

const DECK_PASSWORD = "DB2025Invest";

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

/* ─── Info badge ─── */
const InfoBadge = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm px-4 py-3">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
    <p className="text-sm font-bold text-foreground">{value}</p>
  </div>
);

/* ─── Slide data — rebuilt from Gamma deck ─── */
const slides = [
  {
    id: 1,
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.img src={logo} alt="DateBetter" className="w-24 h-24 rounded-3xl shadow-[var(--shadow-elegant)] ring-2 ring-primary/20" whileHover={{ scale: 1.05, rotate: 2 }} />
        <h2 className="text-4xl md:text-6xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent leading-tight tracking-tight">DateBetter</h2>
        <p className="text-xl md:text-2xl font-light text-foreground/80 max-w-xl leading-relaxed">Relationship Intelligence for Modern Dating</p>
        <div className="w-20 h-px bg-primary/30 my-1" />
        <p className="text-lg text-muted-foreground max-w-md">Not a dating app. A <span className="font-semibold text-primary">decision engine</span>.</p>
        <Pill>Raising $500K Pre-Seed</Pill>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 w-full max-w-2xl">
          {[{ l: "Product", v: "Live MVP" }, { l: "Margin", v: "67–82%" }, { l: "Infrastructure", v: "10K Users" }, { l: "Risk", v: "Low Technical" }].map((b) => (
            <InfoBadge key={b.l} label={b.l} value={b.v} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2, label: "Behavioral Shift", title: "AI Is Already Being Used for Dating Decisions.",
    content: (
      <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto items-start">
        <div className="space-y-5">
          {["Women paste texts into ChatGPT.", "They crowdsource red flags on Reddit.", "They bring early dating confusion into therapy sessions that cost $200 an hour."].map((t, i) => (
            <motion.p key={i} whileHover={{ x: 6 }} className="text-lg text-foreground/80 pl-4 border-l-2 border-primary/40 cursor-default">{t}</motion.p>
          ))}
          <p className="text-lg font-medium text-foreground pt-2">The behavior is already there — <span className="text-primary">the infrastructure isn't</span>.</p>
        </div>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">The Gap</p>
          {["No memory across sessions", "No behavioral pattern detection", "No structured decision framework", "No compatibility scoring", "No dating-specific context"].map((g, i) => (
            <motion.div key={i} whileHover={{ scale: 1.02 }} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm px-4 py-3 cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
              <span className="text-sm text-foreground">{g}</span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 3, label: "Positioning", title: "We Do Not Compete With Bumble.",
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">DateBetter occupies an entirely different category. No swiping. No matching. No engagement loops. We sit <span className="font-semibold text-foreground">after the match</span> — in the emotionally volatile space where real decisions happen.</p>
        <div className="grid grid-cols-2 gap-6">
          <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-border/60 p-8 text-center bg-card/60 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Dating Apps</p>
            <p className="text-2xl font-bold text-foreground mb-2">Engagement</p>
            <p className="text-sm text-muted-foreground">More swipes. More matches. More time in-app.</p>
            <p className="text-xs text-muted-foreground mt-3 font-medium">Success = sessions</p>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="rounded-2xl border-2 border-primary p-8 text-center bg-primary/5 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-wider text-primary mb-3">DateBetter</p>
            <p className="text-2xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent mb-2">Decisions</p>
            <p className="text-sm text-foreground/80">Better clarity. Better choices. Better outcomes.</p>
            <p className="text-xs text-primary mt-3 font-medium">Success = relationships</p>
          </motion.div>
        </div>
        <p className="text-sm text-muted-foreground text-center">The <span className="font-semibold text-foreground">$5B+ dating app market</span> creates our users. We monetize the intelligence layer that comes next.</p>
      </div>
    ),
  },
  {
    id: 4, label: "Problem", title: "Modern Dating Is Emotionally Reactive.",
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: "💬", title: "Overanalyzing Texts", desc: "Hours spent dissecting message timing, word choice, and tone with no structured framework to interpret signals accurately." },
            { icon: "🚩", title: "Ignoring Red Flags", desc: "Early behavioral cues get rationalized away. Attachment forms before clarity. The emotional cost compounds over time." },
            { icon: "😩", title: "Decision Fatigue", desc: "Repeated cycles of confusion, burnout, and misaligned investment drain high-functioning women who should know better." },
          ].map((item, i) => (
            <motion.div key={i} whileHover={{ y: -6 }} className="rounded-2xl border border-border/40 p-6 bg-card/60 backdrop-blur-sm cursor-default">
              <span className="text-3xl block mb-3">{item.icon}</span>
              <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-lg text-center text-foreground font-medium max-w-2xl mx-auto">High-awareness women want <span className="text-primary">logic before emotional investment</span>. They are already seeking structure. DateBetter gives it to them.</p>
      </div>
    ),
  },
  {
    id: 5, label: "Solution", title: "Meet D.E.V.I.",
    content: (
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">D.E.V.I. is not a chatbot. It is a <span className="font-semibold text-foreground">behavioral operating system</span> for your dating life — persistent, structured, and pattern-aware across every interaction you log.</p>
          {[
            { title: "Logs Dating Interactions", desc: "Every conversation, date, and behavior is captured with context." },
            { title: "Maintains Memory", desc: "Cross-session continuity means insights compound over time — not reset." },
            { title: "Detects Behavioral Patterns", desc: "Identifies consistency, inconsistency, and alignment with stated values." },
            { title: "Compatibility Scoring", desc: "Generates structured scores based on logged behavioral evidence." },
          ].map((f, i) => (
            <motion.div key={i} whileHover={{ x: 4 }} className="flex items-start gap-3 cursor-default">
              <div className="w-2 h-2 mt-2 rounded-full bg-[image:var(--gradient-primary)] shrink-0" />
              <div><p className="text-sm font-semibold text-foreground">{f.title}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center scale-[0.65] origin-center"><IPhoneMockup><ScreenshotDemo /></IPhoneMockup></div>
      </div>
    ),
  },
  {
    id: 6, label: "Product Demo", title: "See It In Action",
    content: (
      <div className="grid md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
        {[{ label: "Screenshot Analysis", Demo: ScreenshotDemo }, { label: "Compatibility Engine", Demo: CompatibilityDemo }, { label: "D.E.V.I. Chat", Demo: ChatDemo }].map(({ label, Demo }) => (
          <div key={label} className="text-center">
            <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">{label}</p>
            <div className="scale-[0.55] origin-top"><IPhoneMockup><Demo /></IPhoneMockup></div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 7, label: "Live Demo", title: "App Walkthrough",
    content: (
      <div className="max-w-3xl mx-auto">
        <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl overflow-hidden border-2 border-primary/20 shadow-[var(--shadow-elegant)] bg-black">
          <video src="/videos/splash-video.mp4" poster="/videos/splash-poster.jpg" controls className="w-full aspect-video" playsInline />
        </motion.div>
        <p className="text-sm text-muted-foreground text-center mt-4">Live product demo — recorded from the beta app</p>
      </div>
    ),
  },
  {
    id: 8, label: "Traction", title: "Live Product. Real Signal. Ready to Scale.",
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-5">
          <MetricCard metric="40" label="Beta Users — active on live MVP" accent />
          <MetricCard metric="10K" label="User Capacity — no rebuild needed" />
          <MetricCard metric="$0.15" label="AI Cost/User — drops quarterly" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {["Therapist-reviewed psychology framework ✓", "App Store submission in progress", "10K-scale infrastructure ready ✓", "High-margin SaaS economics modeled ✓"].map((m, i) => (
            <motion.div key={i} whileHover={{ x: 4 }} className="flex items-center gap-3 text-sm text-foreground/80 cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{m}
            </motion.div>
          ))}
        </div>
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center">
          <p className="text-base text-foreground">We are not raising to build — we are raising to <span className="font-bold text-primary">validate paid acquisition and reach $50K MRR</span>.</p>
        </div>
      </div>
    ),
  },
  {
    id: 9, label: "Business Model", title: "Subscription SaaS. Simple. Scalable.",
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-5">
          {[
            { price: "$9.99", tier: "Core", desc: "Entry tier for new users exploring the platform." },
            { price: "$15.99", tier: "Full", featured: true, desc: "Full feature set. Primary conversion target." },
            { price: "$29.99", tier: "Premium", desc: "Advanced insights, history depth, and priority features." },
          ].map((p, i) => (
            <motion.div key={i} whileHover={{ y: -6 }} className={`rounded-2xl p-7 text-center ${p.featured ? "border-2 border-primary bg-primary/5 shadow-[var(--shadow-soft)] scale-105" : "border border-border/60 bg-card/60 backdrop-blur-sm"}`}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{p.tier}</p>
              <p className={`text-3xl font-bold mb-1 ${p.featured ? "bg-[image:var(--gradient-hero)] bg-clip-text text-transparent" : "text-foreground"}`}>{p.price}</p>
              <p className="text-[10px] text-muted-foreground">/month</p>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-lg text-foreground">All tiers provide full D.E.V.I. core features. Blended ARPU: <span className="font-bold text-primary">$15</span></p>
      </div>
    ),
  },
  {
    id: 10, label: "Unit Economics", title: "Both Apple Fee Scenarios Modeled.",
    content: (
      <div className="space-y-6 max-w-4xl mx-auto">
        <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">Every number accounts for platform fees. Both scenarios modeled transparently — no optimistic assumptions.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div whileHover={{ y: -4 }} className="rounded-2xl border-2 border-primary p-6 bg-primary/5 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-bold text-primary mb-4">15% Fee — Year 1 (Small Business)</p>
            <div className="space-y-2 text-foreground text-sm">
              <div className="flex justify-between"><span>Net Revenue</span><span className="font-bold">$12.75</span></div>
              <div className="flex justify-between"><span>Contribution</span><span className="font-bold">$12.25</span></div>
              <div className="flex justify-between items-center pt-2 border-t border-primary/20"><span>Margin</span><span className="text-2xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">82%</span></div>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-border/60 p-6 bg-card/60 backdrop-blur-sm">
            <p className="text-sm font-bold text-muted-foreground mb-4">30% Fee — Worst Case (&gt;$1M)</p>
            <div className="space-y-2 text-foreground text-sm">
              <div className="flex justify-between"><span>Net Revenue</span><span className="font-bold">$10.50</span></div>
              <div className="flex justify-between"><span>Contribution</span><span className="font-bold">$10.00</span></div>
              <div className="flex justify-between items-center pt-2 border-t border-border/40"><span>Margin</span><span className="text-2xl font-bold text-foreground">67%</span></div>
            </div>
          </motion.div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span>AI: <span className="font-bold text-foreground">$0.15</span>/user</span><span>·</span>
          <span>Payment + overhead: <span className="font-bold text-foreground">$0.35</span>/user</span><span>·</span>
          <span>Margin expands as model pricing drops quarterly</span>
        </div>
      </div>
    ),
  },
  {
    id: 11, label: "Growth", title: "$300K Allocated to Acquisition. Fully Mapped.",
    content: (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          {[
            { channel: "Meta / TikTok", budget: "$150K", cpa: "$50", users: "3,000" },
            { channel: "AppLovin", budget: "$100K", cpa: "$55", users: "1,818" },
            { channel: "Creator / Affiliate", budget: "$50K", cpa: "$25", users: "2,000", highlight: true },
          ].map((c, i) => (
            <motion.div key={i} whileHover={{ x: 4 }} className={`flex items-center justify-between rounded-2xl border p-5 cursor-default ${c.highlight ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card/60 backdrop-blur-sm"}`}>
              <span className="font-medium text-foreground">{c.channel}</span>
              <div className="flex gap-5 text-sm text-muted-foreground"><span>{c.budget}</span><span>CPA {c.cpa}</span><span className="font-bold text-primary">{c.users} users</span></div>
            </motion.div>
          ))}
        </div>
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center shadow-[var(--shadow-soft)]">
          <p className="text-lg text-foreground">Total Year 1: <span className="font-bold text-primary">8,618 users</span> · Blended CPA ~$44</p>
          <p className="text-xs text-muted-foreground mt-1">Creator/affiliate offers most efficient CPA — priority for early validation</p>
        </div>
      </div>
    ),
  },
  {
    id: 12, label: "Capital", title: "$500K. Every Dollar Mapped to Outcomes.",
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard metric="$75K" label="Product polish + App Store launch" />
          <MetricCard metric="$300K" label="CAC validation + 3-channel growth" accent />
          <MetricCard metric="$125K" label="Runway extension + contingency" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { scenario: "Conservative", cpa: "$55 CPA", mrr: "~$50K MRR" },
            { scenario: "Base Case", cpa: "$44 CPA", mrr: "~$77K MRR", sub: "$930K ARR", accent: true },
            { scenario: "Upside", cpa: "$30 CPA", mrr: "$100K+ MRR" },
          ].map((s, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className={`rounded-2xl p-5 text-center ${s.accent ? "border-2 border-primary bg-primary/5 shadow-[var(--shadow-soft)]" : "border border-border/40 bg-card/60"}`}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{s.scenario}</p>
              <p className="text-xs text-muted-foreground mb-1">{s.cpa}</p>
              <p className={`text-xl font-bold ${s.accent ? "text-primary" : "text-foreground"}`}>{s.mrr}</p>
              {s.sub && <p className="text-xs text-primary mt-1">{s.sub}</p>}
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-center text-muted-foreground">Cash-flow positive by <span className="font-semibold text-foreground">Month 12</span> at base case with capital remaining.</p>
      </div>
    ),
  },
  {
    id: 13, label: "Moat", title: "Structured Behavioral Data Is the Moat.",
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <p className="text-base text-muted-foreground text-center max-w-2xl mx-auto">Every interaction logged compounds into a structural advantage generic AI cannot replicate. ChatGPT has no memory of your last relationship. D.E.V.I. has <span className="font-semibold text-foreground">months of yours</span>.</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: "📊", title: "Logged Decision History", desc: "Every choice, pattern, and outcome stored with full context and timeline." },
            { icon: "🧠", title: "Emotional Pattern Recognition", desc: "Longitudinal data surfaces behavioral trends invisible in a single session." },
            { icon: "📈", title: "Compatibility Evolution", desc: "Scores update dynamically as new evidence is logged — not static assessments." },
            { icon: "🔮", title: "Predictive Insight Layer", desc: "Pattern history enables forward-looking guidance — not just reflection." },
          ].map((d, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className="rounded-2xl border border-border/40 p-5 bg-card/60 backdrop-blur-sm cursor-default">
              <span className="text-2xl block mb-2">{d.icon}</span>
              <p className="text-sm font-bold text-foreground mb-1">{d.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-center text-muted-foreground font-medium">DateBetter's data layer is the product — and it gets <span className="text-primary">stronger with every session</span>.</p>
      </div>
    ),
  },
  {
    id: 14, label: "Timing", title: "Why Now",
    content: (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { icon: "🤖", title: "AI Normalized", desc: "Consumers already use AI for personal advice. The behavioral shift has happened — the product layer hasn't caught up." },
            { icon: "🧠", title: "Therapy Demand Rising", desc: "Demand for mental health and relationship support is at an all-time high. Supply is constrained by cost and access." },
            { icon: "💔", title: "Dating Burnout Real", desc: "Users are disenchanted with swipe-based apps. They want depth, clarity, and intelligence — not more matches." },
            { icon: "💪", title: "Self-Optimization Wave", desc: "High-achieving women are investing in tools for personal clarity — fitness, finance, and now relationships." },
          ].map((t, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className="rounded-2xl border border-border/40 p-6 bg-card/60 backdrop-blur-sm cursor-default">
              <span className="text-2xl block mb-2">{t.icon}</span>
              <p className="text-sm font-bold text-foreground mb-1">{t.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-lg font-semibold text-primary text-center pt-2">Relationship intelligence is an emerging category. The window to define and own it is open now.</p>
      </div>
    ),
  },
  {
    id: 15, label: "Valuation", title: "$500K for 15% Equity. ~$3.3M Post-Money.",
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <p className="text-base text-muted-foreground text-center max-w-2xl mx-auto">This is not a concept raise. DateBetter enters this round with a live product, a validated psychology framework, and infrastructure capable of supporting 10,000 users.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: "Live Product", v: "MVP deployed. Beta users active." },
            { l: "67–82% Margin", v: "Modeled under both Apple fee scenarios." },
            { l: "10K Infrastructure", v: "No architectural rebuild required." },
            { l: "Low Technical Risk", v: "Framework validated. Stack proven." },
          ].map((v, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className="rounded-2xl border border-primary/20 bg-primary/5 p-4 cursor-default">
              <p className="text-xs font-bold text-primary mb-1">{v.l}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{v.v}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-lg text-center text-foreground">Capital accelerates <span className="font-bold text-primary">scale</span> — not development. The hard product risk is behind us.</p>
      </div>
    ),
  },
  {
    id: 16, label: "The Ask", title: "The Ask.",
    content: (
      <div className="flex flex-col items-center justify-center gap-8 text-center max-w-3xl mx-auto">
        <motion.img src={logo} alt="DateBetter" className="w-16 h-16 rounded-2xl shadow-[var(--shadow-soft)]" whileHover={{ scale: 1.05 }} />
        <h3 className="text-2xl md:text-3xl font-bold text-foreground">Building the Operating System for <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">Relationship Decisions</span>.</h3>
        <div className="grid grid-cols-3 gap-5 w-full">
          {[
            { title: "$500K Raise", desc: "15% equity. ~$3.3M post-money. 12–15 months of focused runway." },
            { title: "One Objective", desc: "Validate paid CAC at scale. Prove $44 blended CPA holds. Reach $50K–$100K MRR." },
            { title: "One Category", desc: "Relationship intelligence does not yet have a market leader. DateBetter is positioned to define and own it." },
          ].map((a, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left cursor-default">
              <p className="text-sm font-bold text-primary mb-2">{a.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">datebetter.ai · $500K Pre-Seed</p>
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
      trackView(1);
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
