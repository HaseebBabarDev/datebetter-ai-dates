import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Sparkles, Heart, ArrowLeft, Zap, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PaymentSheet } from "@/components/subscription/PaymentSheet";

const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Try it out",
    icon: Heart,
    features: [
      "1 candidate",
      "1 interaction log per candidate",
      "Basic compatibility insights",
      "Cycle tracking",
    ],
    color: "bg-muted",
    textColor: "text-foreground",
    popular: false,
    badge: null,
  },
  {
    id: "new_to_dating",
    name: "Starter",
    priceMonthly: 9.99,
    priceYearly: 95.88, // ~$7.99/mo, 20% off
    description: "Everything you need to date smarter",
    icon: Sparkles,
    features: [
      "Track up to 10 candidates",
      "30 compatibility score updates",
      "1,000 AI messages / month",
      "Compatibility scoring",
      "Red flag detection",
      "Voice playback insights",
      "Cycle-aware insights",
    ],
    color: "bg-primary/10",
    textColor: "text-primary",
    popular: false,
    badge: null,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    priceMonthly: 19.99,
    priceYearly: 191.88, // ~$15.99/mo, 20% off
    description: "No limits, ever",
    icon: Crown,
    features: [
      "Unlimited candidates",
      "Unlimited AI messages",
      "Unlimited score updates",
      "Everything in Starter",
      "Advanced behavioral analytics",
      "Priority support",
    ],
    color: "bg-gradient-to-br from-primary/20 to-accent/20",
    textColor: "text-primary",
    popular: true,
    badge: "Most Popular",
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, refetch } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof SUBSCRIPTION_PLANS[0] | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [detachPaymentOpen, setDetachPaymentOpen] = useState(false);

  const getDisplayPrice = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (plan.priceMonthly === 0) return "$0";
    if (isYearly) {
      const monthlyEquivalent = plan.priceYearly / 12;
      return `$${monthlyEquivalent.toFixed(2)}`;
    }
    return `$${plan.priceMonthly.toFixed(2)}`;
  };

  const getTotalPrice = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (plan.priceMonthly === 0) return "$0";
    if (isYearly) return `$${plan.priceYearly.toFixed(2)}`;
    return `$${plan.priceMonthly.toFixed(2)}`;
  };

  const getSavingsPercent = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (plan.priceMonthly === 0) return 0;
    const yearlyTotal = plan.priceYearly;
    const monthlyTotal = plan.priceMonthly * 12;
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
  };

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }
    if (planId === "free") {
      toast.info("You're already on the free plan");
      return;
    }
    if (planId === subscription?.plan) {
      toast.info("You're already on this plan");
      return;
    }
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setPaymentOpen(true);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan || !user) return;
    setLoading(selectedPlan.id);
    try {
      const planLimits: Record<string, { candidates: number; updates: number }> = {
        new_to_dating: { candidates: 10, updates: 30 },
        unlimited: { candidates: 999, updates: 999 },
      };
      const limits = planLimits[selectedPlan.id];
      if (limits) {
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            plan: selectedPlan.id as "free" | "new_to_dating" | "dating_often" | "dating_more" | "unlimited",
            candidates_limit: limits.candidates,
            updates_per_candidate: limits.updates,
          })
          .eq("user_id", user.id);
        if (error) throw error;
        refetch();
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleDetachPaymentSuccess = () => {
    toast.success("Detachment Plan unlocked! Find it on any candidate's profile.");
    setDetachPaymentOpen(false);
  };

  const currentPlan = subscription?.plan || "free";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Unlock deeper insights, more candidates, and smarter dating decisions.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Label htmlFor="billing-toggle" className={`text-sm ${!isYearly ? "font-semibold" : "text-muted-foreground"}`}>
            Monthly
          </Label>
          <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
          <Label htmlFor="billing-toggle" className={`text-sm ${isYearly ? "font-semibold" : "text-muted-foreground"}`}>
            Yearly
          </Label>
          {isYearly && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Save 20%
            </Badge>
          )}
        </div>

        {/* Plans Grid — 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            const isPaidPlan = plan.id !== "free";

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col ${
                  plan.popular ? "ring-2 ring-primary shadow-md" : ""
                } ${isCurrentPlan ? "ring-2 ring-accent" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground text-xs">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0">
                    <Badge variant="secondary" className="rounded-none rounded-br-lg text-xs">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className={`${plan.color} pb-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${plan.textColor}`} />
                    <CardTitle className="text-base sm:text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-bold">{getDisplayPrice(plan)}</span>
                    {isPaidPlan && (
                      <span className="text-xs sm:text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {isPaidPlan && isYearly && (
                    <p className="text-xs text-muted-foreground">
                      Billed {getTotalPrice(plan)}/year
                    </p>
                  )}
                  {isPaidPlan && isYearly && getSavingsPercent(plan) > 0 && (
                    <Badge variant="outline" className="mt-1 text-xs text-green-600 border-green-600 w-fit">
                      Save {getSavingsPercent(plan)}%
                    </Badge>
                  )}
                  <CardDescription className="text-xs sm:text-sm mt-1">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="pt-4 flex flex-col flex-1">
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full text-sm"
                    variant={plan.popular ? "default" : "outline"}
                    disabled={isCurrentPlan || loading !== null}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {loading === plan.id
                      ? "Processing..."
                      : isCurrentPlan
                      ? "Current Plan"
                      : plan.id === "free"
                      ? "Downgrade"
                      : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detachment Plan — One-Time Add-On */}
        <Separator className="mb-8" />
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-1">Add-On</h2>
          <p className="text-sm text-muted-foreground">Available on any subscription, purchased once per candidate.</p>
        </div>

        <Card className="border-dashed border-2 border-primary/30 hover:border-primary/60 hover:shadow-md transition-all duration-200">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {/* Icon + title */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-base">Detachment Plan</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">One-Time</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Break free from emotional attachment</p>
                </div>
              </div>

              {/* Features */}
              <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                {[
                  "AI-personalized recovery timeline",
                  "4-phase detachment program",
                  "Tailored to your specific candidate",
                  "One-time purchase per candidate",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Price + CTA */}
              <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">$9.99</div>
                  <div className="text-xs text-muted-foreground">per candidate</div>
                </div>
                <Button
                  variant="default"
                  className="shrink-0"
                  onClick={() => {
                    if (!user) { toast.error("Please sign in first"); navigate("/auth"); return; }
                    setDetachPaymentOpen(true);
                  }}
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  Unlock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-xs sm:text-sm text-muted-foreground text-center">
          All plans include cycle tracking, hormone-aware insights, and basic pattern detection.
          <br className="hidden sm:block" />
          {" "}Cancel anytime. No hidden fees.
        </p>
      </div>

      {/* Subscription Payment Sheet */}
      {selectedPlan && (
        <PaymentSheet
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          planName={`${selectedPlan.name}${isYearly ? " (Yearly)" : ""}`}
          price={getTotalPrice(selectedPlan)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Detachment Plan Payment Sheet */}
      <PaymentSheet
        open={detachPaymentOpen}
        onOpenChange={setDetachPaymentOpen}
        planName="Detachment Plan"
        price="$9.99"
        onPaymentSuccess={handleDetachPaymentSuccess}
      />
    </div>
  );
}
