import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";

/**
 * iOS/Android shell tweaks. No-op on web.
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    // true = WebView draws edge-to-edge under the status bar (Splash video can fill the top).
    // false reserves a native strip above the webview (reads as a black “safe area” gap).
    // Screens keep content out of the notch via env(safe-area-inset-top) / safe-area-* classes.
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Simulator or plugin not ready
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
  } catch {
    // Optional
  }
}
