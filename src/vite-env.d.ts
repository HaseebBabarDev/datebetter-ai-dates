/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVENUECAT_IOS_API_KEY?: string;
  readonly VITE_REVENUECAT_IOS_STORE_PRODUCT_IDS?: string;
  /** Hosted Lovable app URL (OAuth broker). Used on native so /~oauth resolves correctly. */
  readonly VITE_LOVABLE_APP_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
