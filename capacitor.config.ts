import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.datebetter.ai",
  appName: "DateBetter",
  webDir: "dist",
  // Keeps the WebView on `localhost` (no port), which avoids WKWebView + getUserMedia issues
  // and matches secure-context expectations for MediaDevices / ElevenLabs Scribe.
  server: {
    hostname: "localhost",
  },
  ios: {
    // "automatic" insets the scroll view for safe areas and leaves white native gutters
    // behind edge-to-edge pages (e.g. Splash video). Default Capacitor behavior is "never";
    // we handle safe areas in CSS with env(safe-area-inset-*).
    contentInset: "never",
    // Fills any remaining native gap with dark instead of default white.
    backgroundColor: "#000000",
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#1A1A1A",
    },
  },
};

export default config;
