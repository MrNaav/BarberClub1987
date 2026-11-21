import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppointmentSheet } from "@/components/admin/AppointmentSheet";
import { ErrorState, inputClass, LoadingRows, PageHeader, StatusBadge } from "@/components/admin/ui";
import {
  appointmentsQuery,
  barberHoursQuery,
  barbersQuery,
  blocksQuery,
  businessHoursQuery,
  type Appointment,
  type BarberHoursRow,
  type BlockRow,
  type BusinessHoursRow,
} from "@/lib/admin/api";
import {
  addDaysToKey,
  formatDateLong,
  formatTime,
  friendlyError,
  localToIso,
  minutesToTime,
  timeToMinutes,
  todayKey,
  weekdayOfKey,
} from "@/lib/booking/core";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/agenda")({
  component: AgendaPage,
});

const TICK = 5; // minutes per grid row
const ROW_REM = 0.4; // height of one tick

type Segment =
  | { kind: "appointment"; start: number; end: number; appointment: Appointment }
  | { kind: "block"; start: number; end: number; reason: string }
  | { kind: "break" | "off" | "free"; start: number; end: number };

function minutesOfDay(iso: string, dateKey: string): number {
  return Math.round((new Date(iso).getTime() - new Date(localToIso(dateKey, "00:00")).getTime()) / 60000);
}

function buildSegments(opts: {
  dateKey: string;
  rangeStart: number;
  rangeEnd: number;
  shop: BusinessHoursRow | undefined;
  hours: BarberHoursRow | undefined;
  appointments: Appointment[];
  blocks: BlockRow[];
}): Segment[] {
  const { dateKey, rangeStart, rangeEnd, shop, hours } = opts;
  const working =
    shop?.is_open && hours?.is_working
      ? {
          start: Math.max(timeToMinutes(shop.open_time), timeToMinutes(hours.start_time)),
          end: Math.min(timeToMinutes(shop.close_time), timeToMinutes(hours.end_time)),
        }
      : null;
  const breaks = [
    shop?.break_start && shop.break_end ? [timeToMinutes(shop.break_start), timeToMinutes(shop.break_end)] : null,
    hours?.break_start && hours.break_end ? [timeToMinutes(hours.break_start), timeToMinutes(hours.break_end)] : null,
  ].filter((b): b is number[] => !!b);
  const appts = opts.appointments.map((a) => ({
    a,
    start: minutesOfDay(a.starts_at, dateKey),
    end: minutesOfDay(a.ends_at, dateKey),
  }));
  const blks = opts.blocks.map((b) => ({
    b,
    start: minutesOfDay(b.starts_at, dateKey),
    end: minutesOfDay(b.ends_at, dateKey),
  }));

  const segments: Segment[] = [];
  for (let t = rangeStart; t < rangeEnd; t += TICK) {
    const appt = appts.find((x) => t >= x.start && t < x.end);
    let next: Segment;
    if (appt) next = { kind: "appointment", start: t, end: t + TICK, appointment: appt.a };
    else {
      const blk = blks.find((x) => t >= x.start && t < x.end);
      if (blk) next = { kind: "block", start: t, end: t + TICK, reason: blk.b.reason };
      else if (!working || t < working.start || t >= working.end) next = { kind: "off", start: t, end: t + TICK };
      else if (breaks.some(([s, e]) => t >= s! && t < e!)) next = { kind: "break", start: t, end: t + TICK };
      else next = { kind: "free", start: t, end: t + TICK };
    }
    const last = segments[segments.length - 1];
    const same =
      last &&
      last.kind === next.kind &&
      (last.kind !== "appointment" ||
        (next.kind === "appointment" && last.appointment.id === next.appointment.id));
    if (last && same) last.end = next.end;
    else segments.push(next);
  }
  return segments;
}

