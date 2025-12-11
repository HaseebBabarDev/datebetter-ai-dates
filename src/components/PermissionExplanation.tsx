import React from "react";
import { Camera, MapPin, BellRing, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PermissionExplanationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: "camera" | "location" | "notifications" | "photos";
  onAllow: () => void;
  onDeny: () => void;
}

const PERMISSION_INFO = {
  camera: {
    icon: Camera,
    title: "Camera Access",
    description: "We need camera access to let you take photos of your dates and add them to candidate profiles.",
    usage: [
      "Take profile photos for candidates",
      "Capture moments from your dates",
    ],
    notUsedFor: "We never access your camera without your action.",
  },
  location: {
    icon: MapPin,
    title: "Location Access",
    description: "Location helps us provide distance-based insights about your candidates.",
    usage: [
      "Calculate distance to candidates",
      "Show nearby dating suggestions",
    ],
    notUsedFor: "We never track your location in the background.",
  },
  notifications: {
    icon: BellRing,
    title: "Notification Access",
    description: "Notifications keep you informed about important insights and reminders.",
    usage: [
      "Cycle-aware dating reminders",
      "Pattern detection alerts",
      "Important AI insights",
    ],
    notUsedFor: "We'll never spam you with unnecessary notifications.",
  },
  photos: {
    icon: Image,
    title: "Photo Library Access",
    description: "Access to your photos lets you add existing images to candidate profiles.",
    usage: [
      "Add photos to candidate profiles",
      "Save and share date memories",
    ],
    notUsedFor: "We never access photos you don't explicitly select.",
  },
};

export function PermissionExplanation({
  open,
  onOpenChange,
  permission,
  onAllow,
  onDeny,
}: PermissionExplanationProps) {
  const info = PERMISSION_INFO[permission];
  const Icon = info.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">{info.title}</DialogTitle>
          <DialogDescription className="text-center">
            {info.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">We use this to:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {info.usage.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Your privacy matters:</strong> {info.notUsedFor}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onAllow} className="w-full min-h-[44px]">
            Allow Access
          </Button>
          <Button onClick={onDeny} variant="ghost" className="w-full min-h-[44px]">
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
