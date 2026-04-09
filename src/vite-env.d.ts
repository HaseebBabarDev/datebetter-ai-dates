/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Hosted Lovable app URL (OAuth broker). Used on native so /~oauth resolves correctly. */
  readonly VITE_LOVABLE_APP_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
