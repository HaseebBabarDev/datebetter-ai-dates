import React from "react";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface AddToCalendarProps {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  children?: React.ReactNode;
}

export function AddToCalendar({ 
  title, 
  description = "", 
  location = "",
  startDate, 
  endDate,
  children 
}: AddToCalendarProps) {
  const end = endDate || new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "");
  };

  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, -1) + "Z";
  };

  const handleGoogleCalendar = () => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(end)}`,
      details: description,
      location: location,
    });
    window.open(`https://calendar.google.com/calendar/render?${params}`, "_blank");
  };

  const handleAppleCalendar = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//dateBetter//EN",
      "BEGIN:VEVENT",
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
      `LOCATION:${location}`,
      `UID:${Date.now()}@datebetter.app`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleOutlook = () => {
    const params = new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      subject: title,
      startdt: startDate.toISOString(),
      enddt: end.toISOString(),
      body: description,
      location: location,
    });
    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params}`, "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            Add to Calendar
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleAppleCalendar} className="gap-2 cursor-pointer">
          <Download className="w-4 h-4" />
          Apple Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGoogleCalendar} className="gap-2 cursor-pointer">
          <Calendar className="w-4 h-4" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlook} className="gap-2 cursor-pointer">
          <Calendar className="w-4 h-4" />
          Outlook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
