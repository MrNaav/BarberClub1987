import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { BlocksManager } from "@/components/admin/BlocksManager";
import { ErrorState, FormField, inputClass, LoadingRows, PageHeader, Panel, SelectField } from "@/components/admin/ui";
import { toTime, validateDayHours, WeeklyHoursEditor, type DayHours } from "@/components/admin/WeeklyHoursEditor";
import { Button } from "@/components/ui/button";
import {
  businessHoursQuery,
  saveBusinessHours,
  saveSettings,
  settingsQuery,
  type BusinessHoursRow,
  type SettingsRow,
} from "@/lib/admin/api";
import { friendlyError } from "@/lib/booking/core";
import { adminHead } from "@/lib/admin/metadata";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => adminHead("Configurações da agenda", "Horários e regras de reserva da Barber Club 1987."),
  component: SettingsPage,
});

function SettingsPage() {
  const hours = useQuery(businessHoursQuery);
  const settings = useQuery(settingsQuery);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Configurações da agenda"
        title="Regras de funcionamento"
        description="Estas regras definem quais horários aparecem para os clientes no agendamento."
      />
      {hours.isPending || settings.isPending ? (
        <LoadingRows rows={6} />
      ) : hours.isError || settings.isError ? (
        <ErrorState
          message={friendlyError(hours.error ?? settings.error, "Não foi possível carregar as configurações.")}
          onRetry={() => {
            hours.refetch();
            settings.refetch();
          }}
        />
      ) : (
        <>
          <BusinessHoursPanel key={hours.dataUpdatedAt} rows={hours.data} />
          <GeneralSettingsPanel key={settings.dataUpdatedAt} settings={settings.data} />
          <Panel title="Bloqueios da barbearia" description="Feriados, datas fechadas ou faixas de horário bloqueadas para toda a equipe.">
            <BlocksManager barberId={null} />
          </Panel>
        </>
      )}
    </div>
  );
}

function BusinessHoursPanel({ rows }: { rows: BusinessHoursRow[] }) {
  const queryClient = useQueryClient();
  const [days, setDays] = useState<DayHours[]>(() =>
    [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
      const r = rows.find((x) => x.weekday === weekday);
      return {
        weekday,
        enabled: r?.is_open ?? false,
        start: toTime(r?.open_time) || "09:00",
        end: toTime(r?.close_time) || "18:00",
        breakStart: toTime(r?.break_start),
        breakEnd: toTime(r?.break_end),
      };
    }),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const problem = validateDayHours(days);
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      await saveBusinessHours(
        days.map((d) => ({
          weekday: d.weekday,
          is_open: d.enabled,
          open_time: d.start,
          close_time: d.end,
          break_start: d.enabled && d.breakStart ? d.breakStart : null,
          break_end: d.enabled && d.breakEnd ? d.breakEnd : null,
        })),
      );
      toast.success("Horário de funcionamento salvo.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["public"] }),
      ]);
    } catch (err) {
      toast.error(friendlyError(err, "Não foi possível salvar o horário."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Horário de funcionamento" description="Também é exibido no rodapé do site.">
      <WeeklyHoursEditor days={days} onChange={setDays} enabledLabel="Abre" />
      {error && (
        <p role="alert" className="mt-4 text-sm text-bronze-light">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button variant="bronze" size="compact" onClick={save} disabled={busy}>
          {busy ? "Salvando…" : "Salvar horário"}
        </Button>
      </div>
    </Panel>
  );
}

const NOTICE_OPTIONS = [0, 30, 60, 120, 180, 240, 360, 720, 1440, 2880];
const INTERVAL_OPTIONS = [10, 15, 20, 30, 45, 60];

function noticeLabel(m: number) {
  if (m === 0) return "Sem antecedência";
  if (m < 60) return `${m} minutos`;
  if (m < 1440) return `${m / 60} ${m === 60 ? "hora" : "horas"}`;
  return `${m / 1440} ${m === 1440 ? "dia" : "dias"}`;
}

function GeneralSettingsPanel({ settings }: { settings: SettingsRow }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState(String(settings.min_notice_minutes));
  const [maxDays, setMaxDays] = useState(String(settings.max_days_ahead));
  const [buffer, setBuffer] = useState(String(settings.buffer_minutes));
  const [slotInterval, setSlotInterval] = useState(String(settings.slot_interval_minutes));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const found: Record<string, string> = {};
    const days = Number(maxDays);
    const buf = Number(buffer);
    if (Number(notice) > days * 1440) found["maxDays"] = "O limite de dias precisa comportar a antecedência mínima.";
    if (!Number.isInteger(days) || days < 1 || days > 180) found["maxDays"] = "Entre 1 e 180 dias.";
    if (!Number.isInteger(buf) || buf < 0 || buf > 120) found["buffer"] = "Entre 0 e 120 minutos.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await saveSettings({
        min_notice_minutes: Number(notice),
        max_days_ahead: days,
        buffer_minutes: buf,
        slot_interval_minutes: Number(slotInterval),
      });
      toast.success("Configurações salvas.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["public"] }),
      ]);
    } catch (err) {
      toast.error(friendlyError(err, "Não foi possível salvar as configurações."));
    } finally {
      setBusy(false);
    }
  };

  const noticeOptions = NOTICE_OPTIONS.includes(settings.min_notice_minutes)
    ? NOTICE_OPTIONS
    : [...NOTICE_OPTIONS, settings.min_notice_minutes].sort((a, b) => a - b);

  return (
    <Panel title="Regras de reserva">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <FormField label="Antecedência mínima" htmlFor="st-notice" hint="Tempo mínimo entre a reserva e o atendimento.">
          <SelectField id="st-notice" value={notice} onChange={setNotice}>
            {noticeOptions.map((m) => (
              <option key={m} value={m}>
                {noticeLabel(m)}
              </option>
            ))}
          </SelectField>
        </FormField>
        <FormField label="Dias futuros disponíveis" htmlFor="st-days" error={errors["maxDays"]} hint="Até quantos dias à frente é possível reservar.">
          <input id="st-days" type="number" min={1} max={180} value={maxDays} onChange={(e) => setMaxDays(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Tempo entre atendimentos (min)" htmlFor="st-buffer" error={errors["buffer"]} hint="Folga após cada atendimento.">
          <input id="st-buffer" type="number" min={0} max={120} step={5} value={buffer} onChange={(e) => setBuffer(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Espaçamento dos horários" htmlFor="st-interval" hint="De quanto em quanto tempo os horários são oferecidos.">
          <SelectField id="st-interval" value={slotInterval} onChange={setSlotInterval}>
            {INTERVAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                A cada {m} minutos
              </option>
            ))}
          </SelectField>
        </FormField>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="bronze" size="compact" onClick={save} disabled={busy}>
          {busy ? "Salvando…" : "Salvar regras"}
        </Button>
      </div>
    </Panel>
  );
}
