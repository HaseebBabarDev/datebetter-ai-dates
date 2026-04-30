import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, Smartphone } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { syncIosFcmTokenToSupabase } from "@/lib/push/iosFcm";

function IosFcmRemoteNotificationsCard() {
  const [receive, setReceive] = useState<"granted" | "denied" | "prompt" | "">("");
  const [busy, setBusy] = useState(false);

  const refreshPermission = useCallback(async () => {
    const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
    const perm = await FirebaseMessaging.checkPermissions();
    setReceive(perm.receive as "granted" | "denied" | "prompt");
  }, []);

  useEffect(() => {
    void refreshPermission();
  }, [refreshPermission]);

  const enableRemote = async () => {
    setBusy(true);
    try {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const perm = await FirebaseMessaging.requestPermissions();
      setReceive(perm.receive as "granted" | "denied" | "prompt");
      if (perm.receive !== "granted") {
        toast.error("Notifications were not allowed. You can enable them in Settings → DateBetter → Notifications.");
        return;
      }
      await syncIosFcmTokenToSupabase();
      toast.success("Remote notifications enabled for this iPhone.");
    } catch (e) {
      console.error(e);
      toast.error("Could not enable remote notifications. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const resync = async () => {
    setBusy(true);
    try {
      await syncIosFcmTokenToSupabase();
      toast.success("Registration refreshed.");
    } catch (e) {
      console.error(e);
      toast.error("Could not refresh registration.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          Remote alerts (this iPhone)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Server-sent push via Firebase for important updates. This is separate from in-app browser-style
          notifications on the website.
        </p>
        {receive === "denied" ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium mb-2">Notifications are blocked</p>
            <p className="text-xs text-muted-foreground">
              On iPhone: Settings → DateBetter → Notifications → Allow Notifications.
            </p>
          </div>
        ) : receive !== "granted" ? (
          <Button onClick={() => void enableRemote()} disabled={busy} className="w-full">
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Working…
              </>
            ) : (
              <>
                <BellRing className="w-4 h-4 mr-2" />
                Enable remote notifications
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <Badge variant="default">Remote push on</Badge>
            <Button variant="outline" size="sm" onClick={() => void resync()} disabled={busy} className="w-full">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh registration"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NotificationSettings() {
  const isIosNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    loading, 
    requestPermission,
    sendLocalNotification 
  } = usePushNotifications();

  const handleTestNotification = () => {
    sendLocalNotification("Test Notification", {
      body: "This is a test notification from dateBetter!",
    });
  };

  if (isIosNative) {
    return (
      <div className="space-y-4">
        <IosFcmRemoteNotificationsCard />
      </div>
    );
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported on this device or browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Push Notifications
          </CardTitle>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === "denied" ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium mb-2">
              Notifications are blocked
            </p>
            <p className="text-xs text-muted-foreground">
              To enable notifications, please update your browser settings for this site.
            </p>
          </div>
        ) : !isSubscribed ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get notified about important updates, reminders, and insights about your dating journey.
            </p>
            <Button
              onClick={requestPermission}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <BellRing className="w-4 h-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="daily-reminder" className="text-sm">
                Daily check-in reminders
              </Label>
              <Switch id="daily-reminder" defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="cycle-alerts" className="text-sm">
                Cycle phase alerts
              </Label>
              <Switch id="cycle-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="pattern-alerts" className="text-sm">
                Pattern detection alerts
              </Label>
              <Switch id="pattern-alerts" defaultChecked />
            </div>
            
            <Button
              variant="outline"
              onClick={handleTestNotification}
              className="w-full"
              size="sm"
            >
              Send Test Notification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
