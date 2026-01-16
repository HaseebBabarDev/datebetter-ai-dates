import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface ReminderTime {
  hour: number;
  message: string;
}

const REMINDER_TIMES: ReminderTime[] = [
  { hour: 9, message: "Good morning! 🌅 How's your dating journey going today?" },
  { hour: 14, message: "Afternoon check-in! 💭 Any new connections to log?" },
  { hour: 18, message: "Evening reminder! ✨ Time to reflect on today's interactions." },
];

const STORAGE_KEY = "datebetter_last_reminders";

export function useScheduledReminders() {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getShownReminders = useCallback((): Record<string, string> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const markReminderShown = useCallback((hour: number) => {
    const today = new Date().toDateString();
    const shown = getShownReminders();
    shown[`${hour}`] = today;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shown));
  }, [getShownReminders]);

  const wasShownToday = useCallback((hour: number): boolean => {
    const today = new Date().toDateString();
    const shown = getShownReminders();
    return shown[`${hour}`] === today;
  }, [getShownReminders]);

  const checkAndShowReminders = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check each reminder time
    for (const reminder of REMINDER_TIMES) {
      // Show reminder within the first 15 minutes of the hour
      if (
        currentHour === reminder.hour &&
        currentMinute < 15 &&
        !wasShownToday(reminder.hour)
      ) {
        toast(reminder.message, {
          duration: 8000,
          action: {
            label: "Log Interaction",
            onClick: () => {
              window.location.href = "/dashboard";
            },
          },
        });
        markReminderShown(reminder.hour);
        break; // Only show one reminder at a time
      }
    }
  }, [wasShownToday, markReminderShown]);

  useEffect(() => {
    // Check immediately on mount
    checkAndShowReminders();

    // Check every minute
    checkIntervalRef.current = setInterval(checkAndShowReminders, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkAndShowReminders]);
}
