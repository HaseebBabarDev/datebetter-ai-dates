import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Heart,
  Brain,
  Users,
  Search,
  Compass,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import logo from "@/assets/logo-db.png";

const FEATURES = [
  {
    icon: Brain,
    label: "Patterns",
    desc: "Dating patterns & blind spots",
    path: "/patterns",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    span: "col-span-1",
  },
  {
    icon: Heart,
    label: "Healing Score",
    desc: "Emotional recovery",
    path: "/devi?action=healing",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    span: "col-span-1",
  },
  {
    icon: Search,
    label: "Self Discovery",
    desc: "Quizzes & insights",
    path: "/self-discovery",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    span: "col-span-1",
  },
  {
    icon: Users,
    label: "Community",
    desc: "Connect with others",
    path: "/community",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    span: "col-span-1",
  },
  {
    icon: Compass,
    label: "Dating Advice",
    desc: "Ask D.E.V.I. anything",
    path: "/devi",
    color: "text-primary",
    bg: "bg-primary/10",
    span: "col-span-2",
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

      <main className="px-4 max-w-lg mx-auto space-y-5">
        {/* Hero CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate("/devi")}
          className="w-full p-5 rounded-2xl bg-[image:var(--gradient-hero)] text-primary-foreground text-left group active:scale-[0.98] transition-transform relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <img src={logo} alt="D.E.V.I." className="w-14 h-14 rounded-2xl object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg">Chat with D.E.V.I.</h2>
              <p className="text-sm opacity-90">Your AI dating advisor — ask anything</p>
            </div>
            <ChevronRight className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </motion.button>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {FEATURES.map((feature, idx) => {
            if (feature.label === "Dating Advice") return null;
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.25 }}
                onClick={() => navigate(feature.path)}
                className="w-full p-4 rounded-2xl border border-border/50 bg-card hover:bg-accent/50 transition-all text-left group active:scale-[0.98] flex flex-col gap-3"
              >
                <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.label}</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug">{feature.desc}</p>
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
