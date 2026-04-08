/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVENUECAT_IOS_API_KEY?: string;
  readonly VITE_REVENUECAT_IOS_STORE_PRODUCT_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
