import { WEEKDAY_NAMES, timeToMinutes } from "@/lib/booking/core";
import { cn } from "@/lib/utils";

import { inputClass } from "./ui";

export type DayHours = {
  weekday: number;
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

/** Monday-first week, the way the shop reads its schedule. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function validateDayHours(days: readonly DayHours[]): string | null {
  for (const d of days) {
    if (!d.enabled) continue;
    const name = WEEKDAY_NAMES[d.weekday] ?? "";
    if (!d.start || !d.end || timeToMinutes(d.end) <= timeToMinutes(d.start))
      return `${name}: o horário final precisa ser depois do inicial.`;
    const hasBreakStart = !!d.breakStart;
    const hasBreakEnd = !!d.breakEnd;
    if (hasBreakStart !== hasBreakEnd) return `${name}: preencha início e fim do intervalo, ou deixe ambos vazios.`;
    if (hasBreakStart) {
      const bs = timeToMinutes(d.breakStart);
      const be = timeToMinutes(d.breakEnd);
      if (be <= bs) return `${name}: o fim do intervalo precisa ser depois do início.`;
      if (bs < timeToMinutes(d.start) || be > timeToMinutes(d.end))
        return `${name}: o intervalo precisa estar dentro do horário de trabalho.`;
    }
  }
  return null;
}

export function WeeklyHoursEditor({
  days,
  onChange,
  enabledLabel,
}: {
  days: readonly DayHours[];
  onChange: (days: DayHours[]) => void;
  enabledLabel: string;
}) {
  const update = (weekday: number, patch: Partial<DayHours>) =>
    onChange(days.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));

  const ordered = WEEK_ORDER.map((w) => days.find((d) => d.weekday === w)).filter(
    (d): d is DayHours => !!d,
  );

  return (
    <div className="flex flex-col">
      <div className="hidden grid-cols-[8rem_6rem_1fr_1fr] gap-3 pb-3 md:grid">
        <span className="eyebrow text-[0.5625rem] text-stone">Dia</span>
        <span className="eyebrow text-[0.5625rem] text-stone">{enabledLabel}</span>
        <span className="eyebrow text-[0.5625rem] text-stone">Horário</span>
        <span className="eyebrow text-[0.5625rem] text-stone">Intervalo (opcional)</span>
      </div>
      {ordered.map((d) => {
        const name = WEEKDAY_NAMES[d.weekday] ?? "";
        return (
          <div
            key={d.weekday}
            className="grid gap-3 border-t border-hairline py-4 md:grid-cols-[8rem_6rem_1fr_1fr] md:items-center"
          >
            <span className="text-sm text-ivory">{name}</span>
            <label className="flex items-center gap-2.5 text-sm text-stone">
              <input
                type="checkbox"
                checked={d.enabled}
                onChange={(e) => update(d.weekday, { enabled: e.target.checked })}
                className="h-4 w-4 accent-[var(--bronze)]"
              />
              {d.enabled ? "Sim" : "Não"}
            </label>
            <div className={cn("flex items-center gap-2", !d.enabled && "opacity-40")}>
              <input
                type="time"
                aria-label={`${name}: início`}
                value={d.start}
                disabled={!d.enabled}
                onChange={(e) => update(d.weekday, { start: e.target.value })}
                className={cn(inputClass, "h-10 [color-scheme:dark]")}
              />
              <span className="text-stone">—</span>
              <input
                type="time"
                aria-label={`${name}: fim`}
                value={d.end}
                disabled={!d.enabled}
                onChange={(e) => update(d.weekday, { end: e.target.value })}
                className={cn(inputClass, "h-10 [color-scheme:dark]")}
              />
            </div>
            <div className={cn("flex items-center gap-2", !d.enabled && "opacity-40")}>
              <input
                type="time"
                aria-label={`${name}: início do intervalo`}
                value={d.breakStart}
                disabled={!d.enabled}
                onChange={(e) => update(d.weekday, { breakStart: e.target.value })}
                className={cn(inputClass, "h-10 [color-scheme:dark]")}
              />
              <span className="text-stone">—</span>
              <input
                type="time"
                aria-label={`${name}: fim do intervalo`}
                value={d.breakEnd}
                disabled={!d.enabled}
                onChange={(e) => update(d.weekday, { breakEnd: e.target.value })}
                className={cn(inputClass, "h-10 [color-scheme:dark]")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const toTime = (value: string | null | undefined) => (value ? value.slice(0, 5) : "");
