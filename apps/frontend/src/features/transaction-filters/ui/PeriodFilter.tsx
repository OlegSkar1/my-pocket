"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useFiltersStore } from "../model/store";

export function PeriodFilter() {
  const dateFrom = useFiltersStore((s) => s.dateFrom);
  const dateTo = useFiltersStore((s) => s.dateTo);
  const setPeriod = useFiltersStore((s) => s.setPeriod);
  const [open, setOpen] = useState(false);

  // Локальное состояние диапазона и отображаемого месяца — пока попап открыт.
  const [range, setRange] = useState<DateRange | undefined>();
  const [month, setMonth] = useState<Date | undefined>();
  // "idle" — ждём первого клика (он начнёт новый диапазон, как в Airbnb);
  // "picking" — выбран старт, ждём конец.
  const [phase, setPhase] = useState<"idle" | "picking">("idle");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const from = parseISO(dateFrom);
      setRange({ from, to: parseISO(dateTo) });
      setMonth(from);
      setPhase("idle");
    }
    setOpen(next);
  };

  const label = `${format(parseISO(dateFrom), "d MMM", { locale: ru })} – ${format(
    parseISO(dateTo),
    "d MMM yyyy",
    { locale: ru },
  )}`;

  const handleSelect = (
    next: DateRange | undefined,
    clickedDay: Date,
  ) => {
    if (phase === "idle") {
      // Первый клик после открытия — начинаем новый диапазон со старта.
      setRange({ from: clickedDay, to: undefined });
      setPhase("picking");
      return;
    }
    // Второй клик — завершаем диапазон и коммитим.
    setRange(next);
    if (next?.from && next?.to) {
      setPeriod(format(next.from, "yyyy-MM-dd"), format(next.to, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start gap-2 font-normal">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{label}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          month={month}
          onMonthChange={setMonth}
          selected={range}
          onSelect={handleSelect}
          disabled={{ after: new Date() }}
          numberOfMonths={1}
        />
      </PopoverContent>
    </Popover>
  );
}
