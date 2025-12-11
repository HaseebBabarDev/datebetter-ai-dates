import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "unsupported",
    isSubscribed: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    
    if (isSupported) {
      setState((prev) => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
        isSubscribed: Notification.permission === "granted",
      }));
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error("Push notifications are not supported on this device");
      return false;
    }

    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      
      setState((prev) => ({
        ...prev,
        permission,
        isSubscribed: permission === "granted",
      }));

      if (permission === "granted") {
        toast.success("Push notifications enabled!");
        
        // Show a test notification
        new Notification("dateBetter", {
          body: "You'll now receive updates about your dating journey!",
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
        });
        
        return true;
      } else if (permission === "denied") {
        toast.error("Notifications blocked. Please enable in your browser settings.");
        return false;
      } else {
        toast.info("Notification permission dismissed");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to enable notifications");
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.isSupported]);

  const sendLocalNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!state.isSubscribed) {
        console.warn("Notifications not enabled");
        return;
      }

      try {
        new Notification(title, {
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          ...options,
        });
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    },
    [state.isSubscribed]
  );

  const scheduleReminder = useCallback(
    (title: string, body: string, delayMs: number) => {
      if (!state.isSubscribed) {
        toast.error("Please enable notifications first");
        return null;
      }

      const timeoutId = setTimeout(() => {
        sendLocalNotification(title, { body });
      }, delayMs);

      return timeoutId;
    },
    [state.isSubscribed, sendLocalNotification]
  );

  return {
    ...state,
    loading,
    requestPermission,
    sendLocalNotification,
    scheduleReminder,
  };
}
