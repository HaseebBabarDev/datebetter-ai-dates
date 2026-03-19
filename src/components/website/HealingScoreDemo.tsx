import React, { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Heart, Sparkles, TrendingUp } from "lucide-react";

const healingHistory = [
  { week: "W1", score: 42 },
  { week: "W2", score: 48 },
  { week: "W3", score: 52 },
  { week: "W4", score: 58 },
  { week: "W5", score: 63 },
  { week: "W6", score: 71 },
  { week: "W7", score: 76 },
  { week: "Now", score: 82 },
];

const maxScore = 100;
const chartHeight = 80;

export const HealingScoreDemo: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const target = 82;
    const timer = setInterval(() => {
      current += 1;
      if (current >= target) {
        setScore(target);
        clearInterval(timer);
      } else {
        setScore(current);
      }
    }, 18);
    return () => clearInterval(timer);
  }, [inView]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div ref={ref} className="space-y-3 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Heart className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground leading-tight">Healing Score</p>
          <p className="text-[8px] text-muted-foreground">Updated weekly</p>
        </div>
        <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-semibold flex items-center gap-0.5">
          <TrendingUp className="w-2.5 h-2.5" /> +9%
        </span>
      </div>

      {/* Score ring */}
      <div className="flex items-center justify-center py-1">
        <div className="relative">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
            <motion.circle
              cx="50" cy="50" r="40" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={inView ? strokeDashoffset : circumference}
              transform="rotate(-90 50 50)"
              initial={{ strokeDashoffset: circumference }}
              animate={inView ? { strokeDashoffset } : {}}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-xl font-bold text-foreground font-poppins"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              {score}%
            </motion.span>
            <span className="text-[7px] text-success font-medium">Ready to date!</span>
          </div>
        </div>
      </div>

      {/* Progress chart */}
      <div className="space-y-1">
        <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Progress</p>
        <div className="relative h-[80px] w-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((v) => (
            <div
              key={v}
              className="absolute left-0 right-0 border-t border-muted/40"
              style={{ bottom: `${(v / maxScore) * chartHeight}px` }}
            />
          ))}
          {/* Area + Line */}
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${healingHistory.length * 30} ${chartHeight}`} preserveAspectRatio="none">
            {/* Area fill */}
            <motion.path
              d={`M0,${chartHeight} ${healingHistory.map((d, i) => `L${i * (30)},${chartHeight - (d.score / maxScore) * chartHeight}`).join(" ")} L${(healingHistory.length - 1) * 30},${chartHeight} Z`}
              fill="hsl(var(--primary) / 0.1)"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 1, duration: 0.8 }}
            />
            {/* Line */}
            <motion.path
              d={healingHistory.map((d, i) => `${i === 0 ? "M" : "L"}${i * 30},${chartHeight - (d.score / maxScore) * chartHeight}`).join(" ")}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
            />
            {/* Dots */}
            {healingHistory.map((d, i) => (
              <motion.circle
                key={i}
                cx={i * 30}
                cy={chartHeight - (d.score / maxScore) * chartHeight}
                r="2.5"
                fill="hsl(var(--primary))"
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
              />
            ))}
          </svg>
          {/* Labels */}
          <div className="absolute bottom-[-12px] left-0 right-0 flex justify-between px-0">
            {healingHistory.map((d) => (
              <span key={d.week} className="text-[6px] text-muted-foreground">{d.week}</span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <motion.div
        className="p-2 rounded-lg bg-primary/5 border border-primary/10 mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 2 }}
      >
        <div className="flex items-start gap-1.5">
          <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
          <p className="text-[8px] text-foreground leading-relaxed">
            <strong>D.E.V.I.:</strong> Great progress! You've moved past the attachment phase. Keep setting those boundaries — they're working.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
