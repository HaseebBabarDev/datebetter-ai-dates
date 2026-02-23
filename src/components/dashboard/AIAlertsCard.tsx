import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Eye, 
  TrendingUp, 
  Sparkles,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  History,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { VoicePlayButton } from "@/components/devi/VoicePlayButton";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Alert {
  severity: "info" | "warning" | "urgent";
  title: string;
  message: string;
  candidateNickname?: string;
  candidateId?: string;
}

const getDismissedKey = (userId?: string) => userId ? `ai_alerts_dismissed_${userId}` : "ai_alerts_dismissed";

interface AIAlertsData {
  blindSpotAlerts: Alert[];
  predictiveAlerts: Alert[];
  lastGenerated: string;
}

interface HistoricAlert extends Alert {
  type: "blind_spot" | "predictive";
  generatedAt: string;
}

interface AIAlertsCardProps {
  candidateCount: number;
  lastInteractionTime?: string;
  interactionCount?: number;
  onLogInteraction?: () => void;
  userId?: string;
}

const getCacheKey = (userId?: string) => userId ? `ai_alerts_cache_${userId}` : "ai_alerts_cache";
const getHistoryKey = (userId?: string) => userId ? `ai_alerts_history_${userId}` : "ai_alerts_history";

const CACHE_DURATION_MS = 1000 * 60 * 30;
const MAX_HISTORY_ITEMS = 50;
const INITIAL_DISPLAY_COUNT = 3;

const severityConfig = {
  urgent: {
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    icon: "text-destructive",
    iconBg: "bg-destructive/20",
    glow: "shadow-[0_0_15px_-3px_hsl(0,72%,51%,0.3)]",
    dot: "bg-destructive",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-600",
    iconBg: "bg-amber-500/20",
    glow: "shadow-[0_0_15px_-3px_hsl(40,90%,50%,0.3)]",
    dot: "bg-amber-500",
  },
  info: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: "text-primary",
    iconBg: "bg-primary/20",
    glow: "",
    dot: "bg-primary",
  },
};

