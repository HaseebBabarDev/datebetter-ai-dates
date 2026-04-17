import { Capacitor } from "@capacitor/core";
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";

let initPromise: Promise<void> | null = null;

/** True when running on iOS native and the public SDK key is set. */
export function isIosRevenueCatEnabled(): boolean {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
    return false;
  }
  const key = import.meta.env.VITE_REVENUECAT_IOS_API_KEY;
  return typeof key === "string" && key.length > 0;
}

/**
 * Configure RevenueCat once (call from app bootstrap). No-op on web/Android or without API key.
 */
export function initPurchases(): Promise<void> {
  if (!isIosRevenueCatEnabled()) {
    return Promise.resolve();
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = (async () => {
    await Purchases.setLogLevel({
      level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN,
    });
    await Purchases.configure({
      apiKey: import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string,
    });
  })();
  return initPromise;
}

/** Links App Store purchases to your Supabase user id (for webhooks / dashboard). */
export async function revenueCatLogIn(appUserId: string): Promise<void> {
  if (!isIosRevenueCatEnabled()) return;
  await initPurchases();
  await Purchases.logIn({ appUserID: appUserId });
}

/** Clears RC user on sign-out. */
export async function revenueCatLogOut(): Promise<void> {
  if (!isIosRevenueCatEnabled()) return;
  await initPurchases();
  try {
    await Purchases.logOut();
  } catch {
    // Anonymous / not configured — ignore
  }
}
