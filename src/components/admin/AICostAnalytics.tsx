import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Mic,
  Brain,
  Users,
  TrendingUp,
  Loader2,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Pricing constants ─────────────────────────────────────────────────────
// ElevenLabs Pro: $99/mo, 500k credits. Turbo model = ~500 chars/credit.
// Additional overage: $0.12 / 1000 chars (turbo/flash)
const EL_PLAN_MONTHLY_COST = 99; // USD
const EL_INCLUDED_CHARS = 500_000; // characters (turbo model ~1 char per credit)
const EL_OVERAGE_PER_1000_CHARS = 0.12;

// Gemini 2.5 Flash (via Lovable AI gateway) estimated pricing:
// ~$0.075 / 1M input tokens, ~$0.30 / 1M output tokens
// Typical D.E.V.I. turn: ~1,200 input tokens + ~500 output tokens
const GEMINI_INPUT_COST_PER_1M = 0.075;
const GEMINI_OUTPUT_COST_PER_1M = 0.30;
const AVG_INPUT_TOKENS_PER_MSG = 1200;
const AVG_OUTPUT_TOKENS_PER_MSG = 500;

// Avg TTS chars per Devi response (~300 characters spoken)
const AVG_TTS_CHARS_PER_PLAYBACK = 300;

// ─── Types ──────────────────────────────────────────────────────────────────
interface MonthlyData {
  month: string;        // "Jan 2025"
  monthKey: string;     // "2025-01"
  aiMessages: number;   // assistant messages (AI calls)
  ttsPlaybacks: number; // estimated voice plays
  geminiCost: number;
  ttsCost: number;
  totalCost: number;
  activeUsers: number;
  costPerUser: number;
}

