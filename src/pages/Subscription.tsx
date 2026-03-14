import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Sparkles, Heart, ArrowLeft, Zap, ShoppingBag, MessageCircle, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS, STRIPE_ONE_TIME } from "@/lib/stripeConfig";

const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    stripeKey: null,
    name: "Free",
    price: 0,
    description: "Try it out",
    icon: Heart,
    features: [
      "1 candidate",
      "5 total interactions",
      "3 text simulator sessions",
      "Basic compatibility insights",
      "Cycle tracking",
    ],
    color: "bg-muted",
    textColor: "text-foreground",
    popular: false,
    badge: null,
  },
  {
    id: "basic",
    stripeKey: "basic" as const,
    name: "Starter",
    price: 9.99,
    description: "Start dating with clarity",
    icon: MessageCircle,
    features: [
      "Up to 5 candidates",
      "300 total interactions",
      "Compatibility scoring",
      "Red flag detection",
      "Cycle tracking",
    ],
    color: "bg-muted/60",
    textColor: "text-muted-foreground",
    popular: false,
    badge: null,
  },
  {
    id: "starter",
    stripeKey: "starter" as const,
    name: "Starter",
    price: 15.99,
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
    stripeKey: "unlimited" as const,
    name: "Unlimited",
    price: 29.99,
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
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { subscription, refetch } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle return from Stripe Checkout
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Your subscription is now active.");
      refetch();
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Payment canceled. No charges were made.");
    }
  }, [searchParams, refetch]);

  const handleCheckout = async (planId: string, stripeKey: string | null) => {
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
    if (!stripeKey) return;

    setCheckoutLoading(planId);
    try {
      const stripePlan = STRIPE_PLANS[stripeKey as keyof typeof STRIPE_PLANS];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: stripePlan.price_id, mode: "subscription" },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleOneTimeCheckout = async (type: "day_pass" | "detachment") => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }

    setCheckoutLoading(type === "day_pass" ? "daypass" : "detachment");
    try {
      const priceId = type === "day_pass" 
        ? STRIPE_ONE_TIME.day_pass.price_id 
        : STRIPE_ONE_TIME.detachment_plan.price_id;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, mode: "payment" },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open subscription management. Please try again.");
    } finally {
      setPortalLoading(false);
    }
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

        {/* Manage subscription button for active subscribers */}
        {subscription?.subscribed && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">
                You're on the <span className="text-primary capitalize">{currentPlan}</span> plan
              </p>
              {subscription.subscription_end && (
                <p className="text-xs text-muted-foreground">
                  Renews {new Date(subscription.subscription_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Settings className="w-4 h-4 mr-1" />}
              Manage
            </Button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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
                    <span className="text-2xl sm:text-3xl font-bold">${plan.price.toFixed(2)}</span>
                    {isPaidPlan && (
                      <span className="text-xs sm:text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
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
                    disabled={isCurrentPlan || checkoutLoading !== null}
                    onClick={() => handleCheckout(plan.id, plan.stripeKey)}
                  >
                    {checkoutLoading === plan.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing...</>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.id === "free" ? (
                      "Downgrade"
                    ) : (
                      "Get Started"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add-Ons */}
        <Separator className="mb-8" />
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-1">Add-Ons</h2>
          <p className="text-sm text-muted-foreground">One-time purchases to unlock extra features.</p>
        </div>

        <div className="space-y-4">
          {/* Day Pass */}
          <Card className="border-dashed border-2 border-accent/30 hover:border-accent/60 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-base">Day Pass</span>
                      <Badge variant="outline" className="text-[10px] px-1.5">24 Hours</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Unlimited access for a full day</p>
                  </div>
                </div>

                <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    "Unlimited interactions for 24 hours",
                    "Unlimited text simulator sessions",
                    "Unlimited AI messages",
                    "All premium features unlocked",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">$5.99</div>
                    <div className="text-xs text-muted-foreground">one-time</div>
                  </div>
                  <Button
                    variant="default"
                    className="shrink-0"
                    disabled={checkoutLoading !== null}
                    onClick={() => handleOneTimeCheckout("day_pass")}
                  >
                    {checkoutLoading === "daypass" ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Zap className="w-4 h-4 mr-1.5" />
                    )}
                    Get Day Pass
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detachment Plan */}
          <Card className="border-dashed border-2 border-primary/30 hover:border-primary/60 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
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

                <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    "AI-personalized recovery timeline",
                    "4-phase detachment program",
                    "Tailored to your specific candidate",
                    "One-time purchase per candidate",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">$9.99</div>
                    <div className="text-xs text-muted-foreground">per candidate</div>
                  </div>
                  <Button
                    variant="default"
                    className="shrink-0"
                    disabled={checkoutLoading !== null}
                    onClick={() => handleOneTimeCheckout("detachment")}
                  >
                    {checkoutLoading === "detachment" ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Zap className="w-4 h-4 mr-1.5" />
                    )}
                    Unlock
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-8 text-xs sm:text-sm text-muted-foreground text-center">
          All plans include cycle tracking, hormone-aware insights, and basic pattern detection.
          <br className="hidden sm:block" />
          {" "}Cancel anytime. No hidden fees. Powered by Stripe.
        </p>
      </div>
    </div>
  );
}
