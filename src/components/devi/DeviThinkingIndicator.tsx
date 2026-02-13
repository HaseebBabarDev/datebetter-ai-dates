import React, { useState, useEffect } from "react";
import { Sparkles, BookOpen, Brain, Search, FlaskConical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const THINKING_PHASES = [
  { icon: Search, text: "Searching clinical resources…" },
  { icon: BookOpen, text: "Reviewing attachment theory research…" },
  { icon: FlaskConical, text: "Cross-referencing behavioral patterns…" },
  { icon: Brain, text: "Synthesizing personalized insights…" },
];

interface DeviThinkingIndicatorProps {
  isVisible: boolean;
}

export const DeviThinkingIndicator: React.FC<DeviThinkingIndicatorProps> = ({ isVisible }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setPhaseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setPhaseIndex(prev => (prev + 1) % THINKING_PHASES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const phase = THINKING_PHASES[phaseIndex];
  const Icon = phase.icon;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">D.E.V.I.</span>
      </div>

      <div className="pl-9 pr-4">
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 border border-border/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2.5"
            >
              <Icon className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">{phase.text}</span>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-1 ml-1">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
