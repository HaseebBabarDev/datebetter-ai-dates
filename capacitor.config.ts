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
    contentInset: "automatic",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#1A1A1A",
    },
  },
};

export default config;
