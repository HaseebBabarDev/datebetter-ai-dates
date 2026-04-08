import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, ArrowLeft, Zap, Sparkles, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS, STRIPE_ADDONS } from "@/lib/stripeConfig";

export default function Subscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { subscription, refetch } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Your subscription is now active.");
      refetch();
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Payment canceled. No charges were made.");
    }
  }, [searchParams, refetch]);

  const handleCheckout = async (priceId: string, mode: "subscription" | "payment" = "subscription") => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }

    setCheckoutLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, mode },
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
  const isUnlimited = currentPlan === "unlimited";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-lg mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground mb-1">Billing</h1>
          <p className="text-muted-foreground text-sm">
            Simple pricing — one plan, optional add-ons.
          </p>
        </div>

        {/* Manage subscription for active subscribers */}
        {subscription?.subscribed && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">
                You're on the <span className="text-primary capitalize">{currentPlan}</span> plan
              </p>
              {subscription.trial_active && subscription.trial_ends_at && (
                <p className="text-xs text-muted-foreground">
                  Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString()}
                </p>
              )}
              {!subscription.trial_active && subscription.subscription_end && (
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

        {/* Unlimited Plan */}
        <Card className={`relative overflow-hidden mb-6 ${isUnlimited ? "ring-2 ring-primary shadow-md" : "border-2 border-primary/40"}`}>
          {isUnlimited && (
            <div className="absolute top-0 left-0">
              <Badge variant="secondary" className="rounded-none rounded-br-lg text-xs">
                Current Plan
              </Badge>
            </div>
          )}
          <CardHeader className="bg-primary/10 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Unlimited</CardTitle>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">$15</span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <CardDescription className="text-sm mt-1">
              Full relationship intelligence — 15-day free trial
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2 mb-6">
              {[
                "Unlimited candidates",
                "Unlimited D.E.V.I. messages",
                "AI scoring & compatibility insights",
                "Red flag & pattern detection",
                "Community access",
                "15-day free trial",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              disabled={isUnlimited || checkoutLoading !== null}
              onClick={() => handleCheckout(STRIPE_PLANS.unlimited.price_id)}
            >
              {checkoutLoading === STRIPE_PLANS.unlimited.price_id ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing...</>
              ) : isUnlimited ? (
                "Current Plan"
              ) : (
                "Start Free Trial"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Add-Ons */}
        <Separator className="mb-6" />
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-1">Optional Add-ons</h2>
          <p className="text-sm text-muted-foreground">Monthly extras to enhance your experience.</p>
        </div>

        <div className="space-y-4">
          {/* Text Simulator */}
          <Card className="border border-border hover:border-primary/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">Text Simulator</span>
                    <span className="font-bold text-foreground">$5<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Practice conversations with AI-powered text simulations. 5 message exchanges per month.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={checkoutLoading !== null}
                    onClick={() => handleCheckout(STRIPE_ADDONS.text_simulator.price_id)}
                  >
                    {checkoutLoading === STRIPE_ADDONS.text_simulator.price_id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Zap className="w-4 h-4 mr-1" />
                    )}
                    Subscribe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detachment Plan */}
          <Card className="border border-border hover:border-primary/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">Detachment Plan</span>
                    <span className="font-bold text-foreground">$5<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Personalized AI recovery timeline when you need to let someone go.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={checkoutLoading !== null}
                    onClick={() => handleCheckout(STRIPE_ADDONS.detachment_plan.price_id)}
                  >
                    {checkoutLoading === STRIPE_ADDONS.detachment_plan.price_id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    Subscribe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          Cancel anytime. No hidden fees. Powered by Stripe.
        </p>
      </div>
    </div>
  );
}
