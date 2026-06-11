"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useFiltersStore } from "../model/store";

export function PeriodFilter() {
  const dateFrom = useFiltersStore((s) => s.dateFrom);
  const dateTo = useFiltersStore((s) => s.dateTo);
  const setPeriod = useFiltersStore((s) => s.setPeriod);
  const [open, setOpen] = useState(false);

  const selected: DateRange = {
    from: parseISO(dateFrom),
    to: parseISO(dateTo),
  };

  const label = `${format(parseISO(dateFrom), "d MMM", { locale: ru })} – ${format(
    parseISO(dateTo),
    "d MMM yyyy",
    { locale: ru },
  )}`;

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setPeriod(format(range.from, "yyyy-MM-dd"), format(range.to, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start gap-2 font-normal">
          <CalendarIcon className="h-4 w-4" />
          <span className="capitalize">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={selected.from}
          selected={selected}
          onSelect={handleSelect}
          numberOfMonths={1}
        />
      </PopoverContent>
    </Popover>
  );
}
