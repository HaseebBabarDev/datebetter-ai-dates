import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronDown, ChevronUp, Sparkles, MessageCircle } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/button";

interface HealingScore {
  id: string;
  score: number;
  previous_score: number | null;
  score_change: number | null;
  ai_insights: string | null;
  created_at: string;
  trigger_type: string;
}

interface HealingProgressChartProps {
  compact?: boolean;
  showInsights?: boolean;
}

export const HealingProgressChart: React.FC<HealingProgressChartProps> = ({ compact = false, showInsights = false }) => {
  const { user } = useAuth();
  const [scores, setScores] = useState<HealingScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedScore, setSelectedScore] = useState<HealingScore | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);

  useEffect(() => {
    if (user) {
      fetchScores();
    }
  }, [user]);

  const fetchScores = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("healing_scores")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(30);

    if (!error && data) {
      setScores(data as HealingScore[]);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Loading history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scores.length < 2) {
    return null; // Need at least 2 data points for a chart
  }

  // Prepare chart data
  const chartData = scores.map((score) => ({
    date: format(parseISO(score.created_at), "MMM d"),
    fullDate: format(parseISO(score.created_at), "MMM d, yyyy h:mm a"),
    score: score.score,
    change: score.score_change,
    insights: score.ai_insights,
    id: score.id,
  }));

  // Calculate stats
  const latestScore = scores[scores.length - 1];
  const firstScore = scores[0];
  const overallChange = latestScore.score - firstScore.score;
  const averageScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
  const highestScore = Math.max(...scores.map(s => s.score));
  const lowestScore = Math.min(...scores.map(s => s.score));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-[200px]">
          <p className="text-xs text-muted-foreground">{data.fullDate}</p>
          <p className="text-lg font-bold text-foreground">{data.score}%</p>
          {data.change !== null && data.change !== 0 && (
            <p className={`text-xs flex items-center gap-1 ${data.change > 0 ? 'text-green-500' : 'text-rose-500'}`}>
              {data.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {data.change > 0 ? '+' : ''}{data.change} from previous
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            View Progress History ({scores.length} entries)
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        
        {expanded && (
          <div className="animate-fade-in space-y-3">
            {/* Mini chart */}
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="healingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={75} stroke="hsl(var(--primary))" strokeDasharray="5 5" opacity={0.5} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#healingGradient)"
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                    activeDot={{ fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))", r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{averageScore}%</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-green-500">{highestScore}%</p>
                <p className="text-xs text-muted-foreground">Highest</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <div className={`text-lg font-bold flex items-center justify-center gap-1 ${
                  overallChange > 0 ? 'text-green-500' : overallChange < 0 ? 'text-rose-500' : 'text-muted-foreground'
                }`}>
                  {overallChange > 0 ? <TrendingUp className="w-4 h-4" /> : overallChange < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  {overallChange > 0 ? '+' : ''}{overallChange}
                </div>
                <p className="text-xs text-muted-foreground">Overall</p>
              </div>
            </div>

            {/* Date range indicator */}
            <p className="text-xs text-center text-muted-foreground">
              {format(parseISO(firstScore.created_at), "MMM d, yyyy")} — {format(parseISO(latestScore.created_at), "MMM d, yyyy")}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Healing Progress</span>
          <div className={`flex items-center gap-1 text-sm ${
            overallChange > 0 ? 'text-green-500' : overallChange < 0 ? 'text-rose-500' : 'text-muted-foreground'
          }`}>
            {overallChange > 0 ? <TrendingUp className="w-4 h-4" /> : overallChange < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            {overallChange > 0 ? '+' : ''}{overallChange}% overall
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="healingGradientFull" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }} 
                className="text-muted-foreground"
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 11 }} 
                className="text-muted-foreground"
                tickLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={75} stroke="hsl(var(--primary))" strokeDasharray="5 5" opacity={0.5} label={{ value: "Ready", position: "right", fontSize: 10, fill: "hsl(var(--primary))" }} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#healingGradientFull)"
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                activeDot={{ fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))", r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{latestScore.score}%</p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{averageScore}%</p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold text-green-500">{highestScore}%</p>
            <p className="text-xs text-muted-foreground">Peak</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold text-rose-400">{lowestScore}%</p>
            <p className="text-xs text-muted-foreground">Low</p>
          </div>
        </div>

        {/* Journey summary */}
        <div className="p-3 rounded-lg bg-primary/5 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{scores.length} check-ins</span> since{" "}
            {format(parseISO(firstScore.created_at), "MMMM d, yyyy")}.
            {overallChange > 0 && " You're making progress! 💪"}
            {overallChange < 0 && " Healing isn't linear - keep going. 💜"}
            {overallChange === 0 && " Stay consistent with your healing work."}
          </p>
        </div>

        {/* AI Insights History */}
        {showInsights && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                D.E.V.I.'s Insights
              </h4>
              {scores.filter(s => s.ai_insights).length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAllInsights(!showAllInsights)}
                  className="h-7 text-xs"
                >
                  {showAllInsights ? 'Show Less' : `View All (${scores.filter(s => s.ai_insights).length})`}
                </Button>
              )}
            </div>
            <ScrollArea className={showAllInsights ? "h-[400px]" : undefined}>
              <div className="space-y-2">
                {(showAllInsights ? scores : scores.slice(-3))
                  .filter(s => s.ai_insights)
                  .reverse()
                  .map((score) => (
                    <div 
                      key={score.id}
                      className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${
                          score.score >= 75 ? 'text-green-500' : 
                          score.score >= 50 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {score.score}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(score.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {score.ai_insights}
                      </p>
                      {score.score_change !== null && score.score_change !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${
                          score.score_change > 0 ? 'text-green-500' : 'text-rose-500'
                        }`}>
                          {score.score_change > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {score.score_change > 0 ? '+' : ''}{score.score_change} from previous
                        </div>
                      )}
                    </div>
                  ))}
                {scores.filter(s => s.ai_insights).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No insights yet. Chat with D.E.V.I. about your healing to get personalized insights.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealingProgressChart;