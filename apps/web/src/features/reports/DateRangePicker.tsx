"use client";

import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  active?: boolean;
}

export function DateRangePicker({ range, onRangeChange, active }: DateRangePickerProps) {
  const label =
    range?.from && range?.to
      ? `${format(range.from, "d MMM yyyy", { locale: es })} - ${format(range.to, "d MMM yyyy", { locale: es })}`
      : "Rango personalizado";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={active ? "primary" : "outline"}>
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <Calendar
          mode="range"
          defaultMonth={range?.from}
          selected={range}
          onSelect={onRangeChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
