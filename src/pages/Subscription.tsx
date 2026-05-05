import React, { useState, useEffect, useCallback } from "react";
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
import {
  initPurchases,
  isIosRevenueCatEnabled,
} from "@/lib/revenuecat/initPurchases";
import {
  localEntitlementsFromRcCustomerInfo,
  resolveOfferingPackages,
  type ResolvedRcPackages,
} from "@/lib/revenuecat/resolvePackages";

import {
  Purchases,
  type PurchasesPackage,
} from "@revenuecat/purchases-capacitor";

// const SUBSCRIPTION_PLANS = [
//   {
//     id: "free",
//     stripeKey: null,
//     name: "Free",
//     price: 0,
//     description: "Try it out",
//     icon: Heart,
//     features: [
//       "1 candidate",
//       "5 D.E.V.I. messages",
//       "Basic compatibility insights",
//       "Cycle tracking",
//     ],
//     color: "bg-muted",
//     textColor: "text-foreground",
//     popular: false,
//     badge: null,
//   },
//   {
//     id: "basic",
//     stripeKey: "basic" as const,
//     name: "Starter",
//     price: 9.99,
//     description: "Start dating with clarity",
//     icon: MessageCircle,
//     features: [
//       "Up to 5 candidates",
//       "300 D.E.V.I. messages",
//       "1 text simulator exchange (trial)",
//       "5 compatibility refreshes per candidate",
//       "Red flag detection",
//       "Cycle tracking",
//     ],
//     color: "bg-muted/60",
//     textColor: "text-muted-foreground",
//     popular: false,
//     badge: null,
//   },
//   {
//     id: "starter",
//     stripeKey: "starter" as const,
//     name: "Plus",
//     price: 15.99,
//     description: "Everything you need to date smarter",
//     icon: Sparkles,
//     features: [
//       "Up to 10 candidates",
//       "1,000 D.E.V.I. messages",
//       "5 text simulator conversations",
//       "10 compatibility refreshes per candidate",
//       "Red flag detection",
//       "Voice playback insights",
//       "Cycle-aware insights",
//     ],
//     color: "bg-primary/10",
//     textColor: "text-primary",
//     popular: false,
//     badge: null,
//   },
//   {
//     id: "unlimited",
//     stripeKey: "unlimited" as const,
//     name: "Unlimited",
//     price: 29.99,
//     description: "No limits, ever",
//     icon: Crown,
//     features: [
//       "Unlimited candidates",
//       "Unlimited D.E.V.I. messages",
//       "20 text simulator conversations",
//       "Unlimited compatibility refreshes",
//       "Red flag detection",
//       "Priority support",
//     ],
//     color: "bg-gradient-to-br from-primary/20 to-accent/20",
//     textColor: "text-primary",
//     popular: true,
//     badge: "Most Popular",
//   },
// ];

