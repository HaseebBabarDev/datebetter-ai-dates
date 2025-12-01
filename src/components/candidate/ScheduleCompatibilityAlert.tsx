import React from "react";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleCompatibilityAlertProps {
  userSchedule?: string | null;
  candidateSchedule?: string | null;
  distance?: string | null;
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
  frequent_traveler: "Frequent Traveler",
};

// Fallback formatter for unlisted values
const formatScheduleLabel = (value: string): string => {
  if (SCHEDULE_LABELS[value]) return SCHEDULE_LABELS[value];
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const FLEXIBLE_SCHEDULES = ["remote_flexible", "hybrid", "self_employed", "student"];
const RIGID_SCHEDULES = ["office_9_5", "shift_work", "on_call", "overnight"];

type CompatibilityLevel = "great" | "good" | "warning" | "conflict";

const LONG_DISTANCE_VALUES = ["long_distance", "different_city", "different_state", "different_country"];
const FAR_DISTANCE_VALUES = ["30_60_min", "1_2_hours", "2_plus_hours", ...LONG_DISTANCE_VALUES];

function getScheduleCompatibility(
  userSchedule?: string | null,
  candidateSchedule?: string | null,
  distance?: string | null
): { level: CompatibilityLevel; message: string } | null {
  if (!userSchedule || !candidateSchedule) return null;

  const userFlex = FLEXIBLE_SCHEDULES.includes(userSchedule);
  const candFlex = FLEXIBLE_SCHEDULES.includes(candidateSchedule);
  const isLongDistance = distance && LONG_DISTANCE_VALUES.includes(distance);
  const isFarAway = distance && FAR_DISTANCE_VALUES.includes(distance);

  // Long distance with rigid schedules is very challenging
  if (isLongDistance && !userFlex && !candFlex) {
    return {
      level: "conflict",
      message: "Long distance + rigid schedules may limit quality time",
    };
  }

  // Both flexible - great match
  if (userFlex && candFlex) {
    if (isLongDistance) {
      return {
        level: "good",
        message: "Flexible schedules help with long distance",
      };
    }
    return {
      level: "great",
      message: "Schedule match! Both have flexible schedules",
    };
  }

  // One flexible - good, can accommodate
  if (userFlex !== candFlex) {
    const flexPerson = userFlex ? "Your" : "Their";
    if (isFarAway) {
      return {
        level: "warning",
        message: `Distance + mixed schedules - ${flexPerson.toLowerCase()} flexibility helps`,
      };
    }
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
        message: isFarAway 
          ? "Overnight vs daytime + distance is very challenging"
          : "Schedule conflict: Overnight vs daytime may be challenging",
      };
    }
  }

  // Same rigid schedule - actually good
  if (userSchedule === candidateSchedule) {
    if (isFarAway) {
      return {
        level: "warning",
        message: `Same schedules but distance may limit meetups`,
      };
    }
    return {
      level: "good",
      message: `Similar schedules: Both ${formatScheduleLabel(userSchedule)}`,
    };
  }

  // Different rigid schedules - potential difficulty
  if (
    (userSchedule === "on_call" && candidateSchedule === "office_9_5") ||
    (userSchedule === "office_9_5" && candidateSchedule === "on_call")
  ) {
    return {
      level: isFarAway ? "conflict" : "warning",
      message: isFarAway 
        ? "On-call + distance makes planning difficult"
        : "On-call may disrupt regular office schedule",
    };
  }

  if (
    (userSchedule === "shift_work" && candidateSchedule === "office_9_5") ||
    (userSchedule === "office_9_5" && candidateSchedule === "shift_work")
  ) {
    return {
      level: isFarAway ? "conflict" : "warning",
      message: isFarAway
        ? "Shift work + distance limits availability"
        : "Shift work may not align with regular hours",
    };
  }

  // Default for other rigid combinations
  return {
    level: isFarAway ? "conflict" : "warning",
    message: isFarAway
      ? "Different schedules + distance needs careful planning"
      : "Different work schedules - may need planning",
  };
}

export const ScheduleCompatibilityAlert: React.FC<ScheduleCompatibilityAlertProps> = ({
  userSchedule,
  candidateSchedule,
  distance,
  variant = "compact",
  className,
}) => {
  const compatibility = getScheduleCompatibility(userSchedule, candidateSchedule, distance);

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
        Schedule
      </span>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        bg,
        border,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn("w-4 h-4", text)} />
        <p className={cn("text-xs font-semibold", text)}>
          {level === "conflict"
            ? "Schedule Conflict"
            : level === "warning"
            ? "Schedule Note"
            : "Schedule Compatible"}
        </p>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{message}</p>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="bg-background/60 rounded px-2 py-1">
          <span className="text-muted-foreground">You:</span>{" "}
          <span className="font-medium">{formatScheduleLabel(userSchedule!)}</span>
        </span>
        <span className="bg-background/60 rounded px-2 py-1">
          <span className="text-muted-foreground">Them:</span>{" "}
          <span className="font-medium">{formatScheduleLabel(candidateSchedule!)}</span>
        </span>
      </div>
    </div>
  );
};

// Export the utility function for use elsewhere
export { getScheduleCompatibility, SCHEDULE_LABELS };