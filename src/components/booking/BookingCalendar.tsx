import { ptBR } from "react-day-picker/locale";

import { Calendar } from "@/components/ui/calendar";
import { calendarDateToKey, keyToCalendarDate } from "@/lib/booking/core";
import { cn } from "@/lib/utils";

type Props = {
  availableDates: readonly string[];
  selected: string | null;
  onSelect: (dateKey: string) => void;
  fromKey: string;
  toKey: string;
};

/** Month calendar where only dates with real availability can be picked. */
export function BookingCalendar({ availableDates, selected, onSelect, fromKey, toKey }: Props) {
  const available = new Set(availableDates);
  const firstAvailable = availableDates[0];

  return (
    <Calendar
      mode="single"
      locale={ptBR}
      showOutsideDays={false}
      selected={selected ? keyToCalendarDate(selected) : undefined}
      defaultMonth={keyToCalendarDate(selected ?? firstAvailable ?? fromKey)}
      startMonth={keyToCalendarDate(fromKey)}
      endMonth={keyToCalendarDate(toKey)}
      disabled={(date) => !available.has(calendarDateToKey(date))}
      onSelect={(date) => {
        if (date) onSelect(calendarDateToKey(date));
      }}
      className="w-full bg-transparent p-0 [--cell-size:2.75rem] sm:[--cell-size:3rem]"
      classNames={{
        root: "w-full",
        month: "flex w-full flex-col gap-5",
        month_caption: "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
        caption_label: "font-display text-2xl font-medium capitalize text-ivory",
        button_previous: cn(
          "inline-flex h-(--cell-size) w-(--cell-size) items-center justify-center text-ivory transition-colors hover:text-bronze-light aria-disabled:opacity-25",
        ),
        button_next: cn(
          "inline-flex h-(--cell-size) w-(--cell-size) items-center justify-center text-ivory transition-colors hover:text-bronze-light aria-disabled:opacity-25",
        ),
        weekday:
          "flex-1 select-none pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-stone",
        week: "mt-1 flex w-full gap-1",
        day: "group/day relative aspect-square h-full w-full select-none p-0 text-center",
        today: "[&_button]:underline [&_button]:decoration-bronze [&_button]:underline-offset-4",
        disabled: "[&_button]:text-stone/30 [&_button]:line-through [&_button]:decoration-stone/20",
      }}
      components={{
        DayButton: ({ day, modifiers, className, ...props }) => (
          <button
            {...props}
            type="button"
            data-selected={modifiers["selected"] || undefined}
            className={cn(
              "flex aspect-square w-full min-w-(--cell-size) items-center justify-center rounded-none border border-transparent text-[0.9375rem] text-ivory transition-colors",
              "enabled:hover:border-bronze/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bronze disabled:cursor-not-allowed",
              modifiers["selected"] && "border-bronze bg-bronze font-semibold text-ink enabled:hover:border-bronze",
              !modifiers["disabled"] && !modifiers["selected"] && "bg-graphite/60",
              className,
            )}
          >
            {day.date.getDate()}
          </button>
        ),
      }}
    />
  );
}
