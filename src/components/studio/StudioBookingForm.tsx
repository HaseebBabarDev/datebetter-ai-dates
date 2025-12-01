import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface StudioBookingFormProps {
  studioId: string;
}

export function StudioBookingForm({ studioId }: StudioBookingFormProps) {
  const { user } = useAuth();
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to book a studio");
      return;
    }

    if (!bookingDate || !startTime || !endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const start = new Date(`${bookingDate}T${startTime}`);
      const end = new Date(`${bookingDate}T${endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      // Get base rate (simplified - should check time slots)
      const { data: studio } = await supabase
        .from("studios")
        .select("base_hourly_rate")
        .eq("id", studioId)
        .single();

      const totalAmount = (studio?.base_hourly_rate || 0) * hours;

      const { error } = await supabase.from("studio_bookings").insert({
        studio_id: studioId,
        user_id: user.id,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        total_hours: hours,
        total_amount: totalAmount,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Booking request submitted!");
      setBookingDate("");
      setStartTime("");
      setEndTime("");
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="date">Date</Label>
        <div className="relative mt-1.5">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="date"
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="start">Start Time</Label>
          <Input
            id="start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="end">End Time</Label>
          <Input
            id="end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1.5"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Booking..." : "Request Booking"}
      </Button>
    </form>
  );
}
