import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ─── Navbar ─── */
const Navbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <span className="font-poppins text-xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
          dateBetter
        </span>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#devi" className="hover:text-foreground transition-colors">D.E.V.I.</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Stories</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-sm font-semibold">
            Log In
          </Button>
          <Button size="sm" onClick={() => navigate("/onboarding")} className="font-semibold bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-soft)]">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};

/* ─── Hero ─── */
const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 pt-24 pb-16 w-full">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-2xl">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">AI-Powered Relationship Intelligence</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] mb-5 tracking-tight">
            Stop guessing.
            <br />
            <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              Start knowing.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
            dateBetter uses AI to help you evaluate, track, and understand your dating patterns — so you can choose partners who actually deserve you.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/onboarding")}
              className="font-poppins font-semibold h-13 px-8 bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-elegant)]"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="font-poppins font-semibold h-13 px-8"
            >
              See How It Works
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> 100% Private</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-primary" /> Female-Built</span>
            <span className="flex items-center gap-1.5"><Brain className="w-4 h-4 text-primary" /> AI-Backed</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Problem ─── */
const Problem = () => (
  <section className="py-20 bg-muted/30">
    <div className="max-w-6xl mx-auto px-5">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center max-w-3xl mx-auto">
        <motion.h2 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl font-bold text-foreground mb-4">
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
        ].map((item) => (
          <motion.div
            key={item.title}
            variants={fadeUp}
            className="p-6 rounded-2xl bg-card border border-border shadow-sm"
          >
            <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
              <item.icon className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-foreground mb-2">{item.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── Features ─── */
const Features = () => (
  <section id="features" className="py-20">
    <div className="max-w-6xl mx-auto px-5">
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
          { icon: Users, title: "Private Community", desc: "Connect with women who are also dating intentionally. Share, learn, grow.", color: "secondary" },
        ].map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-[var(--shadow-soft)] transition-all duration-300"
          >
            <div className={`w-11 h-11 rounded-xl bg-${f.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <f.icon className={`w-5 h-5 text-${f.color}`} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-foreground mb-2">{f.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── How It Works ─── */
const HowItWorks = () => (
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

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-8">
        {[
          { step: "01", title: "Build Your Profile", desc: "Complete a deep-dive onboarding that captures your values, dealbreakers, attachment style, and relationship goals." },
          { step: "02", title: "Track & Evaluate", desc: "Log interactions with potential partners. D.E.V.I. analyzes each one and builds a compatibility score in real-time." },
          { step: "03", title: "Decide With Confidence", desc: "Get AI-powered insights, pattern alerts, and clear recommendations. Keep or disqualify with full context." },
        ].map((s) => (
          <motion.div key={s.step} variants={fadeUp} className="relative">
            <span className="font-poppins text-6xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent opacity-30">
              {s.step}
            </span>
            <h3 className="font-poppins font-semibold text-xl text-foreground mb-3 -mt-2">{s.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── DEVI Section ─── */
const DeviSection = () => {
  const navigate = useNavigate();
  return (
    <section id="devi" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-[0.03]" />
      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary tracking-wider">D.E.V.I.</span>
            </div>
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
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{t}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              onClick={() => navigate("/onboarding")}
              className="font-poppins font-semibold bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-soft)]"
            >
              Meet D.E.V.I.
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="relative">
            <div className="absolute -inset-4 bg-[image:var(--gradient-hero)] rounded-3xl blur-3xl opacity-20" />
            <div className="relative bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-elegant)]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-poppins font-semibold text-foreground">D.E.V.I.</p>
                  <p className="text-xs text-muted-foreground">AI Assistant</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-muted rounded-xl rounded-tl-sm p-4">
                  <p className="text-foreground text-sm leading-relaxed">
                    I noticed a pattern — the last 3 people you've been excited about all had similar avoidant tendencies. Want to explore what's drawing you there?
                  </p>
                </div>
                <div className="bg-primary/10 rounded-xl rounded-tr-sm p-4 ml-8">
                  <p className="text-foreground text-sm leading-relaxed">
                    Wow, I didn't even see that. Yes, let's dig into it.
                  </p>
                </div>
                <div className="bg-muted rounded-xl rounded-tl-sm p-4">
                  <p className="text-foreground text-sm leading-relaxed">
                    This is actually really common with anxious attachment styles. Here's what I'd recommend based on your profile...
                  </p>
                </div>
              </div>
            </div>
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
          Real women. <span className="text-primary">Real clarity.</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
          Hear from women who stopped guessing and started choosing.
        </motion.p>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-6">
        {[
          { name: "Jasmine R.", quote: "D.E.V.I. caught a pattern I'd been blind to for years. I finally feel like I'm dating with my eyes open.", stars: 5 },
          { name: "Alicia M.", quote: "The compatibility scoring alone saved me months. I used to waste so much time on people who didn't align with my values.", stars: 5 },
          { name: "Tara K.", quote: "I love the auto-disqualify feature. It's like having a best friend who remembers all your dealbreakers and holds you accountable.", stars: 5 },
        ].map((t) => (
          <motion.div
            key={t.name}
            variants={fadeUp}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: t.stars }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-foreground leading-relaxed mb-5 italic">"{t.quote}"</p>
            <p className="font-poppins font-semibold text-foreground">{t.name}</p>
            <p className="text-xs text-muted-foreground">Beta Tester</p>
          </motion.div>
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
      <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
            You deserve someone who
            <br />
            <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">meets your standard</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            dateBetter gives you the data, the AI, and the community to stop settling and start selecting. Free to start. Private by design.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/onboarding")}
              className="font-poppins font-semibold h-14 px-10 text-base bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-elegant)]"
            >
              Get Started — It's Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-5 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> Setup in 2 min</span>
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
              Data for Dating. AI-backed relationship intelligence for women who are serious about getting it right.
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
          <p className="text-xs text-muted-foreground">Female-built · 100% private · AI-powered</p>
        </div>
      </div>
    </footer>
  );
};

/* ─── Main Page ─── */
const Website = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Hero />
    <Problem />
    <Features />
    <HowItWorks />
    <DeviSection />
    <Testimonials />
    <FinalCTA />
    <Footer />
  </div>
);

export default Website;
