import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Crown, Sparkles, Heart, ArrowLeft, Zap } from "lucide-react";
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
    limitations: [
      "Limited AI analysis",
      "No priority support",
    ],
    color: "bg-muted",
    textColor: "text-foreground",
    popular: false,
  },
  {
    id: "new_to_dating",
    name: "New to Dating",
    priceMonthly: 9.99,
    priceYearly: 95.88, // 20% discount (~$7.99/mo)
    description: "Perfect for getting started",
    icon: Sparkles,
    features: [
      "3 candidates",
      "5 interaction logs per candidate",
      "Full AI compatibility scoring",
      "Red flag detection",
      "Pattern analysis",
      "Cycle-aware insights",
    ],
    limitations: [],
    color: "bg-primary/10",
    textColor: "text-primary",
    popular: false,
  },
  {
    id: "dating_often",
    name: "Dating Often",
    priceMonthly: 19.99,
    priceYearly: 191.88, // 20% discount (~$15.99/mo)
    description: "Best for active daters",
    icon: Crown,
    features: [
      "7 candidates",
      "12 interaction logs per candidate",
      "Full AI compatibility scoring",
      "Advanced red flag detection",
      "Deep pattern analysis",
      "Cycle-aware insights",
      "Priority support",
    ],
    limitations: [],
    color: "bg-gradient-to-br from-primary/20 to-accent/20",
    textColor: "text-primary",
    popular: true,
  },
  {
    id: "dating_more",
    name: "Dating More",
    priceMonthly: 39.99,
    priceYearly: 383.88, // 20% discount (~$31.99/mo)
    description: "For power users",
    icon: Zap,
    features: [
      "12 candidates",
      "20 interaction logs per candidate",
      "Full AI compatibility scoring",
      "Advanced red flag detection",
      "Deep pattern analysis",
      "Cycle-aware insights",
      "Priority support",
      "Early access to new features",
    ],
    limitations: [],
    color: "bg-accent/10",
    textColor: "text-accent-foreground",
    popular: false,
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
    if (isYearly) {
      return `$${plan.priceYearly.toFixed(2)}`;
    }
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

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
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
        new_to_dating: { candidates: 3, updates: 5 },
        dating_often: { candidates: 7, updates: 12 },
        dating_more: { candidates: 12, updates: 20 },
      };

      const limits = planLimits[selectedPlan.id];

      if (limits) {
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            plan: selectedPlan.id as "free" | "new_to_dating" | "dating_often" | "dating_more",
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

  const currentPlan = subscription?.plan || "free";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Unlock more candidates, deeper insights, and smarter dating decisions.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Label htmlFor="billing-toggle" className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing-toggle" className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
            Yearly
          </Label>
          {isYearly && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Save 20%
            </Badge>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            const isPaidPlan = plan.id !== "free";

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  plan.popular ? "ring-2 ring-primary" : ""
                } ${isCurrentPlan ? "ring-2 ring-accent" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground text-xs">
                      Most Popular
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
                      <span className="text-xs sm:text-sm text-muted-foreground">/month</span>
                    )}
                  </div>
                  {isPaidPlan && isYearly && (
                    <p className="text-xs text-muted-foreground">
                      Billed {getTotalPrice(plan)}/year
                    </p>
                  )}
                  {isPaidPlan && isYearly && getSavingsPercent(plan) > 0 && (
                    <Badge variant="outline" className="mt-1 text-xs text-green-600 border-green-600">
                      Save {getSavingsPercent(plan)}%
                    </Badge>
                  )}
                  <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                  <ul className="space-y-2 mb-4 sm:mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">—</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full text-sm"
                    variant={plan.popular ? "default" : "outline"}
                    disabled={isCurrentPlan || loading !== null}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {loading === plan.id ? (
                      "Processing..."
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.id === "free" ? (
                      "Downgrade"
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            All plans include cycle tracking, hormone-aware insights, and basic pattern detection.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Upgrade anytime to unlock more candidates and deeper AI analysis.
          </p>
        </div>
      </div>

      {/* Payment Sheet */}
      {selectedPlan && (
        <PaymentSheet
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          planName={`${selectedPlan.name}${isYearly ? ' (Yearly)' : ''}`}
          price={getTotalPrice(selectedPlan)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