export const AIAlertsCard: React.FC<AIAlertsCardProps> = ({ 
  candidateCount,
  lastInteractionTime,
  interactionCount = 0,
  onLogInteraction,
  userId
}) => {
  const CACHE_KEY = getCacheKey(userId);
  const HISTORY_KEY = getHistoryKey(userId);
  const DISMISSED_KEY = getDismissedKey(userId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AIAlertsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoricAlert[]>([]);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(getDismissedKey(userId));
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch (e) {
      console.error("Error loading alert history:", e);
    }
  }, []);

  const saveToHistory = useCallback((alertsData: AIAlertsData) => {
    const newHistoryItems: HistoricAlert[] = [
      ...alertsData.blindSpotAlerts.map(a => ({ ...a, type: "blind_spot" as const, generatedAt: alertsData.lastGenerated })),
      ...alertsData.predictiveAlerts.map(a => ({ ...a, type: "predictive" as const, generatedAt: alertsData.lastGenerated })),
    ];
    setHistory(prev => {
      const existingKeys = new Set(prev.map(h => `${h.title}|${h.message}`));
      const uniqueNew = newHistoryItems.filter(n => !existingKeys.has(`${n.title}|${n.message}`));
      const updated = [...uniqueNew, ...prev].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loadCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsed.cachedAt).getTime();
        if (cacheAge < CACHE_DURATION_MS) {
          const lastInteraction = lastInteractionTime ? new Date(lastInteractionTime).getTime() : 0;
          const cacheTime = new Date(parsed.cachedAt).getTime();
          if (lastInteraction < cacheTime) {
            setData(parsed.data);
            return true;
          }
        }
      }
    } catch (e) {
      console.error("Error loading cached AI alerts:", e);
    }
    return false;
  }, [lastInteractionTime]);

  const fetchAlerts = useCallback(async (force = false) => {
    if (!force && loadCachedData()) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Not authenticated"); return; }
      const response = await supabase.functions.invoke("generate-ai-alerts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data.error) {
        if (response.data.error.includes("Rate limit")) {
          toast({ title: "Please wait", description: "AI is processing. Try again in a moment.", variant: "default" });
        } else if (response.data.error.includes("credits")) {
          toast({ title: "AI Credits Low", description: "Please add funds to continue using AI features.", variant: "destructive" });
        }
        throw new Error(response.data.error);
      }
      const alertsData: AIAlertsData = response.data;
      setData(alertsData);
      saveToHistory(alertsData);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: alertsData, cachedAt: new Date().toISOString() }));
    } catch (e) {
      console.error("Error fetching AI alerts:", e);
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [toast, loadCachedData, saveToHistory]);

  useEffect(() => {
    if (candidateCount > 0 && interactionCount > 0) fetchAlerts();
  }, [candidateCount, interactionCount, fetchAlerts]);

  useEffect(() => {
    if (lastInteractionTime && candidateCount > 0 && interactionCount > 0) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const lastInteraction = new Date(lastInteractionTime).getTime();
        const cacheTime = new Date(parsed.cachedAt).getTime();
        if (lastInteraction > cacheTime) fetchAlerts(true);
      }
    }
  }, [lastInteractionTime, candidateCount, interactionCount, fetchAlerts]);

  const dismissAlert = (alertKey: string) => {
    setDismissedKeys(prev => {
      const newSet = new Set(prev);
      newSet.add(alertKey);
      try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...newSet])); } catch {}
      return newSet;
    });
  };

  const toggleExpanded = (alertKey: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertKey)) newSet.delete(alertKey);
      else newSet.add(alertKey);
      return newSet;
    });
  };

  if (candidateCount === 0) return null;

  const allAlerts = [
    ...(data?.blindSpotAlerts || []).map(a => ({ ...a, type: "blind_spot" as const })),
    ...(data?.predictiveAlerts || []).map(a => ({ ...a, type: "predictive" as const })),
  ];

  const getAlertDismissKey = (alert: typeof allAlerts[0]) => `${alert.title}|${alert.message}`;
  const visibleAlerts = allAlerts.filter(a => !dismissedKeys.has(getAlertDismissKey(a)));
  const hasAlerts = visibleAlerts.length > 0;
  const displayedAlerts = showAll ? visibleAlerts : visibleAlerts.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreAlerts = visibleAlerts.length > INITIAL_DISPLAY_COUNT;

  const renderAlert = (alert: typeof allAlerts[0], idx: number, isHistory = false, generatedAt?: string) => {
    const alertKey = `${alert.type}-${idx}-${isHistory ? 'history' : 'current'}`;
    const dismissKey = getAlertDismissKey(alert);
    const styles = severityConfig[alert.severity] || severityConfig.info;
    const isExpanded = expandedAlerts.has(alertKey);
    
    return (
      <motion.div
        key={alertKey}
        initial={{ opacity: 0, x: -12, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 12, scale: 0.97 }}
        transition={{ duration: 0.35, delay: idx * 0.08, type: "spring", stiffness: 300, damping: 25 }}
        className={`w-full rounded-xl p-3 border transition-all duration-300 ${styles.bg} ${styles.border} ${styles.glow} hover:scale-[1.01]`}
      >
        <div className="flex items-start gap-2.5">
          <motion.div 
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${styles.iconBg} ${styles.icon}`}
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: idx * 0.08 + 0.15 }}
          >
            {alert.type === "blind_spot" ? (
              <Eye className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] uppercase tracking-wider font-bold ${styles.icon}`}>
                {alert.type === "blind_spot" ? "Blind Spot" : "Prediction"}
              </span>
              {/* Severity dot */}
              <motion.span 
                className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}
                animate={{ scale: alert.severity === "urgent" ? [1, 1.5, 1] : 1 }}
                transition={{ duration: 1.5, repeat: alert.severity === "urgent" ? Infinity : 0 }}
              />
              {alert.candidateNickname && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  • {alert.candidateNickname}
                </span>
              )}
              {isHistory && generatedAt && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(generatedAt).toLocaleDateString()}
                </span>
              )}
              {!isHistory && (
                <button
                  onClick={(e) => { e.stopPropagation(); dismissAlert(dismissKey); }}
                  className="ml-auto p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-start justify-between gap-1 mt-0.5">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {alert.title}
              </p>
              <VoicePlayButton 
                text={`${alert.title}. ${alert.message}`} 
                size="sm" 
                variant="icon" 
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
            <p className={`text-xs text-muted-foreground leading-relaxed mt-0.5 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {alert.message}
            </p>
            
            {(alert.message.length > 100 || alert.candidateId) && (
              <div className="flex items-center gap-3 mt-1.5">
                {alert.message.length > 100 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleExpanded(alertKey); }}
                    className="text-[10px] text-primary font-medium hover:underline flex items-center gap-0.5"
                  >
                    {isExpanded ? <>Less <ChevronUp className="w-3 h-3" /></> : <>More <ChevronDown className="w-3 h-3" /></>}
                  </button>
                )}
                {alert.candidateId && (
                  <button
                    onClick={() => navigate(`/candidate/${alert.candidateId}`)}
                    className="text-[10px] text-primary font-medium hover:underline flex items-center ml-auto gap-0.5"
                  >
                    View Profile <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative">
      {/* Animated glow orbs */}
      <motion.div
        className="absolute top-0 right-0 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none"
        animate={{ 
          x: [0, 15, -10, 0], 
          y: [0, -10, 5, 0],
          opacity: [0.4, 0.7, 0.5, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/8 rounded-full blur-3xl pointer-events-none"
        animate={{ 
          x: [0, -10, 12, 0], 
          y: [0, 8, -5, 0],
          opacity: [0.3, 0.6, 0.4, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Header */}
      <div className="relative py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-[var(--shadow-soft)]"
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain className="w-4 h-4 text-primary-foreground" />
            </motion.div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">AI Insights</span>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                </motion.div>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                Blind spots & predictions powered by AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" disabled={history.length === 0}>
                  <History className="w-3.5 h-3.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader className="pb-3">
                  <SheetTitle className="flex items-center gap-2 text-sm">
                    <History className="w-4 h-4" />
                    Insight History
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(70vh-70px)]">
                  {history.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-muted-foreground">No history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {history.map((alert, idx) => renderAlert(
                        { ...alert, type: alert.type }, idx, true, alert.generatedAt
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchAlerts(true)}
              disabled={loading}
              className="h-7 w-7 p-0 rounded-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="space-y-2 pt-0 px-4 pb-3 relative">
        {interactionCount === 0 ? (
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-3 shadow-[var(--shadow-soft)]"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain className="w-7 h-7 text-primary" />
            </motion.div>
            <p className="text-sm font-semibold text-foreground mb-1">Log your first interaction</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-[200px] mx-auto">
              AI insights appear after you log interactions with candidates
            </p>
            {onLogInteraction && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button size="sm" onClick={onLogInteraction} className="h-9 px-5 text-xs rounded-xl shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Log Interaction
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : loading && !data ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : error && !data ? (
          <motion.div 
            className="text-center py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-xs text-muted-foreground mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchAlerts(true)} className="h-8 text-xs rounded-xl">
              Try Again
            </Button>
          </motion.div>
        ) : hasAlerts ? (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayedAlerts.map((alert, idx) => renderAlert(alert, idx))}
            </AnimatePresence>
            
            {hasMoreAlerts && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full text-xs h-8 rounded-xl hover:bg-primary/5"
                >
                  {showAll ? (
                    <>Show Less <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
                  ) : (
                    <>+{visibleAlerts.length - INITIAL_DISPLAY_COUNT} more insights <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div 
            className="text-center py-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-2"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </motion.div>
            <p className="text-sm font-semibold text-foreground">Looking Good!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No concerning patterns detected
            </p>
          </motion.div>
        )}

        {data?.lastGenerated && (
          <motion.p 
            className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Zap className="w-3 h-3" />
            Updated {new Date(data.lastGenerated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
};
