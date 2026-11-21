import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AppointmentSheet } from "@/components/admin/AppointmentSheet";
import { EmptyState, ErrorState, LoadingRows, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { appointmentsQuery, barbersQuery, upcomingQuery, type Appointment } from "@/lib/admin/api";
import {
  addDaysToKey,
  formatDateLong,
  formatDateShort,
  formatPrice,
  formatTime,
  friendlyError,
  isActiveStatus,
  toDateKey,
  todayKey,
} from "@/lib/booking/core";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

const PERIODS = [
  { id: "today", label: "Hoje" },
  { id: "next7", label: "Próximos 7 dias" },
  { id: "last30", label: "Últimos 30 dias" },
  { id: "month", label: "Este mês" },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

function periodRange(id: PeriodId, today: string): { from: string; to: string } {
  switch (id) {
    case "today":
      return { from: today, to: today };
    case "next7":
      return { from: today, to: addDaysToKey(today, 6) };
    case "last30":
      return { from: addDaysToKey(today, -29), to: today };
    case "month": {
      const first = `${today.slice(0, 8)}01`;
      const nextMonth = addDaysToKey(first, 32).slice(0, 8) + "01";
      return { from: first, to: addDaysToKey(nextMonth, -1) };
    }
  }
}

function Overview() {
  const today = todayKey();
  const [period, setPeriod] = useState<PeriodId>("today");
  const range = periodRange(period, today);
  const todayQ = useQuery(appointmentsQuery({ from: today, to: today }));
  const periodQ = useQuery(appointmentsQuery(range));
  const upcoming = useQuery(upcomingQuery);
  const barbers = useQuery(barbersQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    [...(upcoming.data ?? []), ...(todayQ.data ?? [])].find((a) => a.id === selectedId) ?? null;

  const todayRows = todayQ.data ?? [];
  const todayActive = todayRows.filter((a) => isActiveStatus(a.status));
  const revenueToday = todayActive.reduce((sum, a) => sum + a.service_price_cents, 0);
  const rows = periodQ.data ?? [];
  const count = (status: Appointment["status"]) => rows.filter((a) => a.status === status).length;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Visão geral"
        title={formatDateLong(today)}
        description="Indicadores calculados a partir dos agendamentos registrados."
      />

      {todayQ.isError ? (
        <ErrorState message={friendlyError(todayQ.error, "Não foi possível carregar os dados de hoje.")} onRetry={() => todayQ.refetch()} />
      ) : (
        <div className="grid gap-px border border-hairline bg-hairline sm:grid-cols-3">
          <Stat label="Agendamentos de hoje" value={todayQ.isPending ? "—" : String(todayRows.filter((a) => a.status !== "cancelled").length)} hint="Exceto cancelados" />
          <Stat label="Ativos hoje" value={todayQ.isPending ? "—" : String(todayActive.length)} hint="Pendentes e confirmados" />
          <Stat label="Receita prevista hoje" value={todayQ.isPending ? "—" : formatPrice(revenueToday)} hint="Soma dos agendamentos ativos" emphasis />
        </div>
      )}

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="eyebrow text-ivory/90">Status no período</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={period === p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "h-9 border px-3.5 text-[0.625rem] font-semibold uppercase tracking-[0.16em] transition-colors",
                  period === p.id ? "border-bronze text-bronze-light" : "border-hairline text-stone hover:text-ivory",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-stone">
          {formatDateShort(range.from)}
          {range.to !== range.from && ` a ${formatDateShort(range.to)}`}
        </p>
        {periodQ.isError ? (
          <div className="mt-5">
            <ErrorState message={friendlyError(periodQ.error, "Não foi possível carregar o período.")} onRetry={() => periodQ.refetch()} />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-px border border-hairline bg-hairline md:grid-cols-5">
            {(["pending", "confirmed", "completed", "cancelled", "no_show"] as const).map((s) => (
              <Stat
                key={s}
                small
                label={{ pending: "Pendentes", confirmed: "Confirmados", completed: "Concluídos", cancelled: "Cancelamentos", no_show: "Não compareceram" }[s]}
                value={periodQ.isPending ? "—" : String(count(s))}
              />
            ))}
          </div>
        )}
      </section>

      <Panel
        title="Próximos agendamentos"
        actions={
          <Link to="/admin/agendamentos" className="link-line text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-stone hover:text-ivory">
            Ver todos
          </Link>
        }
      >
        {upcoming.isPending ? (
          <LoadingRows rows={3} />
        ) : upcoming.isError ? (
          <ErrorState message={friendlyError(upcoming.error, "Não foi possível carregar os próximos agendamentos.")} onRetry={() => upcoming.refetch()} />
        ) : upcoming.data.length === 0 ? (
          <EmptyState message="Nenhum agendamento futuro." />
        ) : (
          <ul className="flex flex-col">
            {upcoming.data.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className="grid w-full grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-4 border-t border-hairline py-3.5 text-left transition-colors first:border-t-0 hover:bg-graphite/30 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <span className="text-sm tabular-nums text-ivory">
                    <span className="block text-xs text-stone">{formatDateShort(toDateKey(a.starts_at)).slice(0, 5)}</span>
                    {formatTime(a.starts_at)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ivory">{a.customer_name}</span>
                    <span className="block truncate text-xs text-stone sm:hidden">{a.service_name} · {a.barber_name}</span>
                  </span>
                  <span className="hidden min-w-0 truncate text-sm text-stone sm:block">
                    {a.service_name} · {a.barber_name}
                  </span>
                  <StatusBadge status={a.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <AppointmentSheet appointment={selected} onClose={() => setSelectedId(null)} barbers={barbers.data ?? []} />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  emphasis,
  small,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-ink-soft px-5 py-6 sm:px-6">
      <p className="eyebrow text-[0.5625rem] text-stone">{label}</p>
      <p
        className={cn(
          "mt-3 font-display font-medium leading-none tabular-nums",
          small ? "text-4xl" : "text-5xl",
          emphasis ? "text-bronze-light" : "text-ivory",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-stone/80">{hint}</p>}
    </div>
  );
}
