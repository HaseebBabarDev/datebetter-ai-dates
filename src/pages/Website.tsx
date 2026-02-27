import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  type Easing,
} from "framer-motion";
import {
  Sparkles,
  Brain,
  Shield,
  MessageCircle,
  Users,
  TrendingUp,
  Heart,
  ArrowRight,
  CheckCircle2,
  Star,
  ChevronDown,
  BarChart3,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/website-hero.jpg";
import { Moon, Sun } from "lucide-react";
import { IPhoneMockup } from "@/components/website/IPhoneMockup";
import { CompatibilityDemo } from "@/components/website/CompatibilityDemo";
import { ChatDemo } from "@/components/website/ChatDemo";
import { ScreenshotDemo } from "@/components/website/ScreenshotDemo";
import { PricingSection } from "@/components/website/PricingSection";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Shared animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as Easing } },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as Easing } },
};

const fadeRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as Easing } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as Easing } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

/* ─── Animated counter hook ─── */
const useCounter = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { count, ref };
};

/* ─── Floating particles ─── */
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, Math.random() * 20 - 10, 0],
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 3,
          ease: "easeInOut" as const,
        }}
      />
    ))}
  </div>
);

/* ─── Magnetic hover card ─── */
const MagneticCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
};

/* ─── Typing effect for DEVI ─── */
const TypingText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const [displayed, setDisplayed] = useState("");
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const timeout = setTimeout(() => {
      const timer = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
        }
      }, 25);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [inView, text, delay]);

  return (
    <p ref={ref} className="text-foreground text-sm leading-relaxed">
      {displayed}
      {displayed.length < text.length && inView && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </p>
  );
};