export default function Subscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { subscription, refetch } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const useIap = isIosRevenueCatEnabled();
  const [rcPackages, setRcPackages] = useState<ResolvedRcPackages | null>(null);
  const [iapAction, setIapAction] = useState<string | null>(null);
  /** RC SDK truth right after IAP; server webhook can lag. */
  const [iapAddonHint, setIapAddonHint] = useState<{
    textSimulator: boolean;
    detachment: boolean;
  } | null>(null);

  useEffect(() => {
    setIapAddonHint(null);
  }, [user?.id]);

  useEffect(() => {
    if (!useIap) return;
    let cancelled = false;
    void (async () => {
      try {
        await initPurchases();
        const offerings = await Purchases.getOfferings();
        if (cancelled) return;
        const resolved = resolveOfferingPackages(offerings);
        setRcPackages(resolved);
        if (
          import.meta.env.DEV &&
          offerings.current?.availablePackages?.length
        ) {
          console.log("[Subscription] RC packages resolved", {
            offering: offerings.current.identifier,
            unlimited: resolved.unlimited?.identifier,
            textSimulator: resolved.textSimulator?.identifier,
            detachment: resolved.detachment?.identifier,
          });
        }
      } catch (e) {
        console.warn("[Subscription] getOfferings failed", e);
        if (!cancelled) {
          toast.error("Could not load App Store subscriptions.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useIap]);

  const purchaseIapPackage = useCallback(
    async (actionKey: string, pkg: PurchasesPackage | null) => {
      if (!user) {
        toast.error("Please sign in first");
        navigate("/auth");
        return;
      }
      if (!pkg) {
        toast.error("That product is not available right now.");
        return;
      }
      setIapAction(actionKey);
      try {
        await Purchases.purchasePackage({ aPackage: pkg });
        const { customerInfo } = await Purchases.getCustomerInfo();
        const loc = localEntitlementsFromRcCustomerInfo(customerInfo);
        setIapAddonHint({
          textSimulator: loc.textSimulator,
          detachment: loc.detachment,
        });
        toast.success("You're subscribed!");
        await refetch();
      } catch (e: unknown) {
        const err = e as { userCancelled?: boolean; message?: string };
        if (err?.userCancelled) return;
        toast.error(err?.message || "Purchase could not be completed.");
      } finally {
        setIapAction(null);
      }
    },
    [user, navigate, refetch]
  );

  const handleRestoreIap = useCallback(async () => {
    if (!useIap) return;
    setIapAction("restore");
    try {
      await initPurchases();
      await Purchases.restorePurchases();
      const { customerInfo } = await Purchases.getCustomerInfo();
      const loc = localEntitlementsFromRcCustomerInfo(customerInfo);
      setIapAddonHint({
        textSimulator: loc.textSimulator,
        detachment: loc.detachment,
      });
      toast.success("Purchases restored.");
      await refetch();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || "Restore failed.");
    } finally {
      setIapAction(null);
    }
  }, [useIap, refetch]);

  // Handle return from Stripe Checkout
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
  const hasTextSimAddon =
    Boolean(subscription?.has_text_simulator) ||
    (useIap && Boolean(iapAddonHint?.textSimulator));
  const hasDetachmentAddon =
    Boolean(subscription?.has_detachment_plan) ||
    (useIap && Boolean(iapAddonHint?.detachment));
  const unlimitedPriceLabel =
    useIap && rcPackages?.unlimited?.product?.priceString
      ? rcPackages.unlimited.product.priceString
      : "$15";
  const busy = checkoutLoading !== null || iapAction !== null;

  return (
    <div className="min-h-screen bg-background pb-[calc(env(safe-area-inset-bottom)+7rem)]">
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
          {useIap && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => void handleRestoreIap()}
              >
                {iapAction === "restore" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}
                Restore purchases
              </Button>
            </div>
          )}
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
              <span className="text-3xl font-bold">{unlimitedPriceLabel}</span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <CardDescription className="text-sm mt-1">
              Full relationship intelligence — 15-day free trial
              {useIap && !rcPackages?.unlimited && (
                <span className="block text-amber-600/90 mt-1 text-xs">
                  App Store package not matched — set VITE_RC_PACKAGE_* env vars or check
                  RevenueCat offering identifiers.
                </span>
              )}
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
              disabled={isUnlimited || busy}
              onClick={() => {
                if (useIap) {
                  void purchaseIapPackage("unlimited", rcPackages?.unlimited ?? null);
                } else {
                  void handleCheckout(STRIPE_PLANS.unlimited.price_id);
                }
              }}
            >
              {useIap
                ? iapAction === "unlimited"
                  ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing...
                      </>
                    )
                  : isUnlimited
                    ? "Current Plan"
                    : "Start Free Trial"
                : checkoutLoading === STRIPE_PLANS.unlimited.price_id
                  ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing...
                      </>
                    )
                  : isUnlimited
                    ? "Current Plan"
                    : "Start Free Trial"}
            </Button>
          </CardContent>
        </Card>

        {/* Add-Ons */}
        <Separator className="mb-6" />
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-1">Optional Add-ons</h2>
          <p className="text-sm text-muted-foreground">
            Monthly extras on top of Unlimited. {!isUnlimited && "Subscribe to Unlimited first to unlock add-ons."}
          </p>
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
                    <span className="font-bold text-foreground">
                      {useIap && rcPackages?.textSimulator?.product?.priceString
                        ? rcPackages.textSimulator.product.priceString
                        : "$5"}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Practice conversations with AI-powered text simulations. 5 message exchanges per month.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!isUnlimited || hasTextSimAddon || busy}
                    onClick={() => {
                      if (useIap) {
                        void purchaseIapPackage("text_sim", rcPackages?.textSimulator ?? null);
                      } else {
                        void handleCheckout(STRIPE_ADDONS.text_simulator.price_id);
                      }
                    }}
                  >
                    {useIap ? (
                      iapAction === "text_sim" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Zap className="w-4 h-4 mr-1" />
                      )
                    ) : checkoutLoading === STRIPE_ADDONS.text_simulator.price_id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Zap className="w-4 h-4 mr-1" />
                    )}
                    {hasTextSimAddon ? "Subscribed" : "Subscribe"}
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
                    <span className="font-bold text-foreground">
                      {useIap && rcPackages?.detachment?.product?.priceString
                        ? rcPackages.detachment.product.priceString
                        : "$5"}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Personalized AI recovery timeline when you need to let someone go.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!isUnlimited || hasDetachmentAddon || busy}
                    onClick={() => {
                      if (useIap) {
                        void purchaseIapPackage("detachment", rcPackages?.detachment ?? null);
                      } else {
                        void handleCheckout(STRIPE_ADDONS.detachment_plan.price_id);
                      }
                    }}
                  >
                    {useIap ? (
                      iapAction === "detachment" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1" />
                      )
                    ) : checkoutLoading === STRIPE_ADDONS.detachment_plan.price_id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    {hasDetachmentAddon ? "Subscribed" : "Subscribe"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          Cancel anytime. No hidden fees.
          {useIap ? " Subscriptions billed through Apple." : " Powered by Stripe."}
        </p>
      </div>
    </div>
  );
}
