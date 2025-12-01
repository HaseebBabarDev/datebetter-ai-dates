import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudioAvailabilityCalendarProps {
  studioId: string;
}

export function StudioAvailabilityCalendar({ studioId }: StudioAvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [patterns, setPatterns] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, [studioId, currentMonth]);

  const fetchAvailability = async () => {
    try {
      const [patternsRes, overridesRes, bookingsRes] = await Promise.all([
        supabase.from("studio_availability_patterns").select("*").eq("studio_id", studioId),
        supabase.from("studio_date_overrides").select("*").eq("studio_id", studioId),
        supabase
          .from("studio_bookings")
          .select("*")
          .eq("studio_id", studioId)
          .gte("booking_date", format(startOfMonth(currentMonth), "yyyy-MM-dd"))
          .lte("booking_date", format(endOfMonth(currentMonth), "yyyy-MM-dd")),
      ]);

      setPatterns(patternsRes.data || []);
      setOverrides(overridesRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();

    // Check overrides first
    const override = overrides.find((o) => o.override_date === dateStr);
    if (override) {
      return override.is_available ? "available" : "closed";
    }

    // Check bookings
    const dayBookings = bookings.filter((b) => b.booking_date === dateStr && b.status !== "cancelled");
    if (dayBookings.length > 0) {
      return "booked";
    }

    // Check weekly pattern
    const pattern = patterns.find((p) => p.day_of_week === dayOfWeek);
    if (pattern && !pattern.is_open) {
      return "closed";
    }

    return "available";
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading calendar...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</h3>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const status = getDayStatus(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg border
                ${isToday ? "border-primary border-2" : "border-border"}
                ${status === "available" ? "bg-primary-very-light" : ""}
                ${status === "booked" ? "bg-destructive/10" : ""}
                ${status === "closed" ? "bg-muted" : ""}
              `}
            >
              <span className="text-sm font-medium">{format(day, "d")}</span>
              <Badge
                variant={status === "available" ? "default" : status === "booked" ? "destructive" : "secondary"}
                className="text-[10px] px-1 py-0 mt-1"
              >
                {status}
              </Badge>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary-very-light border border-border"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-destructive/10 border border-border"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-muted border border-border"></div>
          <span>Closed</span>
        </div>
      </div>
    </div>
  );
}