function AgendaPage() {
  const [date, setDate] = useState(todayKey());
  const [mobileBarber, setMobileBarber] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const appts = useQuery(appointmentsQuery({ from: date, to: date }));
  const barbers = useQuery(barbersQuery);
  const barberHours = useQuery(barberHoursQuery);
  const shopHours = useQuery(businessHoursQuery);
  const blocks = useQuery(blocksQuery);

  const weekday = weekdayOfKey(date);
  const shop = shopHours.data?.find((h) => h.weekday === weekday);
  const dayAppointments = useMemo(
    () => (appts.data ?? []).filter((a) => a.status !== "cancelled"),
    [appts.data],
  );
  const dayStart = new Date(localToIso(date, "00:00")).getTime();
  const dayEnd = new Date(localToIso(addDaysToKey(date, 1), "00:00")).getTime();
  const dayBlocks = (blocks.data ?? []).filter(
    (b) => new Date(b.starts_at).getTime() < dayEnd && new Date(b.ends_at).getTime() > dayStart,
  );

  const shownBarbers = (barbers.data ?? []).filter(
    (b) => b.is_active || dayAppointments.some((a) => a.barber_id === b.id),
  );
  const activeMobile = mobileBarber && shownBarbers.some((b) => b.id === mobileBarber) ? mobileBarber : shownBarbers[0]?.id;

  // Visible range: opening hours, stretched to fit any appointment outside them.
  let rangeStart = shop?.is_open ? timeToMinutes(shop.open_time) : 9 * 60;
  let rangeEnd = shop?.is_open ? timeToMinutes(shop.close_time) : 18 * 60;
  for (const a of dayAppointments) {
    rangeStart = Math.min(rangeStart, Math.floor(minutesOfDay(a.starts_at, date) / 60) * 60);
    rangeEnd = Math.max(rangeEnd, Math.ceil(minutesOfDay(a.ends_at, date) / 60) * 60);
  }
  rangeStart = Math.max(0, Math.floor(rangeStart / 60) * 60);
  rangeEnd = Math.min(24 * 60, Math.ceil(rangeEnd / 60) * 60);
  const totalTicks = (rangeEnd - rangeStart) / TICK;
  const hoursMarks: number[] = [];
  for (let m = rangeStart; m < rangeEnd; m += 60) hoursMarks.push(m);

  const loading = appts.isPending || barbers.isPending || barberHours.isPending || shopHours.isPending || blocks.isPending;
  const failed = appts.error ?? barbers.error ?? barberHours.error ?? shopHours.error ?? blocks.error;
  const selected = (appts.data ?? []).find((a) => a.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Agenda do dia"
        title={formatDateLong(date)}
        description={shop?.is_open ? undefined : "A barbearia não abre neste dia."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NavButton onClick={() => setDate(addDaysToKey(date, -1))} label="Dia anterior">‹</NavButton>
            <NavButton onClick={() => setDate(todayKey())} label="Hoje" wide>Hoje</NavButton>
            <NavButton onClick={() => setDate(addDaysToKey(date, 1))} label="Próximo dia">›</NavButton>
            <input
              type="date"
              aria-label="Escolher data"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className={cn(inputClass, "h-10 w-auto [color-scheme:dark]")}
            />
          </div>
        }
      />

      <Legend />

      {loading ? (
        <LoadingRows rows={8} />
      ) : failed ? (
        <ErrorState message={friendlyError(failed, "Não foi possível carregar a agenda.")} onRetry={() => appts.refetch()} />
      ) : (
        <>
          {/* Barber switcher for phones */}
          <div className="flex gap-2 overflow-x-auto md:hidden" role="tablist" aria-label="Barbeiro">
            {shownBarbers.map((b) => (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={activeMobile === b.id}
                onClick={() => setMobileBarber(b.id)}
                className={cn(
                  "h-9 shrink-0 border px-3.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em]",
                  activeMobile === b.id ? "border-bronze text-bronze-light" : "border-hairline text-stone",
                )}
              >
                {b.name.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="flex border border-hairline bg-ink-soft">
            <div className="w-14 shrink-0 border-r border-hairline pt-12">
              <div className="relative" style={{ height: `${totalTicks * ROW_REM}rem` }}>
                {hoursMarks.map((m) => (
                  <span
                    key={m}
                    className="absolute right-2 -translate-y-1/2 text-[0.6875rem] tabular-nums text-stone"
                    style={{ top: `${((m - rangeStart) / TICK) * ROW_REM}rem` }}
                  >
                    {minutesToTime(m)}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid min-w-0 flex-1 md:auto-cols-fr md:grid-flow-col">
              {shownBarbers.map((b) => {
                const segments = buildSegments({
                  dateKey: date,
                  rangeStart,
                  rangeEnd,
                  shop,
                  hours: barberHours.data?.find((h) => h.barber_id === b.id && h.weekday === weekday),
                  appointments: dayAppointments.filter((a) => a.barber_id === b.id),
                  blocks: dayBlocks.filter((x) => x.barber_id === null || x.barber_id === b.id),
                });
                return (
                  <div
                    key={b.id}
                    className={cn("min-w-0 border-r border-hairline last:border-r-0", activeMobile === b.id ? "block" : "hidden md:block")}
                  >
                    <div className="flex h-12 items-center justify-between gap-2 border-b border-hairline px-3">
                      <span className="truncate text-sm text-ivory">{b.name}</span>
                      {!b.is_active && <span className="eyebrow text-[0.5rem] text-stone">Inativo</span>}
                    </div>
                    <div
                      className="relative grid"
                      style={{ gridTemplateRows: `repeat(${totalTicks}, ${ROW_REM}rem)` }}
                    >
                      {hoursMarks.map((m) => (
                        <span
                          key={m}
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 border-t border-hairline/60"
                          style={{ top: `${((m - rangeStart) / TICK) * ROW_REM}rem` }}
                        />
                      ))}
                      {segments.map((s) => (
                        <SegmentCell
                          key={`${s.kind}-${s.start}`}
                          segment={s}
                          rowStart={(s.start - rangeStart) / TICK + 1}
                          rowSpan={(s.end - s.start) / TICK}
                          onOpen={setSelectedId}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(appts.data ?? []).some((a) => a.status === "cancelled") && (
            <p className="text-xs text-stone">
              {(appts.data ?? []).filter((a) => a.status === "cancelled").length} cancelado(s) neste dia não aparecem na grade e não ocupam horário.
            </p>
          )}
        </>
      )}

      <AppointmentSheet appointment={selected} onClose={() => setSelectedId(null)} barbers={barbers.data ?? []} />
    </div>
  );
}

function SegmentCell({
  segment: s,
  rowStart,
  rowSpan,
  onOpen,
}: {
  segment: Segment;
  rowStart: number;
  rowSpan: number;
  onOpen: (id: string) => void;
}) {
  const style = { gridRow: `${rowStart} / span ${rowSpan}` };
  const range = `${minutesToTime(s.start)} — ${minutesToTime(s.end)}`;
  if (s.kind === "appointment") {
    const a = s.appointment;
    return (
      <button
        type="button"
        style={style}
        onClick={() => onOpen(a.id)}
        className={cn(
          "relative z-[1] m-0.5 flex min-h-0 flex-col items-start gap-1 overflow-hidden border-l-2 px-2.5 py-1.5 text-left transition-colors",
          a.status === "confirmed" && "border-bronze bg-bronze/20 hover:bg-bronze/30",
          a.status === "pending" && "border-bronze-light bg-graphite hover:bg-graphite/70",
          (a.status === "completed" || a.status === "no_show") && "border-stone bg-graphite/50 hover:bg-graphite",
        )}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="text-[0.6875rem] tabular-nums text-ivory/80">
            {formatTime(a.starts_at)} — {formatTime(a.ends_at)}
          </span>
          {rowSpan >= 6 && <StatusBadge status={a.status} className="h-5 px-1.5 text-[0.5rem]" />}
        </span>
        <span className="w-full truncate text-[0.8125rem] font-medium text-ivory">{a.customer_name}</span>
        {rowSpan >= 8 && <span className="w-full truncate text-xs text-stone">{a.service_name}</span>}
      </button>
    );
  }
  if (s.kind === "free") {
    return (
      <div style={style} className="flex items-start px-2.5 py-1.5">
        {rowSpan >= 3 && <span className="text-[0.6875rem] text-stone/70">Livre · {range}</span>}
      </div>
    );
  }
  if (s.kind === "block") {
    return (
      <div style={style} className="m-0.5 flex items-start overflow-hidden bg-[repeating-linear-gradient(135deg,var(--graphite)_0_6px,transparent_6px_12px)] px-2.5 py-1.5">
        {rowSpan >= 3 && (
          <span className="truncate bg-ink-soft px-1 text-[0.6875rem] text-stone">Bloqueado{s.reason ? ` · ${s.reason}` : ""}</span>
        )}
      </div>
    );
  }
  return (
    <div style={style} className={cn("flex items-start px-2.5 py-1.5", s.kind === "off" ? "bg-ink/70" : "bg-graphite/40")}>
      {rowSpan >= 3 && (
        <span className="text-[0.6875rem] text-stone/50">{s.kind === "off" ? "Fora do expediente" : "Intervalo"}</span>
      )}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Confirmado", cls: "border-l-2 border-bronze bg-bronze/20" },
    { label: "Pendente", cls: "border-l-2 border-bronze-light bg-graphite" },
    { label: "Concluído / não compareceu", cls: "border-l-2 border-stone bg-graphite/50" },
    { label: "Bloqueado", cls: "bg-[repeating-linear-gradient(135deg,var(--graphite)_0_4px,transparent_4px_8px)]" },
    { label: "Fora do expediente", cls: "bg-ink/70 border border-hairline" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2 text-xs text-stone">
          <span aria-hidden className={cn("h-3.5 w-5", i.cls)} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function NavButton({
  children,
  onClick,
  label,
  wide,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "h-10 border border-hairline text-ivory transition-colors hover:border-bronze hover:text-bronze-light",
        wide ? "px-4 text-[0.625rem] font-semibold uppercase tracking-[0.16em]" : "w-10 text-lg",
      )}
    >
      {children}
    </button>
  );
}
