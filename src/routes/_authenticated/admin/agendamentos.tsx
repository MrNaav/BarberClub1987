import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppointmentSheet } from "@/components/admin/AppointmentSheet";
import {
  EmptyState,
  ErrorState,
  FormField,
  inputClass,
  LoadingRows,
  PageHeader,
  SelectField,
  StatusBadge,
} from "@/components/admin/ui";
import { appointmentsQuery, barbersQuery, servicesQuery, type Appointment } from "@/lib/admin/api";
import {
  addDaysToKey,
  formatDateShort,
  formatDuration,
  formatPhone,
  formatPrice,
  formatTime,
  friendlyError,
  STATUS_LABELS,
  STATUS_ORDER,
  toDateKey,
  todayKey,
  type AppointmentStatus,
} from "@/lib/booking/core";
import { cn } from "@/lib/utils";
import { adminHead } from "@/lib/admin/metadata";

export const Route = createFileRoute("/_authenticated/admin/agendamentos")({
  head: () => adminHead("Agendamentos", "Gestão administrativa das reservas da Barber Club 1987."),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const today = todayKey();
  const [from, setFrom] = useState(addDaysToKey(today, -7));
  const [to, setTo] = useState(addDaysToKey(today, 30));
  const [barberId, setBarberId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [descending, setDescending] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const validRange = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to;
  const list = useQuery({
    ...appointmentsQuery({
      from,
      to,
      ...(barberId ? { barberId } : {}),
      ...(serviceId ? { serviceId } : {}),
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    }),
    enabled: validRange,
  });
  const barbers = useQuery(barbersQuery);
  const services = useQuery(servicesQuery);

  const rows = useMemo(() => {
    const data = [...(list.data ?? [])];
    return descending ? data.reverse() : data;
  }, [list.data, descending]);
  const selected: Appointment | null = rows.find((r) => r.id === selectedId) ?? null;

  const preset = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Agendamentos"
        title="Todos os agendamentos"
        description="Busque, filtre e gerencie as reservas. A lista se atualiza automaticamente."
      />

      <div className="flex flex-col gap-4 border border-hairline bg-ink-soft p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <FormField label="Buscar cliente" htmlFor="f-search" className="md:col-span-2">
            <input
              id="f-search"
              type="search"
              placeholder="Nome ou telefone"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="De" htmlFor="f-from">
            <input id="f-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={cn(inputClass, "[color-scheme:dark]")} />
          </FormField>
          <FormField label="Até" htmlFor="f-to">
            <input id="f-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={cn(inputClass, "[color-scheme:dark]")} />
          </FormField>
          <FormField label="Barbeiro" htmlFor="f-barber">
            <SelectField id="f-barber" value={barberId} onChange={setBarberId}>
              <option value="">Todos</option>
              {(barbers.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </SelectField>
          </FormField>
          <FormField label="Serviço" htmlFor="f-service">
            <SelectField id="f-service" value={serviceId} onChange={setServiceId}>
              <option value="">Todos</option>
              {(services.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </FormField>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
            {(["", ...STATUS_ORDER] as const).map((s) => (
              <button
                key={s || "all"}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "h-8 border px-3 text-[0.625rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                  status === s ? "border-bronze text-bronze-light" : "border-hairline text-stone hover:text-ivory",
                )}
              >
                {s ? STATUS_LABELS[s] : "Todos"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
            <button type="button" className="link-line text-stone hover:text-ivory" onClick={() => preset(today, today)}>
              Hoje
            </button>
            <button type="button" className="link-line text-stone hover:text-ivory" onClick={() => preset(today, addDaysToKey(today, 6))}>
              Próximos 7 dias
            </button>
            <button type="button" className="link-line text-stone hover:text-ivory" onClick={() => preset(addDaysToKey(today, -30), today)}>
              Últimos 30 dias
            </button>
            <button type="button" className="link-line text-bronze-light" onClick={() => setDescending((d) => !d)}>
              Horário {descending ? "↓ mais recentes" : "↑ mais antigos"}
            </button>
          </div>
        </div>
      </div>

      {!validRange ? (
        <ErrorState message="Escolha um período válido: a data final precisa ser igual ou posterior à inicial." />
      ) : list.isPending ? (
        <LoadingRows rows={6} />
      ) : list.isError ? (
        <ErrorState message={friendlyError(list.error, "Não foi possível carregar os agendamentos.")} onRetry={() => list.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState message="Nenhum agendamento encontrado com esses filtros." />
      ) : (
        <>
          <p className="text-xs text-stone">
            {rows.length} {rows.length === 1 ? "agendamento" : "agendamentos"}
          </p>
          {/* Desktop table */}
          <div className="hidden border border-hairline xl:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-hairline">
                  {["Data", "Horário", "Cliente", "Telefone", "Serviço", "Barbeiro", "Duração", "Preço", "Status"].map((h) => (
                    <th key={h} scope="col" className="eyebrow px-3 py-3 text-[0.5625rem] font-semibold text-stone">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    tabIndex={0}
                    onClick={() => setSelectedId(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(a.id);
                      }
                    }}
                    className="cursor-pointer border-b border-hairline transition-colors last:border-0 hover:bg-graphite/30 focus-visible:bg-graphite/40 focus-visible:outline-none"
                  >
                    <td className="px-3 py-3 tabular-nums text-ivory">{formatDateShort(toDateKey(a.starts_at))}</td>
                    <td className="px-3 py-3 tabular-nums text-ivory">{formatTime(a.starts_at)}</td>
                    <td className="truncate px-3 py-3 text-ivory">{a.customer_name}</td>
                    <td className="truncate px-3 py-3 tabular-nums text-stone">{formatPhone(a.customer_phone)}</td>
                    <td className="truncate px-3 py-3 text-stone">{a.service_name}</td>
                    <td className="truncate px-3 py-3 text-stone">{a.barber_name}</td>
                    <td className="px-3 py-3 text-stone">{formatDuration(a.service_duration_minutes)}</td>
                    <td className="px-3 py-3 tabular-nums text-ivory">{formatPrice(a.service_price_cents)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Cards for smaller screens */}
          <ul className="flex flex-col gap-2 xl:hidden">
            {rows.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className="w-full border border-hairline bg-ink-soft p-4 text-left transition-colors hover:border-ivory/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm tabular-nums text-stone">
                        {formatDateShort(toDateKey(a.starts_at))} · <span className="text-ivory">{formatTime(a.starts_at)}</span>
                      </p>
                      <p className="mt-1 truncate font-display text-xl text-ivory">{a.customer_name}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-2 text-sm text-stone">
                    {a.service_name} · {a.barber_name} · {formatDuration(a.service_duration_minutes)}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <span className="tabular-nums text-stone">{formatPhone(a.customer_phone)}</span>
                    <span className="tabular-nums text-ivory">{formatPrice(a.service_price_cents)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <AppointmentSheet appointment={selected} onClose={() => setSelectedId(null)} barbers={barbers.data ?? []} />
    </div>
  );
}
