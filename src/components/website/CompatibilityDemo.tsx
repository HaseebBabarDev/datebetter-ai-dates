import React, { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Heart, TrendingUp, Shield, Sparkles } from "lucide-react";

const dimensions = [
  { label: "Emotional IQ", value: 92, color: "hsl(var(--primary))" },
  { label: "Values Match", value: 87, color: "hsl(var(--secondary))" },
  { label: "Communication", value: 78, color: "hsl(var(--accent))" },
  { label: "Life Goals", value: 95, color: "hsl(var(--success))" },
];

export const CompatibilityDemo: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const target = 84;
    const timer = setInterval(() => {
      current += 1;
      if (current >= target) {
        setScore(target);
        clearInterval(timer);
      } else {
        setScore(current);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [inView]);

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div ref={ref} className="space-y-3 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Heart className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground leading-tight">Marcus T.</p>
          <p className="text-[8px] text-muted-foreground">3 interactions logged</p>
        </div>
        <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-semibold">Active</span>
      </div>

      {/* Score ring */}
      <div className="flex items-center justify-center py-2">
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <motion.circle
              cx="60" cy="60" r="52" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={inView ? strokeDashoffset : circumference}
              transform="rotate(-90 60 60)"
              initial={{ strokeDashoffset: circumference }}
              animate={inView ? { strokeDashoffset } : {}}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-2xl font-bold text-foreground font-poppins"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              {score}%
            </motion.span>
            <span className="text-[8px] text-muted-foreground font-medium">Compatibility</span>
          </div>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-2">
        {dimensions.map((dim, i) => (
          <div key={dim.label} className="space-y-0.5">
            <div className="flex justify-between">
              <span className="text-[9px] text-muted-foreground">{dim.label}</span>
              <span className="text-[9px] font-semibold text-foreground">{dim.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: dim.color }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${dim.value}%` } : {}}
                transition={{ duration: 1, delay: 0.6 + i * 0.15, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <motion.div
        className="p-2 rounded-lg bg-primary/5 border border-primary/10"
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.5 }}
      >
        <div className="flex items-start gap-1.5">
          <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
          <p className="text-[8px] text-foreground leading-relaxed">
            <strong>D.E.V.I.:</strong> Strong values alignment. Watch for communication gap during conflict — log next disagreement.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
