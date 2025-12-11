import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Heart, ArrowLeft, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceMonthly: 0,
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
    price: "$9.99",
    priceMonthly: 9.99,
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
    price: "$19.99",
    priceMonthly: 19.99,
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
    price: "$29.99",
    priceMonthly: 29.99,
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

  const handleSelectPlan = async (planId: string) => {
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

    setLoading(planId);

    try {
      // For demo purposes, we'll just update the subscription directly
      // In production, this would integrate with Stripe checkout
      const planLimits: Record<string, { candidates: number; updates: number }> = {
        new_to_dating: { candidates: 3, updates: 5 },
        dating_often: { candidates: 7, updates: 12 },
        dating_more: { candidates: 12, updates: 20 },
      };

      const limits = planLimits[planId];

      if (limits) {
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            plan: planId as "free" | "new_to_dating" | "dating_often" | "dating_more",
            candidates_limit: limits.candidates,
            updates_per_candidate: limits.updates,
          })
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success(`Upgraded to ${SUBSCRIPTION_PLANS.find(p => p.id === planId)?.name}!`);
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground">
            Unlock more candidates, deeper insights, and smarter dating decisions.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0">
                    <Badge variant="secondary" className="rounded-none rounded-br-lg">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className={`${plan.color} pb-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${plan.textColor}`} />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {isPaidPlan && (
                      <span className="text-sm text-muted-foreground">/month</span>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">—</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
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
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include cycle tracking, hormone-aware insights, and basic pattern detection.
            <br />
            Upgrade anytime to unlock more candidates and deeper AI analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
