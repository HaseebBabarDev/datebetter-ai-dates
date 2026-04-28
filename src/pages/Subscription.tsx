import { isIosRevenueCatEnabled } from "@/lib/revenuecat/initPurchases";
import SubscriptionIap from "./SubscriptionIap";
import SubscriptionStripe from "./SubscriptionStripe";

/**
 * Single route `/subscription`: Stripe paywall on web / Android / iOS without RC;
 * App Store paywall on native iOS when RevenueCat is configured.
 */
export default function Subscription() {
  return isIosRevenueCatEnabled() ? <SubscriptionIap /> : <SubscriptionStripe />;
}
