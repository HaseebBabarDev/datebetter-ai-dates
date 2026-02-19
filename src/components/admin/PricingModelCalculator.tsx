import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Smartphone,
  Brain,
  Mic,
  Megaphone,
  Info,
  Radio,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

// ─── Defaults ───────────────────────────────────────────────────────────────
// Gemini 2.5 Flash pricing
const GEMINI_COST_PER_AI_MSG = (1200 / 1_000_000) * 0.075 + (500 / 1_000_000) * 0.30;
// ElevenLabs turbo, 300 chars/msg, overage only
const TTS_COST_PER_PLAY = (300 / 1000) * 0.12;

interface Inputs {
  mau: string;                // Monthly Active Users
  paidConvRate: string;       // % of MAU that are paid
  avgSubPrice: string;        // avg subscription price (blended)
  appleFeeRate: string;       // App Store fee %
  googleFeeRate: string;      // Play Store fee %
  iosShare: string;           // % of revenue from iOS
  aiMsgsPerUser: string;      // avg AI messages per user/month
  ttsRatePercent: string;     // % of messages with voice playback
  elMonthlyBase: string;      // ElevenLabs monthly plan cost
  marketingSpend: string;     // Total monthly marketing $
  supportCost: string;        // Support/ops cost/month
  otherCost: string;          // Other fixed costs/month
  growth: string;             // Monthly growth % for projections
  months: string;             // Projection months
  // Ad Revenue (AppLovin / AdMob / etc.)
  adEnabled: string;          // "1" = enabled, "0" = disabled
  adEcpm: string;             // effective CPM ($) — revenue per 1,000 impressions
  adImprPerUserDay: string;   // avg ad impressions per free user per day
  adFillRate: string;         // % of impressions actually filled by network
  adFreeUserPct: string;      // % of MAU that are free (see ads)
}

const DEFAULT: Inputs = {
  mau: "500",
  paidConvRate: "30",
  avgSubPrice: "14.99",  // blended avg: Starter $9.99 + Unlimited $19.99
  appleFeeRate: "30",
  googleFeeRate: "15",
  iosShare: "60",
  aiMsgsPerUser: "20",
  ttsRatePercent: "40",
  elMonthlyBase: "99",
  marketingSpend: "2000",
  supportCost: "500",
  otherCost: "200",
  growth: "10",
  months: "12",
  // Ad Revenue defaults (off by default — no numbers yet)
  adEnabled: "0",
  adEcpm: "8",          // AppLovin typical dating-app eCPM range $6–$15
  adImprPerUserDay: "3", // ~3 interstitial/banner impressions per session/day
  adFillRate: "85",      // typical AppLovin fill rate ~80–90%
  adFreeUserPct: "70",   // 70% of MAU are free tier
};

