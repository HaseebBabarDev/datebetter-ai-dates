import type { PurchasesOfferings, PurchasesPackage } from "@revenuecat/purchases-capacitor";

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
