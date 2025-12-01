import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";

interface AvailabilityStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function AvailabilityStep({
  formData,
  setFormData,
}: AvailabilityStepProps) {
  const toggleDay = (dayIndex: number) => {
    const updated = [...formData.weeklySchedule];
    updated[dayIndex] = { ...updated[dayIndex], isOpen: !updated[dayIndex].isOpen };
    setFormData({ ...formData, weeklySchedule: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Calendar className="w-5 h-5" />
        <p className="text-sm">
          Set your recurring weekly schedule. You can override specific dates in
          the next step.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Weekly Schedule</Label>
        {DAYS.map((day, idx) => (
          <div
            key={day}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold ${
                  formData.weeklySchedule[idx].isOpen
                    ? "bg-primary-very-light text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {day.slice(0, 3)}
              </div>
              <div>
                <p className="font-medium text-foreground">{day}</p>
                <p className="text-xs text-muted-foreground">
                  {formData.weeklySchedule[idx].isOpen ? "Open" : "Closed"}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.weeklySchedule[idx].isOpen}
              onCheckedChange={() => toggleDay(idx)}
            />
          </div>
        ))}
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-4 mt-6">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> You'll set specific hours and pricing for each
          day in the next step. This schedule only controls which days are
          generally available.
        </p>
      </div>
    </div>
  );
}
