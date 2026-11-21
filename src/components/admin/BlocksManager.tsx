import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { addBlock, blocksQuery, removeBlock, type BarberRow } from "@/lib/admin/api";
import {
  addDaysToKey,
  formatDateShort,
  formatTime,
  friendlyError,
  localToIso,
  toDateKey,
  todayKey,
} from "@/lib/booking/core";
import { cn } from "@/lib/utils";

import { ConfirmDialog, EmptyState, ErrorState, FormField, inputClass, LoadingRows } from "./ui";

/**
 * Days off, blocked dates and blocked time ranges.
 * barberId = null manages shop-wide blocks; otherwise blocks for one barber.
 */
export function BlocksManager({ barberId, barbers }: { barberId: string | null; barbers?: readonly BarberRow[] }) {
  const queryClient = useQueryClient();
  const blocks = useQuery(blocksQuery);
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toRemove, setToRemove] = useState<string | null>(null);

  const mine = (blocks.data ?? []).filter((b) => (barberId ? b.barber_id === barberId : b.barber_id === null));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || (allDay && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)))
      return setError("Preencha as datas do bloqueio.");
    let startsAt: string;
    let endsAt: string;
    if (allDay) {
      if (endDate < startDate) return setError("A data final precisa ser igual ou posterior à inicial.");
      startsAt = localToIso(startDate, "00:00");
      endsAt = localToIso(addDaysToKey(endDate, 1), "00:00");
    } else {
      if (!startTime || !endTime || endTime <= startTime) return setError("O horário final precisa ser depois do inicial.");
      startsAt = localToIso(startDate, startTime);
      endsAt = localToIso(startDate, endTime);
    }
    if (reason.length > 200) return setError("Motivo com no máximo 200 caracteres.");
    setBusy(true);
    try {
      await addBlock({ barber_id: barberId, starts_at: startsAt, ends_at: endsAt, reason: reason.trim() });
      toast.success("Bloqueio adicionado.");
      setReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "blocks"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "reschedule-slots"] }),
        queryClient.invalidateQueries({ queryKey: ["public"] }),
      ]);
    } catch (err) {
      toast.error(friendlyError(err, "Não foi possível adicionar o bloqueio."));
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    setBusy(true);
    try {
      await removeBlock(toRemove);
      toast.success("Bloqueio removido.");
      setToRemove(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "blocks"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "reschedule-slots"] }),
        queryClient.invalidateQueries({ queryKey: ["public"] }),
      ]);
    } catch (err) {
      toast.error(friendlyError(err, "Não foi possível remover o bloqueio."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} noValidate className="grid gap-4 border border-hairline p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          {[
            { value: true, label: "Dia inteiro" },
            { value: false, label: "Faixa de horário" },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              aria-pressed={allDay === opt.value}
              onClick={() => setAllDay(opt.value)}
              className={cn(
                "h-9 border px-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] transition-colors",
                allDay === opt.value ? "border-bronze text-bronze-light" : "border-hairline text-stone hover:text-ivory",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <FormField label={allDay ? "De" : "Data"} htmlFor={`blk-start-${barberId ?? "shop"}`}>
          <input
            id={`blk-start-${barberId ?? "shop"}`}
            type="date"
            min={todayKey()}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (endDate < e.target.value) setEndDate(e.target.value);
            }}
            className={cn(inputClass, "[color-scheme:dark]")}
          />
        </FormField>
        {allDay ? (
          <FormField label="Até" htmlFor={`blk-end-${barberId ?? "shop"}`}>
            <input
              id={`blk-end-${barberId ?? "shop"}`}
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={cn(inputClass, "[color-scheme:dark]")}
            />
          </FormField>
        ) : (
          <FormField label="Horário" htmlFor={`blk-t1-${barberId ?? "shop"}`}>
            <div className="flex items-center gap-2">
              <input id={`blk-t1-${barberId ?? "shop"}`} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={cn(inputClass, "[color-scheme:dark]")} aria-label="Início" />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={cn(inputClass, "[color-scheme:dark]")} aria-label="Fim" />
            </div>
          </FormField>
        )}
        <FormField label="Motivo (opcional)" htmlFor={`blk-reason-${barberId ?? "shop"}`}>
          <input
            id={`blk-reason-${barberId ?? "shop"}`}
            value={reason}
            maxLength={200}
            placeholder={barberId ? "Folga, curso…" : "Feriado, manutenção…"}
            onChange={(e) => setReason(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" variant="line-bronze" size="compact" disabled={busy} className="w-full">
            Adicionar bloqueio
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-bronze-light sm:col-span-2 lg:col-span-4">
            {error}
          </p>
        )}
      </form>

      {blocks.isPending ? (
        <LoadingRows rows={2} />
      ) : blocks.isError ? (
        <ErrorState message={friendlyError(blocks.error, "Não foi possível carregar os bloqueios.")} onRetry={() => blocks.refetch()} />
      ) : mine.length === 0 ? (
        <EmptyState message="Nenhum bloqueio futuro." />
      ) : (
        <ul className="flex flex-col">
          {mine.map((b) => {
            const startKey = toDateKey(b.starts_at);
            const endKey = toDateKey(new Date(new Date(b.ends_at).getTime() - 1));
            const fullDay = formatTime(b.starts_at) === "00:00" && formatTime(b.ends_at) === "00:00";
            const label = fullDay
              ? startKey === endKey
                ? `${formatDateShort(startKey)} · dia inteiro`
                : `${formatDateShort(startKey)} a ${formatDateShort(endKey)} · dias inteiros`
              : `${formatDateShort(startKey)} · ${formatTime(b.starts_at)} — ${formatTime(b.ends_at)}`;
            return (
              <li key={b.id} className="flex items-center justify-between gap-4 border-t border-hairline py-3 last:border-b">
                <div className="min-w-0">
                  <p className="text-sm text-ivory">{label}</p>
                  {(b.reason || (!barberId && barbers)) && (
                    <p className="mt-0.5 truncate text-xs text-stone">{b.reason || "Sem motivo informado"}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setToRemove(b.id)}
                  className="link-line shrink-0 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-stone hover:text-ivory"
                >
                  Remover
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => !open && setToRemove(null)}
        title="Remover bloqueio?"
        description="Os horários desse período voltam a ficar disponíveis para agendamento."
        confirmLabel="Remover"
        onConfirm={confirmRemove}
        busy={busy}
      />
    </div>
  );
}
