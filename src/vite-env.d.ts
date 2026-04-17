/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVENUECAT_IOS_API_KEY?: string;
  readonly VITE_REVENUECAT_IOS_STORE_PRODUCT_IDS?: string;
  /** RevenueCat entitlement identifiers (match dashboard / webhook env). */
  readonly VITE_RC_ENTITLEMENT_UNLIMITED?: string;
  readonly VITE_RC_ENTITLEMENT_TEXT_SIMULATOR?: string;
  readonly VITE_RC_ENTITLEMENT_DETACHMENT?: string;
  /** Hosted Lovable app URL (OAuth broker). Used on native so /~oauth resolves correctly. */
  readonly VITE_LOVABLE_APP_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
