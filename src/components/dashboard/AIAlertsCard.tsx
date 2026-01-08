import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  Eye, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
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
}

const CACHE_KEY = "ai_alerts_cache";
const HISTORY_KEY = "ai_alerts_history";
const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 minutes
const MAX_HISTORY_ITEMS = 50;
const INITIAL_DISPLAY_COUNT = 3;

export const AIAlertsCard: React.FC<AIAlertsCardProps> = ({ 
  candidateCount,
  lastInteractionTime 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AIAlertsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoricAlert[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Error loading alert history:", e);
    }
  }, []);

  const saveToHistory = useCallback((alertsData: AIAlertsData) => {
    const newHistoryItems: HistoricAlert[] = [
      ...alertsData.blindSpotAlerts.map(a => ({ 
        ...a, 
        type: "blind_spot" as const, 
        generatedAt: alertsData.lastGenerated 
      })),
      ...alertsData.predictiveAlerts.map(a => ({ 
        ...a, 
        type: "predictive" as const, 
        generatedAt: alertsData.lastGenerated 
      })),
    ];

    setHistory(prev => {
      // Deduplicate by title + message
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
    if (!force && loadCachedData()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke("generate-ai-alerts", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        if (response.data.error.includes("Rate limit")) {
          toast({
            title: "Please wait",
            description: "AI is processing. Try again in a moment.",
            variant: "default",
          });
        } else if (response.data.error.includes("credits")) {
          toast({
            title: "AI Credits Low",
            description: "Please add funds to continue using AI features.",
            variant: "destructive",
          });
        }
        throw new Error(response.data.error);
      }

      const alertsData: AIAlertsData = response.data;
      setData(alertsData);
      saveToHistory(alertsData);

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: alertsData,
        cachedAt: new Date().toISOString(),
      }));

    } catch (e) {
      console.error("Error fetching AI alerts:", e);
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [toast, loadCachedData, saveToHistory]);

  useEffect(() => {
    if (candidateCount > 0) {
      fetchAlerts();
    }
  }, [candidateCount, fetchAlerts]);

  useEffect(() => {
    if (lastInteractionTime && candidateCount > 0) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const lastInteraction = new Date(lastInteractionTime).getTime();
        const cacheTime = new Date(parsed.cachedAt).getTime();
        
        if (lastInteraction > cacheTime) {
          fetchAlerts(true);
        }
      }
    }
  }, [lastInteractionTime, candidateCount, fetchAlerts]);

  const toggleExpanded = (alertKey: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertKey)) {
        newSet.delete(alertKey);
      } else {
        newSet.add(alertKey);
      }
      return newSet;
    });
  };

  if (candidateCount === 0) {
    return null;
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "urgent":
        return {
          bg: "bg-destructive/10",
          border: "border-destructive/30",
          icon: "text-destructive",
          iconBg: "bg-destructive/20",
        };
      case "warning":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          icon: "text-amber-600",
          iconBg: "bg-amber-500/20",
        };
      default:
        return {
          bg: "bg-primary/10",
          border: "border-primary/30",
          icon: "text-primary",
          iconBg: "bg-primary/20",
        };
    }
  };

  const allAlerts = [
    ...(data?.blindSpotAlerts || []).map(a => ({ ...a, type: "blind_spot" as const })),
    ...(data?.predictiveAlerts || []).map(a => ({ ...a, type: "predictive" as const })),
  ];

  const hasAlerts = allAlerts.length > 0;
  const displayedAlerts = showAll ? allAlerts : allAlerts.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreAlerts = allAlerts.length > INITIAL_DISPLAY_COUNT;

  const renderAlert = (alert: typeof allAlerts[0], idx: number, isHistory = false, generatedAt?: string) => {
    const alertKey = `${alert.type}-${idx}-${isHistory ? 'history' : 'current'}`;
    const styles = getSeverityStyles(alert.severity);
    const isExpanded = expandedAlerts.has(alertKey);
    
    return (
      <div
        key={alertKey}
        className={`w-full text-left rounded-md p-2 border transition-all ${styles.bg} ${styles.border}`}
      >
        <div className="flex items-start gap-2">
          <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${styles.iconBg} ${styles.icon}`}>
            {alert.type === "blind_spot" ? (
              <Eye className="w-3 h-3" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`text-[9px] uppercase tracking-wide font-medium ${styles.icon}`}>
                {alert.type === "blind_spot" ? "Blind Spot" : "Prediction"}
              </span>
              {alert.candidateNickname && (
                <span className="text-[9px] text-muted-foreground">
                  • {alert.candidateNickname}
                </span>
              )}
              {isHistory && generatedAt && (
                <span className="text-[9px] text-muted-foreground ml-auto">
                  {new Date(generatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-foreground leading-tight">
              {alert.title}
            </p>
            <p className={`text-[11px] text-muted-foreground leading-snug ${isExpanded ? '' : 'line-clamp-2'}`}>
              {alert.message}
            </p>
            
            {(alert.message.length > 100 || alert.candidateId) && (
              <div className="flex items-center gap-2 mt-1">
                {alert.message.length > 100 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(alertKey);
                    }}
                    className="text-[9px] text-primary hover:underline flex items-center"
                  >
                    {isExpanded ? (
                      <>Less <ChevronUp className="w-2.5 h-2.5" /></>
                    ) : (
                      <>More <ChevronDown className="w-2.5 h-2.5" /></>
                    )}
                  </button>
                )}
                {alert.candidateId && (
                  <button
                    onClick={() => navigate(`/candidate/${alert.candidateId}`)}
                    className="text-[9px] text-primary hover:underline flex items-center ml-auto"
                  >
                    View <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-[image:var(--gradient-hero)] flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xs font-semibold">AI Insights</span>
              <p className="text-[9px] text-muted-foreground font-normal leading-none">
                Blind spots & predictions
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={history.length === 0}
                >
                  <History className="w-3 h-3" />
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
                    <div className="space-y-1.5 pr-4">
                      {history.map((alert, idx) => renderAlert(
                        { ...alert, type: alert.type },
                        idx,
                        true,
                        alert.generatedAt
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
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-1.5 pt-0 px-3 pb-2">
        {loading && !data ? (
          <div className="space-y-1.5">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : error && !data ? (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAlerts(true)}
              className="mt-1.5 h-7 text-xs"
            >
              Try Again
            </Button>
          </div>
        ) : hasAlerts ? (
          <div className="space-y-1.5">
            {displayedAlerts.map((alert, idx) => renderAlert(alert, idx))}
            
            {hasMoreAlerts && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-[10px] h-6"
              >
                {showAll ? (
                  <>Less <ChevronUp className="w-3 h-3 ml-0.5" /></>
                ) : (
                  <>+{allAlerts.length - INITIAL_DISPLAY_COUNT} more <ChevronDown className="w-3 h-3 ml-0.5" /></>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-foreground">Looking Good!</p>
            <p className="text-[10px] text-muted-foreground">
              No concerning patterns detected.
            </p>
          </div>
        )}

        {data?.lastGenerated && (
          <p className="text-[9px] text-muted-foreground text-center">
            <Zap className="w-2.5 h-2.5 inline mr-0.5" />
            {new Date(data.lastGenerated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