interface UserCostRow {
  userId: string;
  messages: number;
  estimatedCost: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function calcGeminiCost(messages: number): number {
  const inputTokens = messages * AVG_INPUT_TOKENS_PER_MSG;
  const outputTokens = messages * AVG_OUTPUT_TOKENS_PER_MSG;
  return (
    (inputTokens / 1_000_000) * GEMINI_INPUT_COST_PER_1M +
    (outputTokens / 1_000_000) * GEMINI_OUTPUT_COST_PER_1M
  );
}

function calcTTSCost(playbacks: number, includedCharsRemaining: number): number {
  const totalChars = playbacks * AVG_TTS_CHARS_PER_PLAYBACK;
  const overageChars = Math.max(0, totalChars - includedCharsRemaining);
  return (overageChars / 1000) * EL_OVERAGE_PER_1000_CHARS;
}

// ─── Component ──────────────────────────────────────────────────────────────
export const AICostAnalytics = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topUsers, setTopUsers] = useState<UserCostRow[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalGeminiCost: 0,
    totalTTSCost: 0,
    totalMessages: 0,
    avgCostPerUser: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostData();
  }, []);

  const fetchCostData = async () => {
    setLoading(true);
    try {
      // Fetch last 6 months of AI assistant messages
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: messages } = await supabase
        .from("devi_messages")
        .select("user_id, role, created_at, content")
        .eq("role", "assistant")          // only AI-generated responses
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true });

      if (!messages) {
        setLoading(false);
        return;
      }

      // Build month buckets for last 6 months
      const buckets = new Map<string, { messages: number; users: Set<string> }>();
      const last6Months: string[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        last6Months.push(key);
        buckets.set(key, { messages: 0, users: new Set() });
      }

      // Tally messages per month
      const userMessageCounts = new Map<string, number>();
      messages.forEach((msg) => {
        const d = new Date(msg.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (buckets.has(key)) {
          buckets.get(key)!.messages++;
          buckets.get(key)!.users.add(msg.user_id);
        }
        userMessageCounts.set(
          msg.user_id,
          (userMessageCounts.get(msg.user_id) || 0) + 1
        );
      });

      // ElevenLabs: distribute 500k chars across months proportionally,
      // then calculate overage per month
      const totalAIMessages = Array.from(buckets.values()).reduce(
        (s, b) => s + b.messages,
        0
      );
      // Estimate TTS plays as ~40% of assistant messages (users who opt in to voice)
      const TTS_RATE = 0.4;

      let includedCharsLeft = EL_INCLUDED_CHARS;
      const monthly: MonthlyData[] = last6Months.map((key) => {
        const bucket = buckets.get(key)!;
        const aiMessages = bucket.messages;
        const ttsPlaybacks = Math.round(aiMessages * TTS_RATE);
        const ttsChars = ttsPlaybacks * AVG_TTS_CHARS_PER_PLAYBACK;

        const geminiCost = calcGeminiCost(aiMessages);

        // Deduct from included chars first
        const charsUsedFromIncluded = Math.min(includedCharsLeft, ttsChars);
        includedCharsLeft = Math.max(0, includedCharsLeft - ttsChars);
        const overageChars = ttsChars - charsUsedFromIncluded;
        const ttsCost = (overageChars / 1000) * EL_OVERAGE_PER_1000_CHARS;

        const activeUsers = bucket.users.size;
        const totalCost = geminiCost + ttsCost;
        const costPerUser = activeUsers > 0 ? totalCost / activeUsers : 0;

        const [year, month] = key.split("-");
        const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });

        return {
          month: label,
          monthKey: key,
          aiMessages,
          ttsPlaybacks,
          geminiCost,
          ttsCost,
          totalCost,
          activeUsers,
          costPerUser,
        };
      });

      setMonthlyData(monthly);

      // Top 10 users by cost
      const userRows: UserCostRow[] = Array.from(userMessageCounts.entries())
        .map(([userId, count]) => ({
          userId: userId.slice(0, 8) + "…",
          messages: count,
          estimatedCost: calcGeminiCost(count) + calcTTSCost(Math.round(count * TTS_RATE), 0),
        }))
        .sort((a, b) => b.estimatedCost - a.estimatedCost)
        .slice(0, 10);

      setTopUsers(userRows);

      const totGemini = monthly.reduce((s, m) => s + m.geminiCost, 0);
      const totTTS = monthly.reduce((s, m) => s + m.ttsCost, 0);
      const totMsgs = monthly.reduce((s, m) => s + m.aiMessages, 0);
      const allUsers = new Set(messages.map((m) => m.user_id)).size;

      setTotalStats({
        totalGeminiCost: totGemini,
        totalTTSCost: totTTS,
        totalMessages: totMsgs,
        avgCostPerUser: allUsers > 0 ? (totGemini + totTTS) / allUsers : 0,
        activeUsers: allUsers,
      });
    } catch (err) {
      console.error("Error fetching AI cost data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const fmt = (n: number) =>
    n < 0.01 ? "<$0.01" : `$${n.toFixed(2)}`;

  const currentMonth = monthlyData[monthlyData.length - 1];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Cost Analytics</h2>
          <UITooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Estimates based on Gemini 2.5 Flash pricing ($0.075/1M input, $0.30/1M output tokens)
              and ElevenLabs Pro plan ($99/mo, 500k chars included, $0.12/1k overage on turbo model).
              TTS estimated at 40% voice playback rate, ~300 chars/response.
            </TooltipContent>
          </UITooltip>
        </div>

        {/* Pricing Reference Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Gemini AI (D.E.V.I. Chat)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Input tokens</span>
                <span className="font-mono">$0.075 / 1M tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Output tokens</span>
                <span className="font-mono">$0.30 / 1M tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. per message</span>
                <span className="font-mono font-semibold text-primary">
                  ~{fmt(calcGeminiCost(1))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Mic className="w-3 h-3" />
                ElevenLabs TTS (Voice Playback)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan cost</span>
                <span className="font-mono">$99 / month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Included chars (turbo)</span>
                <span className="font-mono">500,000 / month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overage rate</span>
                <span className="font-mono">$0.12 / 1k chars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. per playback (~300 chars)</span>
                <span className="font-mono font-semibold text-primary">~$0.036 over quota</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Brain className="w-3 h-3" />
                6-Mo Gemini Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {fmt(totalStats.totalGeminiCost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalStats.totalMessages.toLocaleString()} AI responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Mic className="w-3 h-3" />
                6-Mo TTS Overage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {fmt(totalStats.totalTTSCost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                + $99/mo base plan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Avg Cost / User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {fmt(totalStats.avgCostPerUser)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {totalStats.activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {currentMonth ? fmt(currentMonth.totalCost) : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentMonth
                  ? `${currentMonth.aiMessages} msgs · ${currentMonth.activeUsers} users`
                  : "No data"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Cost Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Monthly AI Costs — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      `$${value.toFixed(4)}`,
                      name === "geminiCost" ? "Gemini AI" : "ElevenLabs TTS",
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "geminiCost" ? "Gemini AI" : "ElevenLabs TTS Overage"
                    }
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                  <Bar
                    dataKey="geminiCost"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="ttsCost"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Month-by-Month Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Month-by-Month Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-3 font-medium">Month</th>
                    <th className="text-right py-2 pr-3 font-medium">AI Msgs</th>
                    <th className="text-right py-2 pr-3 font-medium">TTS Plays</th>
                    <th className="text-right py-2 pr-3 font-medium">Active Users</th>
                    <th className="text-right py-2 pr-3 font-medium">Gemini Cost</th>
                    <th className="text-right py-2 pr-3 font-medium">TTS Overage</th>
                    <th className="text-right py-2 pr-3 font-medium">Total</th>
                    <th className="text-right py-2 font-medium">Per User</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row, i) => (
                    <tr
                      key={row.monthKey}
                      className={`border-b border-border/50 ${
                        i === monthlyData.length - 1
                          ? "bg-primary/5 font-medium"
                          : ""
                      }`}
                    >
                      <td className="py-2 pr-3">
                        {row.month}
                        {i === monthlyData.length - 1 && (
                          <Badge variant="secondary" className="ml-1 text-[10px] py-0">
                            Current
                          </Badge>
                        )}
                      </td>
                      <td className="text-right py-2 pr-3 tabular-nums">
                        {row.aiMessages.toLocaleString()}
                      </td>
                      <td className="text-right py-2 pr-3 tabular-nums">
                        {row.ttsPlaybacks.toLocaleString()}
                      </td>
                      <td className="text-right py-2 pr-3 tabular-nums">
                        {row.activeUsers}
                      </td>
                      <td className="text-right py-2 pr-3 tabular-nums text-primary">
                        {fmt(row.geminiCost)}
                      </td>
                      <td className="text-right py-2 pr-3 tabular-nums text-chart-2">
                        {fmt(row.ttsCost)}
                      </td>
                      <td className="text-right py-2 pr-3 tabular-nums font-semibold">
                        {fmt(row.totalCost)}
                      </td>
                      <td className="text-right py-2 tabular-nums text-muted-foreground">
                        {fmt(row.costPerUser)}
                      </td>
                    </tr>
                  ))}
                  {/* ElevenLabs plan base cost note */}
                  <tr className="border-t border-border bg-muted/30">
                    <td colSpan={6} className="py-2 pr-3 text-muted-foreground italic">
                      + ElevenLabs Pro base plan (500k chars/mo included)
                    </td>
                    <td className="text-right py-2 pr-3 font-semibold">
                      ${EL_PLAN_MONTHLY_COST}/mo
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Users by AI Cost */}
        {topUsers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Top 10 Users by Estimated AI Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topUsers.map((user, i) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span className="text-muted-foreground w-4 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="font-mono text-muted-foreground flex-1">
                      {user.userId}
                    </span>
                    <span className="text-muted-foreground">
                      {user.messages} msgs
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {fmt(user.estimatedCost)}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                User IDs are truncated for privacy. Costs are estimates based on
                message counts and average token assumptions.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};