const n = (s: string) => parseFloat(s) || 0;
const fmt = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
// For per-user costs that can be sub-cent, show more precision
const fmtUser = (v: number) => {
  if (v === 0) return "$0.00";
  if (v < 0.01) return `$${v.toFixed(4)}`;
  if (v < 0.10) return `$${v.toFixed(3)}`;
  return fmt(v);
};
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Info className="w-3 h-3 text-muted-foreground inline ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
  tip,
  min = "0",
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  tip?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">
        {label}
        {tip && <InfoTip text={tip} />}
      </Label>
      <div className="relative">
        <Input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm pr-8"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export const PricingModelCalculator = () => {
  const [inp, setInp] = useState<Inputs>(DEFAULT);
  const set = (key: keyof Inputs) => (v: string) => setInp((i) => ({ ...i, [key]: v }));

  // ─── Calculations ──────────────────────────────────────────────────────
  const mau = n(inp.mau);
  const paidUsers = mau * (n(inp.paidConvRate) / 100);
  const grossRevenue = paidUsers * n(inp.avgSubPrice);

  const iosRevenue = grossRevenue * (n(inp.iosShare) / 100);
  const androidRevenue = grossRevenue * (1 - n(inp.iosShare) / 100);
  const appleFee = iosRevenue * (n(inp.appleFeeRate) / 100);
  const googleFee = androidRevenue * (n(inp.googleFeeRate) / 100);
  const platformFees = appleFee + googleFee;

  const aiMsgs = mau * n(inp.aiMsgsPerUser);
  const geminiCost = aiMsgs * GEMINI_COST_PER_AI_MSG;

  const ttsPlays = aiMsgs * (n(inp.ttsRatePercent) / 100);
  const ttsOverage = Math.max(0, ttsPlays * 300 - 500_000); // chars over included
  const ttsCost = n(inp.elMonthlyBase) + (ttsOverage / 1000) * 0.12;

  const marketingSpend = n(inp.marketingSpend);
  const supportCost = n(inp.supportCost);
  const otherCost = n(inp.otherCost);

  // ─── Ad Revenue ─────────────────────────────────────────────────────────
  const adEnabled = inp.adEnabled === "1";
  const freeUsers = mau * (n(inp.adFreeUserPct) / 100);
  const monthlyImpressions = freeUsers * n(inp.adImprPerUserDay) * 30;
  const filledImpressions = monthlyImpressions * (n(inp.adFillRate) / 100);
  const adRevenue = adEnabled ? (filledImpressions / 1000) * n(inp.adEcpm) : 0;

  const totalRevenue = grossRevenue + adRevenue;
  const totalCosts = platformFees + geminiCost + ttsCost + marketingSpend + supportCost + otherCost;
  const netRevenue = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;
  const revenuePerUser = paidUsers > 0 ? netRevenue / paidUsers : 0;

  // ─── Per-Tier Breakdown ────────────────────────────────────────────────
  // Fixed cost per month (ElevenLabs + infra + support + other)
  const fixedCosts = ttsCost + supportCost + otherCost;
  const fixedCostsLabel = `ElevenLabs $${n(inp.elMonthlyBase).toFixed(0)} + Ops $${(supportCost + otherCost).toFixed(0)}`;

  // Detachment Plan is one-time, not recurring — excluded from MAU revenue calc
  const TIERS = [
    {
      name: "Starter",
      price: 9.99,
      recurring: true,
      badge: null,
      aiMsgsLimit: "1,000 msgs/mo",
      candidatesLimit: "10 candidates / 30 score updates",
    },
    {
      name: "Unlimited",
      price: 19.99,
      recurring: true,
      badge: "Most Popular",
      aiMsgsLimit: "Unlimited",
      candidatesLimit: "Unlimited",
    },
    {
      name: "Detach Plan",
      price: 9.99,
      recurring: false,
      badge: "One-Time",
      aiMsgsLimit: "Included",
      candidatesLimit: "Per candidate",
    },
  ];

  const blendedPlatformRate =
    (n(inp.appleFeeRate) / 100) * (n(inp.iosShare) / 100) +
    (n(inp.googleFeeRate) / 100) * (1 - n(inp.iosShare) / 100);

  const geminiCostPerUser = paidUsers > 0 ? geminiCost / paidUsers : GEMINI_COST_PER_AI_MSG * n(inp.aiMsgsPerUser);

  const tierBreakdown = TIERS.map((t) => {
    const platformFee = t.price * blendedPlatformRate;
    const gemini = geminiCostPerUser;
    const variableCost = platformFee + gemini;
    const contribution = t.price - variableCost;
    const marginPct = t.price > 0 ? (contribution / t.price) * 100 : 0;
    return { ...t, platformFee, gemini, variableCost, contribution, marginPct };
  });

  // Breakeven: fixed costs / avg contribution margin per paid user
  const avgContribution =
    tierBreakdown.reduce((s, t) => s + t.contribution, 0) / tierBreakdown.length;
  const breakeven = avgContribution > 0 ? Math.ceil(fixedCosts / avgContribution) : 0;

  // ─── Projections ───────────────────────────────────────────────────────
  const growthRate = n(inp.growth) / 100;
  const projMonths = Math.min(Math.max(Math.round(n(inp.months)), 1), 36);

  const projections = Array.from({ length: projMonths }, (_, i) => {
    const mth = i + 1;
    const gFactor = Math.pow(1 + growthRate, mth);
    const projMAU = mau * gFactor;
    const projPaid = projMAU * (n(inp.paidConvRate) / 100);
    const projGross = projPaid * n(inp.avgSubPrice);
    const projPlatform = projGross * ((n(inp.appleFeeRate) / 100 * n(inp.iosShare) / 100) + (n(inp.googleFeeRate) / 100 * (1 - n(inp.iosShare) / 100)));
    const projAI = projMAU * n(inp.aiMsgsPerUser) * GEMINI_COST_PER_AI_MSG;
    const projTTS = n(inp.elMonthlyBase) + Math.max(0, projMAU * n(inp.aiMsgsPerUser) * (n(inp.ttsRatePercent) / 100) * 300 - 500_000) / 1000 * 0.12;
    const projFreeUsers = projMAU * (n(inp.adFreeUserPct) / 100);
    const projAdRevenue = adEnabled
      ? (projFreeUsers * n(inp.adImprPerUserDay) * 30 * (n(inp.adFillRate) / 100) / 1000) * n(inp.adEcpm)
      : 0;
    const projCosts = projPlatform + projAI + projTTS + marketingSpend + supportCost + otherCost;
    const projNet = projGross + projAdRevenue - projCosts;
    return {
      month: `Mo ${mth}`,
      Revenue: Math.round(projGross + projAdRevenue),
      "Net Profit": Math.round(projNet),
      Costs: Math.round(projCosts),
    };
  });

  const ResultRow = ({ label, value, highlight = false, isNeg = false }: { label: string; value: string; highlight?: boolean; isNeg?: boolean }) => (
    <div className={`flex justify-between items-center py-1.5 text-sm ${highlight ? "font-semibold" : ""}`}>
      <span className={highlight ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={`font-mono ${isNeg ? "text-destructive" : highlight ? "text-primary" : ""}`}>
        {value}
      </span>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Pricing Model Calculator</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── LEFT: Inputs ── */}
          <div className="space-y-4">

            {/* Users & Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />Users & Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label="Monthly Active Users" value={inp.mau} onChange={set("mau")}
                  tip="Total users who open the app at least once per month." />
                <Field label="Paid Conversion Rate" value={inp.paidConvRate} onChange={set("paidConvRate")} suffix="%"
                  tip="% of MAU on a paid plan." min="0" step="0.1" />
                <Field label="Avg Subscription Price" value={inp.avgSubPrice} onChange={set("avgSubPrice")} suffix="$"
                  tip="Blended average monthly price across all paid tiers." step="0.01" />
              </CardContent>
            </Card>

            {/* Platform Fees */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />App Store Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label="Apple App Store Fee" value={inp.appleFeeRate} onChange={set("appleFeeRate")} suffix="%"
                  tip="30% standard, 15% for small business program (<$1M/yr revenue)." step="0.1" />
                <Field label="Google Play Fee" value={inp.googleFeeRate} onChange={set("googleFeeRate")} suffix="%"
                  tip="15% for first $1M, 30% thereafter." step="0.1" />
                <Field label="iOS Revenue Share" value={inp.iosShare} onChange={set("iosShare")} suffix="%"
                  tip="What % of your paid subscriptions come via iOS (App Store)." step="1" />
              </CardContent>
            </Card>

            {/* AI Costs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Brain className="w-3 h-3" />AI Costs
                  <InfoTip text="Gemini 2.5 Flash @ $0.075/1M input + $0.30/1M output tokens, avg 1200 input + 500 output per message." />
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label="AI Msgs / User / Month" value={inp.aiMsgsPerUser} onChange={set("aiMsgsPerUser")}
                  tip="Average number of D.E.V.I. AI responses generated per MAU per month." />
                <Field label="Voice Playback Rate" value={inp.ttsRatePercent} onChange={set("ttsRatePercent")} suffix="%"
                  tip="% of AI messages where the user plays the voice audio (ElevenLabs turbo)." step="1" />
                <Field label="ElevenLabs Plan ($)" value={inp.elMonthlyBase} onChange={set("elMonthlyBase")} suffix="$"
                  tip="Fixed monthly ElevenLabs subscription cost (Pro = $99/mo, 500k chars included)." />
              </CardContent>
            </Card>

            {/* Marketing & Other Costs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Megaphone className="w-3 h-3" />Marketing & Operating Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label="Marketing Spend ($)" value={inp.marketingSpend} onChange={set("marketingSpend")}
                  step="10" />
                <Field label="Support / Ops ($)" value={inp.supportCost} onChange={set("supportCost")} step="10" />
                <Field label="Other Fixed Costs ($)" value={inp.otherCost} onChange={set("otherCost")} step="10" />
              </CardContent>
            </Card>

            {/* Ad Revenue */}
            <Card className={adEnabled ? "border-primary/30 bg-primary/5" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                  <Radio className="w-3 h-3" />
                  Ad Revenue (AppLovin / AdMob / etc.)
                  <button
                    onClick={() => setInp(i => ({ ...i, adEnabled: i.adEnabled === "1" ? "0" : "1" }))}
                    className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                      adEnabled
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {adEnabled ? "ON" : "OFF — click to enable"}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!adEnabled && (
                  <p className="text-xs text-muted-foreground italic">
                    Toggle ON to model ad revenue from AppLovin, AdMob, or other networks. Fill in your actual eCPM once you have numbers.
                  </p>
                )}
                {adEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="eCPM ($)"
                      value={inp.adEcpm}
                      onChange={set("adEcpm")}
                      suffix="$"
                      step="0.50"
                      tip="Effective Cost Per Mille — revenue earned per 1,000 filled ad impressions. AppLovin dating apps typically range $6–$15 eCPM."
                    />
                    <Field
                      label="Impressions / Free User / Day"
                      value={inp.adImprPerUserDay}
                      onChange={set("adImprPerUserDay")}
                      step="0.5"
                      tip="How many ad impressions (banner + interstitial) a free user sees per day on average."
                    />
                    <Field
                      label="Fill Rate"
                      value={inp.adFillRate}
                      onChange={set("adFillRate")}
                      suffix="%"
                      step="1"
                      tip="% of ad requests that are filled by the network. AppLovin typically 80–92%."
                    />
                    <Field
                      label="Free User %"
                      value={inp.adFreeUserPct}
                      onChange={set("adFreeUserPct")}
                      suffix="%"
                      step="1"
                      tip="% of MAU on the free tier who see ads. Should roughly equal 100% minus your paid conversion rate."
                    />
                    <div className="col-span-2 rounded-lg bg-muted/60 p-2 space-y-1 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Free users seeing ads</span>
                        <span className="font-mono">{Math.round(freeUsers).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Monthly impressions</span>
                        <span className="font-mono">{Math.round(monthlyImpressions).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Filled impressions</span>
                        <span className="font-mono">{Math.round(filledImpressions).toLocaleString()}</span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between font-semibold text-primary">
                        <span>Est. Ad Revenue</span>
                        <span className="font-mono">+{fmt(adRevenue)}/mo</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Ad revenue per free user</span>
                        <span className="font-mono">{fmtUser(freeUsers > 0 ? adRevenue / freeUsers : 0)}/user</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Projections */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />Growth Projections
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label="Monthly Growth Rate" value={inp.growth} onChange={set("growth")} suffix="%"
                  tip="Expected compound monthly user growth rate." step="0.5" />
                <Field label="Projection Months" value={inp.months} onChange={set("months")}
                  tip="How many months to project forward (max 36)." min="1" />
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="space-y-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Monthly P&L Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Revenue */}
                <ResultRow label="Subscription Revenue" value={fmt(grossRevenue)} highlight />
                <div className="pl-3 space-y-0.5 text-xs text-muted-foreground mb-1">
                  <div className="flex justify-between">
                    <span>Paid Users</span><span className="font-mono">{Math.round(paidUsers).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Price</span><span className="font-mono">{fmt(n(inp.avgSubPrice))}/mo</span>
                  </div>
                </div>
                {adEnabled && (
                  <>
                    <ResultRow label="Ad Revenue" value={`+${fmt(adRevenue)}`} />
                    <div className="pl-3 space-y-0.5 text-xs text-muted-foreground mb-1">
                      <div className="flex justify-between">
                        <span>eCPM</span><span className="font-mono">${n(inp.adEcpm).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Filled impressions</span><span className="font-mono">{Math.round(filledImpressions).toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
                <ResultRow label="Total Revenue" value={fmt(totalRevenue)} highlight />
                <Separator className="my-2" />

                {/* Platform Fees */}
                <ResultRow label="Platform Fees" value={`-${fmt(platformFees)}`} isNeg />
                <div className="pl-3 space-y-0.5 text-xs text-muted-foreground mb-1">
                  <div className="flex justify-between"><span>Apple App Store</span><span className="font-mono">-{fmt(appleFee)}</span></div>
                  <div className="flex justify-between"><span>Google Play</span><span className="font-mono">-{fmt(googleFee)}</span></div>
                </div>

                {/* AI */}
                <ResultRow label="AI Infrastructure" value={`-${fmt(geminiCost + ttsCost)}`} isNeg />
                <div className="pl-3 space-y-0.5 text-xs text-muted-foreground mb-1">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Brain className="w-3 h-3" />Gemini (chat)</span>
                    <span className="font-mono">-{fmt(geminiCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Mic className="w-3 h-3" />ElevenLabs (TTS)</span>
                    <span className="font-mono">-{fmt(ttsCost)}</span>
                  </div>
                </div>

                {/* Other */}
                <ResultRow label="Marketing" value={`-${fmt(marketingSpend)}`} isNeg />
                <ResultRow label="Support / Ops" value={`-${fmt(supportCost)}`} isNeg />
                <ResultRow label="Other Costs" value={`-${fmt(otherCost)}`} isNeg />
                <Separator className="my-2" />
                <ResultRow label="Total Costs" value={`-${fmt(totalCosts)}`} isNeg highlight />
                <Separator className="my-2" />
                <ResultRow
                  label="Net Profit"
                  value={fmt(netRevenue)}
                  highlight
                  isNeg={netRevenue < 0}
                />

                {/* KPIs */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Net Margin", value: fmtPct(margin) },
                    { label: "Revenue/Paid User", value: fmt(revenuePerUser) },
                    { label: "AI Cost/MAU", value: fmtUser((geminiCost + ttsCost) / Math.max(mau, 1)) },
                    { label: "Platform Fee %", value: fmtPct(totalRevenue > 0 ? (platformFees / totalRevenue) * 100 : 0) },
                    ...(adEnabled ? [{ label: "Ad Rev/Free User", value: fmtUser(freeUsers > 0 ? adRevenue / freeUsers : 0) }] : []),
                    ...(adEnabled ? [{ label: "Ad % of Revenue", value: fmtPct(totalRevenue > 0 ? (adRevenue / totalRevenue) * 100 : 0) }] : []),
                  ].map((kpi) => (
                    <div key={kpi.label} className="text-center p-2 rounded-lg bg-background border border-border">
                      <div className="text-sm font-bold text-primary font-mono">{kpi.value}</div>
                      <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Per-User Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Per-User Cost Breakdown (per MAU)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  { label: "Gemini AI", cost: geminiCost },
                  { label: "ElevenLabs TTS", cost: ttsCost },
                  { label: "Platform Fees (apportioned)", cost: platformFees },
                  { label: "Marketing", cost: marketingSpend },
                  { label: "Support / Other", cost: supportCost + otherCost },
                ].map((item) => {
                  const perUser = mau > 0 ? item.cost / mau : 0;
                  const pct = totalCosts > 0 ? (item.cost / totalCosts) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-mono">{fmtUser(perUser)}/user</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Per-Tier Breakdown Table (from image reference) ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Per-Tier Unit Economics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-4 font-medium">Metric</th>
                    {tierBreakdown.map((t) => (
                      <th key={t.name} className="text-right py-2 pr-4 font-medium">
                        <div className="flex flex-col items-end gap-0.5">
                          <span>{t.name}</span>
                          {t.badge && (
                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4">
                              {t.badge}
                            </Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">Billing Type</td>
                    {tierBreakdown.map((t) => (
                      <td key={t.name} className="text-right py-2 pr-4 text-muted-foreground">
                        {t.recurring ? "Monthly" : "One-Time"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">Price</td>
                    {tierBreakdown.map((t) => (
                      <td key={t.name} className="text-right py-2 pr-4 font-mono font-semibold">
                        {fmt(t.price)}{t.recurring ? "/mo" : ""}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">Candidates</td>
                    {tierBreakdown.map((t) => (
                      <td key={t.name} className="text-right py-2 pr-4 text-muted-foreground">{t.candidatesLimit}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">AI Messages</td>
                    {tierBreakdown.map((t) => (
                      <td key={t.name} className="text-right py-2 pr-4 text-muted-foreground">{t.aiMsgsLimit}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">
                      Apple / Google ({fmtPct(blendedPlatformRate * 100)} blended)
                    </td>
                    {tierBreakdown.map((t) => (
                      <td key={t.name} className="text-right py-2 pr-4 font-mono text-destructive">-{fmt(t.platformFee)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">Gemini AI Cost</td>
                    {tierBreakdown.map((t) => (
                      <td key={t.name} className={`text-right py-2 pr-4 font-mono ${t.recurring ? "text-destructive" : "text-muted-foreground"}`}>
                        {t.recurring ? `-${fmtUser(t.gemini)}` : "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border bg-muted/30 font-semibold">
                    <td className="py-2 pr-4">Variable Cost</td>
                    {tierBreakdown.map((t) => (
                      <td key={t.name} className={`text-right py-2 pr-4 font-mono ${t.recurring ? "text-destructive" : "text-muted-foreground"}`}>
                        {t.recurring ? fmt(t.variableCost) : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 font-semibold">
                    <td className="py-2 pr-4">Contribution</td>
                    {tierBreakdown.map((t) => (
                      <td key={t.name} className="text-right py-2 pr-4 font-mono text-primary">
                        {t.recurring ? fmt(t.contribution) : fmt(t.price - t.platformFee)}
                      </td>
                    ))}
                  </tr>
                  <tr className="font-bold text-sm">
                    <td className="py-2 pr-4">Margin</td>
                    {tierBreakdown.map((t) => (
                      <td key={t.name} className="text-right py-2 pr-4 font-mono text-primary">
                        {t.recurring
                          ? fmtPct(t.marginPct)
                          : fmtPct(((t.price - t.platformFee) / t.price) * 100)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-muted-foreground">Fixed Costs / Month</span>
                <span className="font-mono font-semibold">{fmt(fixedCosts)}</span>
              </div>
              <div className="pl-3 text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>{fixedCostsLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marketing</span>
                  <span className="font-mono">{fmt(marketingSpend)}</span>
                </div>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/50">
                <span className="font-semibold">
                  Breakeven Subscribers
                  <InfoTip text="Minimum paid subscribers needed for monthly fixed costs to be covered by avg contribution margin across tiers." />
                </span>
                <span className="font-mono font-bold text-primary">~{breakeven.toLocaleString()} paid users</span>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {projMonths}-Month Revenue Projection ({n(inp.growth)}% monthly growth)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projections}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={Math.floor(projMonths / 6)} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <RTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: number, n: string) => [fmt(v), n]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" fill="url(#gRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Net Profit" stroke="hsl(var(--chart-2))" fill="url(#gNet)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground italic text-center">
          Estimates only. Actual costs vary with usage patterns, negotiated rates, and plan changes.
          Platform fees based on published Apple/Google policies as of 2025.
        </p>
      </div>
    </TooltipProvider>
  );
};
