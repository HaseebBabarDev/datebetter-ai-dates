import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from "@revenuecat/purchases-capacitor";

function rcEntitlementId(
  key: "unlimited" | "textSimulator" | "detachment",
): string {
  const env =
    key === "unlimited"
      ? import.meta.env.VITE_RC_ENTITLEMENT_UNLIMITED
      : key === "textSimulator"
        ? import.meta.env.VITE_RC_ENTITLEMENT_TEXT_SIMULATOR
        : import.meta.env.VITE_RC_ENTITLEMENT_DETACHMENT;
  const fallback =
    key === "unlimited"
      ? "unlimited"
      : key === "textSimulator"
        ? "text_simulator"
        : "detachment_plan";
  const v = typeof env === "string" ? env.trim() : "";
  return v || fallback;
}

function entitlementIsActive(customerInfo: CustomerInfo, id: string): boolean {
  const e = customerInfo.entitlements.all[id];
  return e?.isActive === true;
}

/** True if this Store product has an active subscription (preferred for add-on SKUs). */
function storeProductSubscriptionActive(
  customerInfo: CustomerInfo,
  productId: string | null | undefined,
): boolean {
  if (!productId) return false;
  const subs = customerInfo.activeSubscriptions;
  if (Array.isArray(subs) && subs.includes(productId)) return true;
  const row = customerInfo.subscriptionsByProductIdentifier?.[productId];
  return row?.isActive === true;
}

/**
 * RC SDK entitlement / subscription state for paywall UI.
 * When `packages` is set, add-ons use **active Store product ids** so a base Unlimited SKU
 * that still lists extra entitlements in the dashboard does not flip add-on buttons.
 */
export function localEntitlementsFromRcCustomerInfo(
  customerInfo: CustomerInfo,
  packages?: ResolvedRcPackages | null,
): {
  unlimited: boolean;
  textSimulator: boolean;
  detachment: boolean;
} {
  const unlimitedEnt = rcEntitlementId("unlimited");
  const textEnt = rcEntitlementId("textSimulator");
  const detEnt = rcEntitlementId("detachment");

  const unlimited =
    (packages?.unlimited
      ? storeProductSubscriptionActive(
          customerInfo,
          packages.unlimited.product.identifier,
        )
      : false) || entitlementIsActive(customerInfo, unlimitedEnt);

  const textSimulator = packages?.textSimulator
    ? storeProductSubscriptionActive(
        customerInfo,
        packages.textSimulator.product.identifier,
      )
    : entitlementIsActive(customerInfo, textEnt);

  const detachment = packages?.detachment
    ? storeProductSubscriptionActive(
        customerInfo,
        packages.detachment.product.identifier,
      )
    : entitlementIsActive(customerInfo, detEnt);

  return { unlimited, textSimulator, detachment };
}

export type ResolvedRcPackages = {
  unlimited: PurchasesPackage | null;
  textSimulator: PurchasesPackage | null;
  detachment: PurchasesPackage | null;
};

function byEnv(
  packages: PurchasesPackage[],
  envValue: string | undefined
): PurchasesPackage | null {
  const id = envValue?.trim();
  if (!id) return null;
  return packages.find((p) => p.identifier === id) ?? null;
}

function haystack(p: PurchasesPackage): string {
  return `${p.identifier} ${p.product.identifier}`.toLowerCase();
}

/** Fallback when env package ids are not set — tune if RC identifiers differ. */
function byHeuristic(
  packages: PurchasesPackage[],
  kind: keyof ResolvedRcPackages
): PurchasesPackage | null {
  const tests: Record<keyof ResolvedRcPackages, (s: string) => boolean> = {
    unlimited: (s) =>
      s.includes("unlimited") || s.includes("premium") || s.includes("full_access"),
    textSimulator: (s) =>
      (s.includes("text") && s.includes("sim")) || s.includes("text_sim"),
    detachment: (s) => s.includes("detach"),
  };
  return packages.find((p) => tests[kind](haystack(p))) ?? null;
}

/**
 * Map RevenueCat `current` offering packages to base + add-ons.
 * Optional env (exact package identifier from RC dashboard):
 * - VITE_RC_PACKAGE_UNLIMITED
 * - VITE_RC_PACKAGE_TEXT_SIMULATOR
 * - VITE_RC_PACKAGE_DETACHMENT
 */
export function resolveOfferingPackages(
  offerings: PurchasesOfferings
): ResolvedRcPackages {
  const packages = offerings.current?.availablePackages ?? [];
  const envUnlimited = import.meta.env.VITE_RC_PACKAGE_UNLIMITED as
    | string
    | undefined;
  const envText = import.meta.env.VITE_RC_PACKAGE_TEXT_SIMULATOR as
    | string
    | undefined;
  const envDetach = import.meta.env.VITE_RC_PACKAGE_DETACHMENT as
    | string
    | undefined;

  return {
    unlimited:
      byEnv(packages, envUnlimited) ?? byHeuristic(packages, "unlimited"),
    textSimulator:
      byEnv(packages, envText) ?? byHeuristic(packages, "textSimulator"),
    detachment:
      byEnv(packages, envDetach) ?? byHeuristic(packages, "detachment"),
  };
}
