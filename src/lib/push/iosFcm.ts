import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { upsertPushToken } from "@/lib/push/pushTokens";

async function persistFcmTokenIfSignedIn(fcmToken: string | undefined): Promise<void> {
  if (!fcmToken) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;
  const { error } = await upsertPushToken(userId, fcmToken, "ios");
  if (error && import.meta.env.DEV) {
    console.warn("[FCM iOS] push_tokens upsert failed", error.message);
  }
}

/**
 * After permission is granted, fetch the current FCM token and store it in Supabase.
 * Safe to call on every login; no-op if not iOS native or not signed in.
 */
export async function syncIosFcmTokenToSupabase(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  const perm = await FirebaseMessaging.checkPermissions();
  if (perm.receive !== "granted") return;

  const { token } = await FirebaseMessaging.getToken();
  await persistFcmTokenIfSignedIn(token);
}

/**
 * Native iOS only: wires @capacitor-firebase/messaging (FCM + APNs).
 * Web keeps the existing Notification API flow — do not call this on web/Android.
 */
export async function initIosFcm(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;

  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");

  await FirebaseMessaging.addListener("tokenReceived", (event) => {
    if (import.meta.env.DEV && event.token) {
      console.log("[FCM iOS] tokenReceived", `${event.token.slice(0, 24)}…`);
    }
    void persistFcmTokenIfSignedIn(event.token);
  });

  await FirebaseMessaging.addListener("notificationReceived", (event) => {
    if (import.meta.env.DEV) {
      console.log("[FCM iOS] notificationReceived", event);
    }
  });

  await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
    if (import.meta.env.DEV) {
      console.log("[FCM iOS] notificationActionPerformed", event);
    }
  });

  // Loads the native plugin (FirebaseApp.configure + registerForRemoteNotifications) without prompting.
  await FirebaseMessaging.checkPermissions();
}

/** Clears the FCM registration token on device; call on sign-out before Phase-3 server cleanup. */
export async function deleteIosFcmTokenIfNative(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;
  try {
    const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
    await FirebaseMessaging.deleteToken();
  } catch {
    /* optional */
  }
}
