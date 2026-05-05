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
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // Simulator or plugin not ready
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
  } catch {
    // Optional
  }
}
