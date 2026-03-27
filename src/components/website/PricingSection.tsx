import React from "react";
import { motion, type Easing } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, Sparkles, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as Easing } },
};

const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Try it out — no card needed",
    icon: Zap,
    features: [
      "1 candidate profile",
      "5 D.E.V.I. messages",
      "Basic compatibility insights",
      "Cycle tracking",
    ],
    popular: false,
  },
  {
    name: "Starter",
    price: "$9.99",
    period: "/mo",
    description: "Start dating with clarity",
    icon: Zap,
    features: [
      "Up to 5 candidates",
      "300 D.E.V.I. messages",
      "1 text simulator exchange (trial)",
      "5 compatibility refreshes per candidate",
      "Red flag detection",
    ],
    popular: false,
  },
  {
    name: "Plus",
    price: "$15.99",
    period: "/mo",
    description: "For active daters",
    icon: Sparkles,
    features: [
      "Up to 10 candidates",
      "1,000 D.E.V.I. messages",
      "5 text simulator conversations",
      "10 compatibility refreshes per candidate",
      "Red flag detection",
      "Voice playback insights",
    ],
    popular: false,
  },
  {
    name: "Unlimited",
    price: "$29.99",
    period: "/mo",
    description: "Full relationship intelligence",
    icon: Crown,
    features: [
      "Unlimited candidates",
      "Unlimited D.E.V.I. messages",
      "20 text simulator conversations",
      "Unlimited compatibility refreshes",
      "Red flag detection",
      "Priority support",
    ],
    popular: true,
  },
];

export const PricingSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 relative overflow-hidden">
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-[120px]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
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
            Simple, <span className="text-primary">transparent</span> pricing
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg">
            Invest in yourself. Every plan helps you date smarter — no contracts, cancel anytime.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className={`relative rounded-2xl p-6 transition-all duration-300 ${
                plan.popular
                  ? "bg-card border-2 border-primary shadow-[var(--shadow-elegant)] scale-[1.02]"
                  : "bg-card border border-border hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
              }`}
              whileHover={{ y: -6 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground text-xs font-bold shadow-[var(--shadow-soft)]">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  plan.popular ? "bg-[image:var(--gradient-primary)]" : "bg-primary/10"
                }`}>
                  <plan.icon className={`w-5 h-5 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                </div>
                <div>
                  <h3 className="font-poppins font-semibold text-lg text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="font-poppins text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full font-semibold ${
                  plan.popular
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-soft)]"
                    : ""
                }`}
                variant={plan.popular ? "default" : "outline"}
                onClick={() => navigate("/onboarding")}
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* One-time add-on */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 max-w-md mx-auto text-center"
        >
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm font-semibold text-foreground mb-1">🩹 Detachment Plan — $9.99 one-time</p>
            <p className="text-xs text-muted-foreground">Personalized AI recovery timeline when you need to let someone go.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
