import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutDashboard, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export type DefaultScreen = "dashboard" | "devi" | "top-candidate";

interface DefaultScreenDialogProps {
  open: boolean;
  onClose: (selected: DefaultScreen) => void;
}

const OPTIONS: { value: DefaultScreen; label: string; description: string; icon: React.ElementType }[] = [
  { value: "dashboard", label: "Dashboard", description: "Overview of all candidates & activity", icon: LayoutDashboard },
  { value: "devi", label: "D.E.V.I.", description: "Start with your AI dating advisor", icon: Sparkles },
  { value: "top-candidate", label: "Top Candidate", description: "Jump straight to your highest-scored match", icon: Trophy },
];

export const DefaultScreenDialog: React.FC<DefaultScreenDialogProps> = ({ open, onClose }) => {
  const [selected, setSelected] = useState<DefaultScreen>("dashboard");

  return (
    <Dialog open={open} onOpenChange={() => onClose(selected)}>
      <DialogContent hideCloseButton className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Where do you want to land?</DialogTitle>
          <DialogDescription className="text-center">
            Choose your default start screen. You can change this anytime in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  isActive
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={() => onClose(selected)}
          className="w-full mt-2"
          size="lg"
        >
          Set as Default
        </Button>
      </DialogContent>
    </Dialog>
  );
};
