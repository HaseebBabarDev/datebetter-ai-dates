import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, DollarSign, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PricingStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PricingStep({ formData, setFormData }: PricingStepProps) {
  const [newSlot, setNewSlot] = useState({
    day: 0,
    startTime: "09:00",
    endTime: "10:00",
    rate: "",
    type: "regular" as "regular" | "peak" | "discounted",
  });

  const addTimeSlot = () => {
    if (newSlot.rate && parseFloat(newSlot.rate) > 0) {
      setFormData({
        ...formData,
        timeSlots: [...formData.timeSlots, { ...newSlot }],
      });
      setNewSlot({
        ...newSlot,
        startTime: newSlot.endTime,
        endTime: addHours(newSlot.endTime, 1),
        rate: "",
      });
    }
  };

  const removeTimeSlot = (index: number) => {
    setFormData({
      ...formData,
      timeSlots: formData.timeSlots.filter((_: any, i: number) => i !== index),
    });
  };

  const addHours = (time: string, hours: number) => {
    const [h, m] = time.split(":").map(Number);
    const newHour = (h + hours) % 24;
    return `${String(newHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="base_rate">Base Hourly Rate ($) *</Label>
        <div className="relative mt-1.5">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="base_rate"
            type="number"
            value={formData.base_hourly_rate}
            onChange={(e) =>
              setFormData({ ...formData, base_hourly_rate: e.target.value })
            }
            placeholder="50.00"
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Default rate when no specific time slots are defined
        </p>
      </div>

      <div className="border-t border-border pt-6">
        <Label className="text-base font-semibold mb-4 block">
          Custom Time Slots & Pricing
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Set specific hours with custom pricing for peak/off-peak times
        </p>

        <div className="grid grid-cols-12 gap-3 mb-4">
          <div className="col-span-2">
            <Select
              value={String(newSlot.day)}
              onValueChange={(v) => setNewSlot({ ...newSlot, day: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Input
              type="time"
              value={newSlot.startTime}
              onChange={(e) =>
                setNewSlot({ ...newSlot, startTime: e.target.value })
              }
            />
          </div>

          <div className="col-span-2">
            <Input
              type="time"
              value={newSlot.endTime}
              onChange={(e) =>
                setNewSlot({ ...newSlot, endTime: e.target.value })
              }
            />
          </div>

          <div className="col-span-2">
            <Input
              type="number"
              placeholder="Rate"
              value={newSlot.rate}
              onChange={(e) => setNewSlot({ ...newSlot, rate: e.target.value })}
            />
          </div>

          <div className="col-span-3">
            <Select
              value={newSlot.type}
              onValueChange={(v: any) => setNewSlot({ ...newSlot, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="peak">Peak</SelectItem>
                <SelectItem value="discounted">Discounted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1">
            <Button onClick={addTimeSlot} size="icon" className="w-full">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {formData.timeSlots.map((slot: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline">{DAYS[slot.day]}</Badge>
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {slot.startTime} - {slot.endTime}
                </span>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">${slot.rate}/hr</span>
                <Badge
                  variant={
                    slot.type === "peak"
                      ? "default"
                      : slot.type === "discounted"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {slot.type}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTimeSlot(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
