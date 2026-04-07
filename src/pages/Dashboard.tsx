import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Heart,
  MessageSquare,
  Brain,
  Unlink,
  Users,
  Search,
  Shield,
  Zap,
  Compass,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    label: "Patterns",
    desc: "Your dating patterns & blind spots",
    path: "/patterns",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: MessageSquare,
    label: "Text Simulator",
    desc: "Practice what to say next",
    path: "/candidates",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Zap,
    label: "AI Predictions",
    desc: "Where things are heading",
    path: "/candidates",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: AlertTriangle,
    label: "Red Flags",
    desc: "Detected warnings across candidates",
    path: "/candidates",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Heart,
    label: "Healing Score",
    desc: "Track your emotional recovery",
    path: "/devi?action=healing",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: Unlink,
    label: "Detachment Plans",
    desc: "Guided plans to move on",
    path: "/detachment-plan",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
  {
    icon: Search,
    label: "Self Discovery",
    desc: "Quizzes & personality insights",
    path: "/self-discovery",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Users,
    label: "Community",
    desc: "Connect with others",
    path: "/community",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Compass,
    label: "Dating Advice",
    desc: "Ask D.E.V.I. anything",
    path: "/devi",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-[100dvh] bg-[image:var(--gradient-page)] pb-20">
      <header className="px-4 py-4 pt-safe-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              dateBetter
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Your toolkit for smarter dating</p>
        </div>
      </header>

      <main className="px-4 max-w-lg mx-auto">
        <div className="grid grid-cols-1 gap-2.5">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
                onClick={() => navigate(feature.path)}
                className="w-full p-4 rounded-2xl border border-border/50 bg-card hover:bg-accent/50 transition-all text-left group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{feature.label}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
