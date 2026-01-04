import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, MessageSquare, ExternalLink, Heart } from "lucide-react";
import { CrisisDetectionResult, CRISIS_RESOURCES } from "@/lib/crisisDetection";

interface CrisisAlertDialogProps {
  open: boolean;
  onClose: () => void;
  severity: "moderate" | "severe";
}

export const CrisisAlertDialog: React.FC<CrisisAlertDialogProps> = ({
  open,
  onClose,
  severity,
}) => {
  const isSevere = severity === "severe";

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
            isSevere ? "bg-destructive/20" : "bg-amber-500/20"
          }`}>
            {isSevere ? (
              <AlertTriangle className="w-8 h-8 text-destructive" />
            ) : (
              <Heart className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <AlertDialogTitle className="text-center">
            {isSevere ? "We're Here for You" : "You're Not Alone"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p>
              {isSevere
                ? "It sounds like you might be going through something really difficult. Your safety matters most. Please reach out to someone who can help right now."
                : "What you're describing sounds serious. You deserve to feel safe. These resources are available 24/7."}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-4">
          {/* Suicide Prevention - always show for severe */}
          {isSevere && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <h4 className="font-semibold text-sm mb-2">{CRISIS_RESOURCES.suicide.name}</h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${CRISIS_RESOURCES.suicide.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call {CRISIS_RESOURCES.suicide.phone}
                </a>
                <a
                  href={`sms:741741?body=HOME`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Text HOME to 741741
                </a>
              </div>
            </div>
          )}

          {/* Domestic Violence Hotline */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-semibold text-sm mb-2">{CRISIS_RESOURCES.domesticViolence.name}</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={`tel:${CRISIS_RESOURCES.domesticViolence.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              >
                <Phone className="w-3.5 h-3.5" />
                {CRISIS_RESOURCES.domesticViolence.phone}
              </a>
              <a
                href={`sms:88788?body=START`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Text START to 88788
              </a>
            </div>
          </div>

          {/* Crisis Text Line */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-semibold text-sm mb-2">{CRISIS_RESOURCES.crisis.name}</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={`sms:741741?body=HOME`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Text HOME to 741741
              </a>
              <a
                href={CRISIS_RESOURCES.crisis.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Website
              </a>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          All services are free, confidential, and available 24/7
        </p>

        <AlertDialogFooter className="mt-4">
          <Button onClick={onClose} variant="outline" className="w-full">
            I understand, continue chatting
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
