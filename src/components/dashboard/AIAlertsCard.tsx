import React, { useEffect, useState, useCallback } from "react";
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

const severityStyles = {
  urgent: {
    pill: "bg-destructive/15 text-destructive border border-destructive/25",
    accent: "border-l-destructive shadow-[inset_0_0_12px_hsl(var(--destructive)/0.06)]",
    dot: "bg-destructive animate-pulse",
    card: "shadow-sm shadow-destructive/10",
  },
  warning: {
    pill: "bg-caution/15 text-foreground border border-caution/30",
    accent: "border-l-caution shadow-[inset_0_0_12px_hsl(var(--caution)/0.08)]",
    dot: "bg-caution",
    card: "shadow-sm shadow-caution/10",
  },
  info: {
    pill: "bg-primary/10 text-primary border border-primary/20",
    accent: "border-l-primary shadow-[inset_0_0_12px_hsl(var(--primary)/0.05)]",
    dot: "bg-primary",
    card: "shadow-sm shadow-primary/10",
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
    const styles = severityStyles[alert.severity] || severityStyles.info;
    const isExpanded = expandedAlerts.has(alertKey);
    
    return (
      <motion.div
        key={alertKey}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 6 }}
        transition={{ duration: 0.2, delay: idx * 0.04 }}
        className={`border-l-[3px] ${styles.accent} ${(styles as any).card || ''} bg-card/70 backdrop-blur-sm rounded-r-xl px-3 py-2.5 group border border-border/40 hover:border-border/70 transition-all duration-200`}
      >
        {/* Top row: type pill + meta */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-full ${styles.pill}`}>
            {alert.type === "blind_spot" ? <Eye className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
            {alert.type === "blind_spot" ? "Blind Spot" : "Prediction"}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
          {alert.candidateNickname && (
            <span className="text-[10px] text-muted-foreground truncate">{alert.candidateNickname}</span>
          )}
          <div className="ml-auto flex items-center gap-0.5 shrink-0">
            {isHistory && generatedAt && (
              <span className="text-[9px] text-muted-foreground">{new Date(generatedAt).toLocaleDateString()}</span>
            )}
            <VoicePlayButton 
              text={`${alert.title}. ${alert.message}`} 
              size="sm" 
              variant="icon" 
              className="opacity-0 group-hover:opacity-70 transition-opacity w-6 h-6"
            />
            {!isHistory && (
              <button
                onClick={(e) => { e.stopPropagation(); dismissAlert(dismissKey); }}
                className="opacity-0 group-hover:opacity-70 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <p className="text-[13px] font-semibold text-foreground leading-tight">{alert.title}</p>

        {/* Message */}
        <p className={`text-xs text-muted-foreground leading-relaxed mt-0.5 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {alert.message}
        </p>
        
        {/* Actions row */}
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
                View <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <section className="space-y-1.5">
      {/* Header row */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none">AI Predictions</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Blind spots & pattern alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={history.length === 0}>
                <History className="w-3.5 h-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader className="pb-3">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <History className="w-4 h-4" /> Insight History
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(70vh-70px)]">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No history yet</p>
                ) : (
                  <div className="space-y-1.5 pr-4">
                    {history.map((alert, idx) => renderAlert({ ...alert, type: alert.type }, idx, true, alert.generatedAt))}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchAlerts(true)}
            disabled={loading}
            className="h-7 w-7 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden shadow-md shadow-primary/5">
        {interactionCount === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Log your first interaction</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-[200px] mx-auto">
              AI insights appear after you log interactions
            </p>
            {onLogInteraction && (
              <Button size="sm" onClick={onLogInteraction} className="h-8 px-4 text-xs rounded-lg">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Log Interaction
              </Button>
            )}
          </div>
        ) : loading && !data ? (
          <div className="p-3 space-y-1.5">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : error && !data ? (
          <div className="text-center py-6 px-4">
            <p className="text-xs text-muted-foreground mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchAlerts(true)} className="h-7 text-xs rounded-lg">
              Try Again
            </Button>
          </div>
        ) : hasAlerts ? (
          <div className="p-2 space-y-1">
            <AnimatePresence mode="popLayout">
              {displayedAlerts.map((alert, idx) => renderAlert(alert, idx))}
            </AnimatePresence>
            
            {hasMoreAlerts && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-[11px] h-7 rounded-lg text-muted-foreground hover:text-foreground"
              >
                {showAll ? (
                  <>Show less <ChevronUp className="w-3 h-3 ml-1" /></>
                ) : (
                  <>+{visibleAlerts.length - INITIAL_DISPLAY_COUNT} more <ChevronDown className="w-3 h-3 ml-1" /></>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-5 h-5 text-success" />
            </div>
            <p className="text-sm font-semibold text-foreground">Looking Good!</p>
            <p className="text-xs text-muted-foreground mt-0.5">No concerning patterns detected</p>
          </div>
        )}

        {/* Timestamp footer */}
        {data?.lastGenerated && (
          <div className="border-t border-border/40 px-3 py-1.5 flex items-center justify-center gap-1">
            <Zap className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">
              Updated {new Date(data.lastGenerated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