/* ─── Navbar ─── */
const Navbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);
  const { themeMode, toggleDarkMode } = useTheme();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <motion.span
          className="font-poppins text-xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent"
          whileHover={{ scale: 1.05 }}
        >
          dateBetter
        </motion.span>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {["Features", "How It Works", "D.E.V.I.", "Pricing", "Stories"].map((label, i) => (
            <motion.a
              key={label}
              href={`#${["features", "how-it-works", "devi", "pricing", "testimonials"][i]}`}
              className="hover:text-foreground transition-colors relative"
              whileHover={{ y: -2 }}
            >
              {label}
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Toggle dark mode"
          >
            {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-sm font-semibold">
            Log In
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="sm" onClick={() => navigate("/onboarding")} className="font-semibold bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-soft)]">
              Get Started
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

/* ─── Hero ─── */
const Hero = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={sectionRef} className="relative min-h-screen lg:h-screen flex items-center overflow-hidden">
      {/* Parallax background */}
      <motion.div className="absolute inset-0" style={{ y: imgY, scale: imgScale }}>
        <img src={heroImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </motion.div>

      <FloatingParticles />

      {/* Animated glow orbs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-primary/20 blur-[100px]"
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" as const }}
      />
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-secondary/20 blur-[80px]"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" as const }}
      />

      <motion.div style={{ y: textY }} className="relative z-10 max-w-6xl mx-auto px-5 pt-24 pb-16 lg:pt-20 lg:pb-12 w-full">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-12 items-center">
          {/* Left: Copy */}
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
              whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary) / 0.5)" }}
            >
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="text-xs font-semibold text-primary">AI-Powered Dating Advisor</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl lg:text-[3.4rem] font-bold text-foreground leading-[1.08] mb-4 lg:mb-5 tracking-tight">
              Stop asking
              <br />
              ChatGPT about
              <br />
              <motion.span
                className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent inline-block text-3xl sm:text-4xl lg:text-[3.4rem]"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: "200% 200%" }}
              >
                your situationship.
              </motion.span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-base lg:text-lg text-muted-foreground max-w-lg mb-6 lg:mb-8 leading-relaxed">
              Give the group chat a break. dateBetter tracks, scores, and analyzes your dating life with real data — not opinions. No fluff. Just real advice.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  onClick={() => navigate("/onboarding")}
                  className="font-poppins font-semibold h-13 px-8 bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-elegant)]"
                >
                  Start Free
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </motion.span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  className="font-poppins font-semibold h-13 px-8"
                >
                  See How It Works
                  <motion.span animate={{ y: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </motion.span>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} className="hidden sm:flex items-center gap-6 mt-8 text-sm text-muted-foreground">
              {[
                { icon: Shield, text: "100% Private" },
                { icon: Users, text: "For Everyone" },
                { icon: Brain, text: "AI-Backed" },
              ].map((item, i) => (
                <motion.span
                  key={item.text}
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.15 }}
                >
                  <item.icon className="w-4 h-4 text-primary" /> {item.text}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: iPhone mockup with floating badges */}
          <motion.div
            className="flex justify-center relative mt-4 lg:mt-0"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] as Easing }}
          >
            <motion.div
              className="absolute -inset-12 bg-[image:var(--gradient-hero)] rounded-full blur-[80px] opacity-15"
              animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            {/* Floating insight badges around the phone */}
            {[
              { label: "🚩 Love Bombing", xLg: -200, xSm: -130, yLg: 40, ySm: 20, delay: 1.8 },
              { label: "💔 Breadcrumbing", xLg: 200, xSm: 120, yLg: 100, ySm: 70, delay: 2.4 },
              { label: "✅ Secure Attachment", xLg: -210, xSm: -135, yLg: 200, ySm: 150, delay: 3.0 },
              { label: "⚠️ Post-Intimacy Clarity", xLg: 190, xSm: 110, yLg: 280, ySm: 220, delay: 3.6 },
              { label: "💜 Healthy Boundary", xLg: -190, xSm: -125, yLg: 380, ySm: 300, delay: 4.2 },
              { label: "🔄 Anxious Pattern", xLg: 210, xSm: 115, yLg: 420, ySm: 360, delay: 2.1 },
            ].map((badge, i) => (
              <React.Fragment key={i}>
                {/* Desktop */}
                <motion.div
                  className="absolute hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg text-xs font-medium whitespace-nowrap z-10"
                  style={{ left: `calc(50% + ${badge.xLg}px)`, top: badge.yLg }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.9], y: [10, 0, 0, -5] }}
                  transition={{ duration: 4, delay: badge.delay, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                >
                  {badge.label}
                </motion.div>
                {/* Mobile / Tablet */}
                <motion.div
                  className="absolute flex lg:hidden items-center gap-1 px-2 py-0.5 rounded-full border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg text-[10px] font-medium whitespace-nowrap z-10"
                  style={{ left: `calc(50% + ${badge.xSm}px)`, top: badge.ySm }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.9], y: [8, 0, 0, -4] }}
                  transition={{ duration: 4, delay: badge.delay, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                >
                  {badge.label}
                </motion.div>
              </React.Fragment>
            ))}

            <div className="scale-[0.8] sm:scale-90 lg:scale-100 origin-top">
              <IPhoneMockup>
                <ScreenshotDemo />
              </IPhoneMockup>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        animate={{ y: [0, 8, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </motion.div>
    </section>
  );
};

/* ─── Stats banner ─── */
const StatsBanner = () => {
  const s1 = useCounter(40);
  const s2 = useCounter(500);
  const s3 = useCounter(24);

  return (
    <section className="py-12 border-y border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-3 gap-6 text-center"
        >
          {[
            { ref: s1.ref, count: s1.count, suffix: "+", label: "Compatibility Dimensions" },
            { ref: s2.ref, count: s2.count, suffix: "+", label: "Beta Testers" },
            { ref: s3.ref, count: s3.count, suffix: "/7", label: "AI Available" },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn}>
              <span ref={s.ref} className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
                {s.count}{s.suffix}
              </span>
              <p className="text-muted-foreground mt-1 text-base sm:text-lg font-medium">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Problem ─── */
const Problem = () => (
  <section className="py-20 bg-muted/30 relative overflow-hidden">
    <FloatingParticles />
    <div className="max-w-6xl mx-auto px-5 relative z-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center max-w-3xl mx-auto">
        <motion.h2 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
          Dating apps help you <span className="text-primary">match</span>.
          <br />
          Nobody helps you <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">choose wisely</span>.
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed mb-12">
          After the match, you're on your own. Ignoring red flags, repeating toxic patterns,
          and hoping this time is different. dateBetter changes that.
        </motion.p>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="grid md:grid-cols-3 gap-6">
        {[
          { icon: AlertTriangle, title: "Blind Spots", desc: "You miss the same red flags every time because emotions override logic." },
          { icon: TrendingUp, title: "Repeating Patterns", desc: "Without data, you keep choosing the same type of person who doesn't align with your values." },
          { icon: MessageCircle, title: "Bad Advice", desc: "Friends mean well, but they don't know your patterns. Generic AI doesn't know you at all." },
        ].map((item, i) => (
          <MagneticCard key={item.title} className="cursor-default">
            <motion.div
              variants={fadeUp}
              className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-[var(--shadow-soft)] transition-shadow duration-300 h-full"
              whileHover={{ y: -6, borderColor: "hsl(var(--destructive) / 0.3)" }}
            >
              <motion.div
                className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center mb-4"
                whileHover={{ rotate: 12, scale: 1.15 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <item.icon className="w-5 h-5 text-destructive" />
              </motion.div>
              <h3 className="font-poppins font-semibold text-lg text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          </MagneticCard>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── Features ─── */
const Features = () => (
  <section id="features" className="py-20 relative overflow-hidden">
    <motion.div
      className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-[120px]"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 10, repeat: Infinity }}
    />
    <div className="max-w-6xl mx-auto px-5 relative z-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-2xl mx-auto mb-14">
        <motion.h2 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Everything you need to <span className="text-primary">date smarter</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
          Powerful tools that bring clarity, accountability, and confidence to your dating life.
        </motion.p>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { icon: BarChart3, title: "Compatibility Scoring", desc: "AI evaluates every candidate across 40+ dimensions to give you a clear, data-backed score.", color: "primary" },
          { icon: Brain, title: "Pattern Recognition", desc: "Spot your dating blind spots. Our AI learns your history and flags repeated mistakes.", color: "secondary" },
          { icon: AlertTriangle, title: "Red & Green Flags", desc: "Auto-detect warning signs and positive traits based on interaction logs.", color: "destructive" },
          { icon: Sparkles, title: "D.E.V.I. AI Assistant", desc: "Your 24/7 private advisor who knows your patterns, values, and goals.", color: "primary" },
          { icon: Shield, title: "Auto-Disqualify", desc: "Set your dealbreakers once. Candidates who violate them get flagged instantly.", color: "accent" },
          { icon: Users, title: "Private Community", desc: "Connect with people who are also dating intentionally. Share, learn, grow.", color: "secondary" },
        ].map((f) => (
          <MagneticCard key={f.title} className="cursor-default">
            <motion.div
              variants={fadeUp}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 h-full"
              whileHover={{ y: -8, boxShadow: "var(--shadow-elegant)" }}
            >
              <motion.div
                className={`w-11 h-11 rounded-xl bg-${f.color}/10 flex items-center justify-center mb-4`}
                whileHover={{ rotate: 15, scale: 1.2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <f.icon className={`w-5 h-5 text-${f.color}`} />
              </motion.div>
              <h3 className="font-poppins font-semibold text-lg text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          </MagneticCard>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── How It Works ─── */
const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start 80%", "end 60%"] });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How <span className="text-primary">dateBetter</span> works
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
            Three simple steps to transform your dating life with data and AI.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-start">
          {/* Steps */}
          <div ref={containerRef} className="relative">
            {/* Animated connecting line (desktop) */}
            <div className="hidden md:block absolute left-6 top-0 bottom-0 w-0.5 bg-border">
              <motion.div className="w-full bg-primary rounded-full origin-top" style={{ height: lineHeight }} />
            </div>

            <div className="space-y-10">
              {[
                { step: "01", title: "Build Your Profile", desc: "Complete a deep-dive onboarding that captures your values, dealbreakers, attachment style, and relationship goals." },
                { step: "02", title: "Track & Evaluate", desc: "Log interactions with potential partners. D.E.V.I. analyzes each one and builds a compatibility score in real-time." },
                { step: "03", title: "Decide With Confidence", desc: "Get AI-powered insights, pattern alerts, and clear recommendations. Keep or disqualify with full context." },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.2, ease: [0.25, 0.4, 0.25, 1] as Easing }}
                  className="relative pl-16"
                >
                  {/* Step number circle */}
                  <motion.div
                    className="absolute left-0 top-0 w-12 h-12 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-soft)]"
                    animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0.2)", "0 0 0 8px hsl(var(--primary) / 0)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                  >
                    <span className="font-poppins text-sm font-bold text-primary-foreground">{s.step}</span>
                  </motion.div>
                  <h3 className="font-poppins font-semibold text-xl text-foreground mb-2">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Score graphic iPhone */}
          <motion.div
            className="hidden lg:block relative"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div
              className="absolute -inset-10 bg-[image:var(--gradient-hero)] rounded-full blur-[70px] opacity-10"
              animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <IPhoneMockup>
              <CompatibilityDemo />
            </IPhoneMockup>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─── DEVI Section ─── */
const DeviSection = () => {
  const navigate = useNavigate();
  return (
    <section id="devi" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-[0.03]" />
      <FloatingParticles />
      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeLeft}>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" as const }}>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="text-xs font-bold text-primary tracking-wider">D.E.V.I.</span>
            </motion.div>
            <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-foreground mb-5 leading-tight">
              Your AI dating advisor who actually <span className="text-primary">knows you</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              <strong>D</strong>ating <strong>E</strong>valuation & <strong>V</strong>etting <strong>I</strong>ntelligence — 
              D.E.V.I. learns your patterns, values, and triggers to give you personalized, real-time guidance. Not generic advice. <em>Your</em> advice.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Analyzes your interactions in real-time",
                "Spots red flags you might miss",
                "Tracks your healing & growth journey",
                "Available 24/7 — judgement-free",
              ].map((t, i) => (
                <motion.li
                  key={t}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <motion.div whileHover={{ scale: 1.3, rotate: 10 }}>
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  </motion.div>
                  <span className="text-foreground">{t}</span>
                </motion.li>
              ))}
            </ul>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                onClick={() => navigate("/onboarding")}
                className="font-poppins font-semibold bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-soft)]"
              >
                Meet D.E.V.I.
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div variants={fadeRight} className="relative">
            {/* Animated glow behind card */}
            <motion.div
              className="absolute -inset-4 bg-[image:var(--gradient-hero)] rounded-3xl blur-3xl"
              animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="relative bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-elegant)]"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <motion.div
                  className="w-10 h-10 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center"
                  animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0.3)", "0 0 0 10px hsl(var(--primary) / 0)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </motion.div>
                <div>
                  <p className="font-poppins font-semibold text-foreground">D.E.V.I.</p>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-success"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <motion.div
                  className="bg-muted rounded-xl rounded-tl-sm p-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <TypingText
                    text="I noticed a pattern — the last 3 people you've been excited about all had similar avoidant tendencies. Want to explore what's drawing you there?"
                    delay={500}
                  />
                </motion.div>
                <motion.div
                  className="bg-primary/10 rounded-xl rounded-tr-sm p-4 ml-8"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 5 }}
                >
                  <p className="text-foreground text-sm leading-relaxed">
                    Wow, I didn't even see that. Yes, let's dig into it.
                  </p>
                </motion.div>
                <motion.div
                  className="bg-muted rounded-xl rounded-tl-sm p-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 6 }}
                >
                  <TypingText
                    text="This is actually really common with anxious attachment styles. Here's what I'd recommend based on your profile..."
                    delay={6500}
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Testimonials ─── */
const Testimonials = () => (
  <section id="testimonials" className="py-20 bg-muted/30">
    <div className="max-w-6xl mx-auto px-5">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-2xl mx-auto mb-14">
        <motion.h2 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Real people. <span className="text-primary">Real clarity.</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
          Hear from people who stopped guessing and started choosing.
        </motion.p>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-6">
        {[
          { name: "Jasmine R.", quote: "D.E.V.I. caught a pattern I'd been blind to for years. I finally feel like I'm dating with my eyes open.", stars: 5 },
          { name: "Alicia M.", quote: "The compatibility scoring alone saved me months. I used to waste so much time on people who didn't align with my values.", stars: 5 },
          { name: "Tara K.", quote: "I love the auto-disqualify feature. It's like having a best friend who remembers all your dealbreakers and holds you accountable.", stars: 5 },
        ].map((t) => (
          <MagneticCard key={t.name} className="cursor-default">
            <motion.div
              variants={fadeUp}
              className="p-6 rounded-2xl bg-card border border-border h-full"
              whileHover={{ y: -6, boxShadow: "var(--shadow-soft)" }}
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 400 }}
                  >
                    <Star className="w-4 h-4 fill-primary text-primary" />
                  </motion.div>
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-5 italic">"{t.quote}"</p>
              <p className="font-poppins font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">Beta Tester</p>
            </motion.div>
          </MagneticCard>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── Final CTA ─── */
const FinalCTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-[0.06]" />
      <FloatingParticles />

      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-[100px]"
        animate={{ x: [-30, 30, -30], y: [-20, 20, -20] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-secondary/10 blur-[80px]"
        animate={{ x: [20, -20, 20], y: [15, -15, 15] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
            You deserve someone who
            <br />
            <motion.span
              className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent inline-block"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            >
              meets your standard
            </motion.span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            dateBetter gives you the data, the AI, and the community to stop settling and start selecting. Free to start. Private by design.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.div
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={() => navigate("/onboarding")}
                className="font-poppins font-semibold h-14 px-10 text-base bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-elegant)]"
              >
                Get Started — It's Free
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-5 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> Free to start</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> 100% private</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Footer ─── */
const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-border py-12 bg-muted/20">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <span className="font-poppins text-lg font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              dateBetter
            </span>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Data for Dating. AI-backed relationship intelligence for anyone who's serious about getting it right.
            </p>
          </div>
          <div>
            <h4 className="font-poppins font-semibold text-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#devi" className="hover:text-foreground transition-colors">D.E.V.I. AI</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-poppins font-semibold text-foreground mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">About</button></li>
              <li><button onClick={() => navigate("/support")} className="hover:text-foreground transition-colors">Support</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-poppins font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => navigate("/privacy-policy")} className="hover:text-foreground transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms of Service</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} dateBetter. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Built for everyone · 100% private · AI-powered</p>
        </div>
      </div>
    </footer>
  );
};

/* ─── Main Page ─── */
const InteractiveShowcase = () => (
  <section className="py-20 relative overflow-hidden">
    <motion.div
      className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-[120px]"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 8, repeat: Infinity }}
    />
    <div className="max-w-6xl mx-auto px-5 relative z-10">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <motion.h2 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Try <span className="text-primary">D.E.V.I.</span> right now
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
          Type a real dating question below and see how your AI advisor responds.
        </motion.p>
      </motion.div>

      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <motion.div
            className="absolute -inset-10 bg-[image:var(--gradient-hero)] rounded-full blur-[70px] opacity-15"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <IPhoneMockup>
            <ChatDemo />
          </IPhoneMockup>
          <motion.p
            className="text-center mt-4 text-sm font-semibold text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            Try it — type a question above!
          </motion.p>
        </motion.div>
      </div>
    </div>
  </section>
);

/* ─── Main Page ─── */
const Website = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Hero />
    <StatsBanner />
    <Problem />
    <Features />
    <InteractiveShowcase />
    <HowItWorks />
    <DeviSection />
    <PricingSection />
    <Testimonials />
    <FinalCTA />
    <Footer />
  </div>
);

export default Website;
