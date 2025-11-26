import React from "react";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleCompatibilityAlertProps {
  userSchedule?: string | null;
  candidateSchedule?: string | null;
  variant?: "compact" | "full";
  className?: string;
}

const SCHEDULE_LABELS: Record<string, string> = {
  remote_flexible: "Remote/Flexible",
  hybrid: "Hybrid",
  office_9_5: "Office 9-5",
  shift_work: "Shift Work",
  on_call: "On-Call",
  overnight: "Overnight",
  student: "Student",
  self_employed: "Self-Employed",
};

const FLEXIBLE_SCHEDULES = ["remote_flexible", "hybrid", "self_employed", "student"];
const RIGID_SCHEDULES = ["office_9_5", "shift_work", "on_call", "overnight"];

type CompatibilityLevel = "great" | "good" | "warning" | "conflict";

function getScheduleCompatibility(
  userSchedule?: string | null,
  candidateSchedule?: string | null
): { level: CompatibilityLevel; message: string } | null {
  if (!userSchedule || !candidateSchedule) return null;

  const userFlex = FLEXIBLE_SCHEDULES.includes(userSchedule);
  const candFlex = FLEXIBLE_SCHEDULES.includes(candidateSchedule);

  // Both flexible - great match
  if (userFlex && candFlex) {
    return {
      level: "great",
      message: "Schedule match! Both have flexible schedules",
    };
  }

  // One flexible - good, can accommodate
  if (userFlex !== candFlex) {
    const flexPerson = userFlex ? "Your" : "Their";
    return {
      level: "good",
      message: `${flexPerson} flexible schedule can accommodate`,
    };
  }

  // Both rigid - check specific conflicts
  // Overnight conflicts with most daytime schedules
  if (userSchedule === "overnight" || candidateSchedule === "overnight") {
    const otherSchedule = userSchedule === "overnight" ? candidateSchedule : userSchedule;
    if (otherSchedule !== "overnight") {
      return {
        level: "conflict",
        message: "Schedule conflict: Overnight vs daytime may be challenging",
      };
    }
  }

  // Same rigid schedule - actually good
  if (userSchedule === candidateSchedule) {
    return {
      level: "good",
      message: `Similar schedules: Both ${SCHEDULE_LABELS[userSchedule] || userSchedule}`,
    };
  }

  // Different rigid schedules - potential difficulty
  if (
    (userSchedule === "on_call" && candidateSchedule === "office_9_5") ||
    (userSchedule === "office_9_5" && candidateSchedule === "on_call")
  ) {
    return {
      level: "warning",
      message: "On-call may disrupt regular office schedule",
    };
  }

  if (
    (userSchedule === "shift_work" && candidateSchedule === "office_9_5") ||
    (userSchedule === "office_9_5" && candidateSchedule === "shift_work")
  ) {
    return {
      level: "warning",
      message: "Shift work may not align with regular hours",
    };
  }

  // Default for other rigid combinations
  return {
    level: "warning",
    message: "Different work schedules - may need planning",
  };
}

export const ScheduleCompatibilityAlert: React.FC<ScheduleCompatibilityAlertProps> = ({
  userSchedule,
  candidateSchedule,
  variant = "compact",
  className,
}) => {
  const compatibility = getScheduleCompatibility(userSchedule, candidateSchedule);

  if (!compatibility) return null;

  const { level, message } = compatibility;

  // Only show warnings and conflicts by default
  if (variant === "compact" && (level === "great" || level === "good")) {
    return null;
  }

  const config = {
    great: {
      icon: CheckCircle,
      bg: "bg-emerald-500/10",
      text: "text-emerald-600",
      border: "border-emerald-500/30",
    },
    good: {
      icon: CheckCircle,
      bg: "bg-blue-500/10",
      text: "text-blue-600",
      border: "border-blue-500/30",
    },
    warning: {
      icon: Clock,
      bg: "bg-amber-500/10",
      text: "text-amber-600",
      border: "border-amber-500/30",
    },
    conflict: {
      icon: AlertTriangle,
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/30",
    },
  };

  const { icon: Icon, bg, text, border } = config[level];

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1",
          bg,
          text,
          className
        )}
        title={message}
      >
        <Icon className="w-3 h-3" />
        {level === "conflict" ? "⚠️ Schedule" : "🕐 Schedule"}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        bg,
        border,
        className
      )}
    >
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", text)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", text)}>
          {level === "conflict"
            ? "Schedule Conflict"
            : level === "warning"
            ? "Schedule Note"
            : "Schedule Compatible"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
          <span>You: {SCHEDULE_LABELS[userSchedule!] || userSchedule}</span>
          <span>•</span>
          <span>Them: {SCHEDULE_LABELS[candidateSchedule!] || candidateSchedule}</span>
        </div>
      </div>
    </div>
  );
};

// Export the utility function for use elsewhere
export { getScheduleCompatibility, SCHEDULE_LABELS };