import React from "react";
import { motion, type Easing } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as Easing } },
};

const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

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
          className="text-center max-w-2xl mx-auto"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Unlimited Plan</span>
          </motion.div>

          <motion.h2 variants={fadeUp} className="font-poppins text-3xl sm:text-4xl font-bold text-foreground mb-4">
            15 Days <span className="text-primary">Free</span>, Then $15/Month Unlimited
          </motion.h2>

          <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-8">
            Full access to every feature. No hidden tiers. No complicated plans. Cancel anytime.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                onClick={() => navigate("/onboarding")}
                className="font-poppins font-semibold h-13 px-8 bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-soft)]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
