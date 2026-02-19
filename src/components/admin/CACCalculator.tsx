import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, TrendingDown, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Channel {
  id: string;
  name: string;
  spend: string;
  conversions: string;
  impressions: string;
}

const DEFAULT_CHANNELS: Channel[] = [
  { id: "1", name: "Instagram / Meta Ads", spend: "", conversions: "", impressions: "" },
  { id: "2", name: "TikTok Ads", spend: "", conversions: "", impressions: "" },
  { id: "3", name: "Google Search Ads", spend: "", conversions: "", impressions: "" },
  { id: "4", name: "Influencer Campaigns", spend: "", conversions: "", impressions: "" },
];

const fmt = (n: number) => (isNaN(n) || !isFinite(n) ? "—" : `$${n.toFixed(2)}`);

export const CACCalculator = () => {
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);

  const addChannel = () => {
    setChannels((c) => [
      ...c,
      { id: Date.now().toString(), name: "New Channel", spend: "", conversions: "", impressions: "" },
    ]);
  };

  const removeChannel = (id: string) => {
    setChannels((c) => c.filter((ch) => ch.id !== id));
  };

  const updateChannel = (id: string, field: keyof Channel, value: string) => {
    setChannels((c) =>
      c.map((ch) => (ch.id === id ? { ...ch, [field]: value } : ch))
    );
  };

  const calc = channels.map((ch) => {
    const spend = parseFloat(ch.spend) || 0;
    const conv = parseFloat(ch.conversions) || 0;
    const imp = parseFloat(ch.impressions) || 0;
    const cac = conv > 0 ? spend / conv : NaN;
    const ctr = imp > 0 ? (conv / imp) * 100 : NaN;
    return { ...ch, spend, conv, cac, ctr };
  });

  const totalSpend = calc.reduce((s, c) => s + c.spend, 0);
  const totalConv = calc.reduce((s, c) => s + c.conv, 0);
  const blendedCAC = totalConv > 0 ? totalSpend / totalConv : NaN;

  const chartData = calc
    .filter((c) => c.spend > 0)
    .map((c) => ({ name: c.name, CAC: isFinite(c.cac) ? c.cac : 0, Spend: c.spend }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Customer Acquisition Cost (CAC) Calculator</h2>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" />Total Marketing Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />Total Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalConv.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20 col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />Blended CAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{fmt(blendedCAC)}</div>
            <p className="text-xs text-muted-foreground">per acquired user</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Inputs */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Marketing Channels</CardTitle>
          <Button size="sm" variant="outline" onClick={addChannel}>
            <Plus className="w-3 h-3 mr-1" />
            Add Channel
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map((ch) => {
            const row = calc.find((c) => c.id === ch.id)!;
            return (
              <div key={ch.id} className="border border-border rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={ch.name}
                    onChange={(e) => updateChannel(ch.id, "name", e.target.value)}
                    className="font-medium text-sm h-8"
                    placeholder="Channel name"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                    onClick={() => removeChannel(ch.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ad Spend ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={ch.spend}
                      onChange={(e) => updateChannel(ch.id, "spend", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">New Users (conversions)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={ch.conversions}
                      onChange={(e) => updateChannel(ch.id, "conversions", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Impressions (optional)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={ch.impressions}
                      onChange={(e) => updateChannel(ch.id, "impressions", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap text-xs">
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground">CAC:</span>
                    <Badge variant="secondary" className="font-mono">{fmt(row.cac)}</Badge>
                  </span>
                  {isFinite(row.ctr) && (
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground">Conv. Rate:</span>
                      <Badge variant="secondary" className="font-mono">{row.ctr.toFixed(2)}%</Badge>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* CAC Bar Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">CAC by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `$${v}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    width={130}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(v: number, n: string) => [`$${v.toFixed(2)}`, n]}
                  />
                  <Bar dataKey="CAC" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
