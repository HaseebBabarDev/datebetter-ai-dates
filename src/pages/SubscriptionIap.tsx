import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, ArrowLeft, Zap, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { initPurchases } from "@/lib/revenuecat/initPurchases";
import {
  localEntitlementsFromRcCustomerInfo,
  resolveOfferingPackages,
  type ResolvedRcPackages,
} from "@/lib/revenuecat/resolvePackages";
import { Purchases, type PurchasesPackage } from "@revenuecat/purchases-capacitor";

/**
 * Native iOS paywall: RevenueCat / App Store only (no Stripe Checkout on this screen).
 */
export default function SubscriptionIap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, refetch } = useSubscription();
  const [rcPackages, setRcPackages] = useState<ResolvedRcPackages | null>(null);
  const [iapAction, setIapAction] = useState<string | null>(null);
  /** RevenueCat + StoreKit truth (can lead server mirror `useSubscription` after login / webhook delay). */
  const [iapAddonHint, setIapAddonHint] = useState<{
    unlimited: boolean;
    textSimulator: boolean;
    detachment: boolean;
  } | null>(null);

  useEffect(() => {
    setIapAddonHint(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setRcPackages(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await initPurchases();
        const offerings = await Purchases.getOfferings();
        if (cancelled) return;
        const resolved = resolveOfferingPackages(offerings);
        setRcPackages(resolved);
        if (import.meta.env.DEV && offerings.current?.availablePackages?.length) {
          console.log("[SubscriptionIap] RC packages resolved", {
            offering: offerings.current.identifier,
            unlimited: resolved.unlimited?.identifier,
            textSimulator: resolved.textSimulator?.identifier,
            detachment: resolved.detachment?.identifier,
          });
        }
      } catch (e) {
        console.warn("[SubscriptionIap] getOfferings failed", e);
        if (!cancelled) {
          toast.error("Could not load App Store subscriptions.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id || !rcPackages) return;
    let cancelled = false;
    void (async () => {
      try {
        await initPurchases();
        const { customerInfo } = await Purchases.getCustomerInfo();
        if (cancelled) return;
        const loc = localEntitlementsFromRcCustomerInfo(customerInfo, rcPackages);
        setIapAddonHint({
          unlimited: loc.unlimited,
          textSimulator: loc.textSimulator,
          detachment: loc.detachment,
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, rcPackages]);

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
        const loc = localEntitlementsFromRcCustomerInfo(customerInfo, rcPackages);
        setIapAddonHint({
          unlimited: loc.unlimited,
          textSimulator: loc.textSimulator,
          detachment: loc.detachment,
        });
        toast.success("You're subscribed!");
        await refetch();
      } catch (e: unknown) {
        const err = e as { userCancelled?: boolean; message?: string };
        if (err?.userCancelled) return;
        // "Already subscribed" (StoreKit sheet) often rejects here — refresh RC and UI.
        try {
          const { customerInfo } = await Purchases.getCustomerInfo();
          const loc = localEntitlementsFromRcCustomerInfo(customerInfo, rcPackages);
          setIapAddonHint({
            unlimited: loc.unlimited,
            textSimulator: loc.textSimulator,
            detachment: loc.detachment,
          });
          if (loc.unlimited && actionKey === "unlimited") {
            toast.info("You're already subscribed through Apple.");
            await refetch();
            return;
          }
        } catch {
          /* ignore */
        }
        toast.error(err?.message || "Purchase could not be completed.");
      } finally {
        setIapAction(null);
      }
    },
    [user, navigate, refetch, rcPackages],
  );

  const handleRestoreIap = useCallback(async () => {
    setIapAction("restore");
    try {
      await initPurchases();
      await Purchases.restorePurchases();
      const { customerInfo } = await Purchases.getCustomerInfo();
      const loc = localEntitlementsFromRcCustomerInfo(customerInfo, rcPackages);
      setIapAddonHint({
        unlimited: loc.unlimited,
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
  }, [refetch, rcPackages]);

  const currentPlan = subscription?.plan || "free";
  const rcUnlimited = Boolean(iapAddonHint?.unlimited);
  const serverUnlimitedActive =
    currentPlan === "unlimited" &&
    (Boolean(subscription?.subscribed) || Boolean(subscription?.trial_active));
  const isUnlimited = rcUnlimited || serverUnlimitedActive;
  const hasTextSimAddon =
    Boolean(subscription?.has_text_simulator) || Boolean(iapAddonHint?.textSimulator);
  const hasDetachmentAddon =
    Boolean(subscription?.has_detachment_plan) || Boolean(iapAddonHint?.detachment);
  const unlimitedPriceLabel = rcPackages?.unlimited?.product?.priceString ?? "$15";
  const busy = iapAction !== null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div
        className="container max-w-lg mx-auto px-4 pb-6 sm:pb-8"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0.75rem)" }}
      >
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground mb-1">App Store subscriptions</h1>
          <p className="text-muted-foreground text-sm">
            Unlimited plan and add-ons billed through Apple.
          </p>
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
        </div>

        {isUnlimited && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-medium text-foreground">
              {"You're on the "}
              <span className="text-primary">Unlimited</span> plan
            </p>
            {subscription?.trial_active && subscription.trial_ends_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString()}
              </p>
            )}
            {!subscription?.trial_active && subscription?.subscription_end && (
              <p className="text-xs text-muted-foreground mt-1">
                Renews {new Date(subscription.subscription_end).toLocaleDateString()}
              </p>
            )}
            {rcUnlimited && !subscription?.subscribed && (
              <p className="text-xs text-muted-foreground mt-2">
                Apple shows an active subscription; your account is still syncing. Use Restore purchases
                if this message persists.
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              To change or cancel: Settings → Apple ID → Subscriptions (on this iPhone).
            </p>
          </div>
        )}

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
              {isUnlimited
                ? "Your Unlimited subscription is active. Renewal is managed in Apple Subscriptions."
                : "Full relationship intelligence — includes a 15-day free trial for new subscribers."}
              {!rcPackages?.unlimited && (
                <span className="block text-amber-600/90 mt-1 text-xs">
                  App Store package not matched — set VITE_RC_PACKAGE_* env vars or check RevenueCat
                  offering identifiers.
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
                ...(isUnlimited ? [] : ["15-day free trial for new subscribers"]),
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
              onClick={() => void purchaseIapPackage("unlimited", rcPackages?.unlimited ?? null)}
            >
              {iapAction === "unlimited" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing...
                </>
              ) : isUnlimited ? (
                "Current Plan"
              ) : (
                "Start Free Trial"
              )}
            </Button>
          </CardContent>
        </Card>

        <Separator className="mb-6" />
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-1">Optional Add-ons</h2>
          <p className="text-sm text-muted-foreground">
            Monthly extras on top of Unlimited. {!isUnlimited && "Subscribe to Unlimited first to unlock add-ons."}
          </p>
        </div>

        <div className="space-y-4">
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
                      {rcPackages?.textSimulator?.product?.priceString ?? "$5"}
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
                    onClick={() => void purchaseIapPackage("text_sim", rcPackages?.textSimulator ?? null)}
                  >
                    {iapAction === "text_sim" ? (
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
                      {rcPackages?.detachment?.product?.priceString ?? "$5"}
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
                    onClick={() => void purchaseIapPackage("detachment", rcPackages?.detachment ?? null)}
                  >
                    {iapAction === "detachment" ? (
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
          Cancel anytime. No hidden fees. Subscriptions billed through Apple.
        </p>
      </div>
    </div>
  );
}
