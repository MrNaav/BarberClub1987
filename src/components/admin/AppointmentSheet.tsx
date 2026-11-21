import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  fetchRescheduleSlots,
  rescheduleAppointment,
  updateAppointmentDetails,
  updateAppointmentStatus,
  type Appointment,
  type BarberRow,
} from "@/lib/admin/api";
import {
  allowedTransitions,
  formatDateLong,
  formatDuration,
  formatPhone,
  formatPrice,
  formatTime,
  friendlyError,
  isActiveStatus,
  isValidPhone,
  phoneDigits,
  STATUS_LABELS,
  toDateKey,
  todayKey,
  type AppointmentStatus,
} from "@/lib/booking/core";
import { cn } from "@/lib/utils";

import { ConfirmDialog, FormField, inputClass, SelectField, StatusBadge } from "./ui";

const ACTION_COPY: Record<AppointmentStatus, { label: string; title: string; description: string }> = {
  confirmed: {
    label: "Confirmar",
    title: "Confirmar agendamento?",
    description: "O agendamento passa para Confirmado e continua reservando o horário.",
  },
  completed: {
    label: "Marcar como concluído",
    title: "Marcar como concluído?",
    description: "O atendimento fica registrado no histórico como concluído.",
  },
  no_show: {
    label: "Não compareceu",
    title: "Registrar não comparecimento?",
    description: "O agendamento fica no histórico como Não compareceu. Essa ação não pode ser desfeita.",
  },
  cancelled: {
    label: "Cancelar agendamento",
    title: "Cancelar este agendamento?",
    description: "O horário volta a ficar livre para novos clientes. Essa ação não pode ser desfeita.",
  },
  pending: { label: "Pendente", title: "", description: "" },
};

type Mode = "view" | "edit" | "reschedule";

export function AppointmentSheet({
  appointment,
  onClose,
  barbers,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  barbers: readonly BarberRow[];
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("view");
  const [pendingStatus, setPendingStatus] = useState<AppointmentStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode("view");
    setPendingStatus(null);
  }, [appointment?.id]);

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "reschedule-slots"] }),
    queryClient.invalidateQueries({ queryKey: ["public"] }),
  ]);

  const applyStatus = async () => {
    if (!appointment || !pendingStatus) return;
    setBusy(true);
    try {
      await updateAppointmentStatus(appointment.id, pendingStatus);
      toast.success(`Agendamento ${STATUS_LABELS[pendingStatus].toLowerCase()}.`);
      await refresh();
      setPendingStatus(null);
      onClose();
    } catch (error) {
      toast.error(friendlyError(error, "Não foi possível alterar o status."));
    } finally {
      setBusy(false);
    }
  };

  const a = appointment;
  const transitions = a ? allowedTransitions(a.status) : [];
  const now = Date.now();

  return (
    <Sheet open={!!a} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-hairline bg-ink-soft p-0 sm:max-w-lg"
      >
        {a && (
          <div className="flex min-h-full flex-col">
            <div className="border-b border-hairline px-6 pb-6 pt-8">
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                <span className="eyebrow text-[0.625rem] text-stone">{a.code}</span>
              </div>
              <SheetTitle className="mt-4 font-display text-3xl font-medium text-ivory">
                {a.customer_name}
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm text-stone">
                {formatDateLong(toDateKey(a.starts_at))} · {formatTime(a.starts_at)} —{" "}
                {formatTime(a.ends_at)}
              </SheetDescription>
            </div>

            {mode === "view" && (
              <>
                <dl className="grid grid-cols-2 gap-x-6 px-6 py-2">
                  <Detail label="Telefone">
                    <a href={`tel:+55${a.customer_phone}`} className="text-ivory underline-offset-4 hover:underline">
                      {formatPhone(a.customer_phone)}
                    </a>
                  </Detail>
                  <Detail label="E-mail">{a.customer_email ?? "—"}</Detail>
                  <Detail label="Serviço">{a.service_name}</Detail>
                  <Detail label="Barbeiro">{a.barber_name}</Detail>
                  <Detail label="Duração">{formatDuration(a.service_duration_minutes)}</Detail>
                  <Detail label="Preço">{formatPrice(a.service_price_cents)}</Detail>
                  <Detail label="Observações" wide>
                    {a.notes ?? "—"}
                  </Detail>
                  <Detail label="Recebido em" wide>
                    {formatDateLong(toDateKey(a.created_at))} às {formatTime(a.created_at)}
                  </Detail>
                </dl>

                <div className="mt-auto flex flex-col gap-3 border-t border-hairline px-6 py-6">
                  {transitions.length === 0 && (
                    <p className="text-sm text-stone">Agendamento encerrado. Nenhuma ação disponível.</p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {transitions.map((status) => {
                      const needsStart = status === "completed" || status === "no_show";
                      const blocked = needsStart && new Date(a.starts_at).getTime() > now;
                      return (
                        <Button
                          key={status}
                          variant={status === "confirmed" || status === "completed" ? "bronze" : "line"}
                          size="compact"
                          disabled={blocked}
                          title={blocked ? "Disponível após o horário do atendimento" : undefined}
                          onClick={() => setPendingStatus(status)}
                        >
                          {ACTION_COPY[status].label}
                        </Button>
                      );
                    })}
                  </div>
                  {isActiveStatus(a.status) && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button variant="line" size="compact" onClick={() => setMode("reschedule")}>
                        Reagendar
                      </Button>
                      <Button variant="line" size="compact" onClick={() => setMode("edit")}>
                        Editar dados
                      </Button>
                    </div>
                  )}
                  {!isActiveStatus(a.status) && (
                    <Button variant="line" size="compact" onClick={() => setMode("edit")}>
                      Editar dados do cliente
                    </Button>
                  )}
                </div>
              </>
            )}

            {mode === "edit" && (
              <EditForm
                appointment={a}
                onCancel={() => setMode("view")}
                onSaved={async () => {
                  await refresh();
                  setMode("view");
                }}
              />
            )}

            {mode === "reschedule" && (
              <RescheduleForm
                appointment={a}
                barbers={barbers.filter((b) => b.is_active)}
                onCancel={() => setMode("view")}
                onSaved={async () => {
                  await refresh();
                  onClose();
                }}
              />
            )}
          </div>
        )}
      </SheetContent>

      {pendingStatus && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPendingStatus(null)}
          title={ACTION_COPY[pendingStatus].title}
          description={ACTION_COPY[pendingStatus].description}
          confirmLabel={ACTION_COPY[pendingStatus].label}
          onConfirm={applyStatus}
          busy={busy}
        />
      )}
    </Sheet>
  );
}

function Detail({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("border-b border-hairline py-4", wide && "col-span-2")}>
      <dt className="eyebrow text-[0.5625rem] text-stone">{label}</dt>
      <dd className="mt-1.5 break-words text-sm text-ivory">{children}</dd>
    </div>
  );
}

function EditForm({
  appointment,
  onCancel,
  onSaved,
}: {
  appointment: Appointment;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(appointment.customer_name);
  const [phone, setPhone] = useState(formatPhone(appointment.customer_phone));
  const [email, setEmail] = useState(appointment.customer_email ?? "");
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (name.trim().length < 2 || name.trim().length > 100) found["name"] = "Informe o nome completo.";
    if (!isValidPhone(phone)) found["phone"] = "Telefone inválido.";
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) found["email"] = "E-mail inválido.";
    if (notes.trim().length > 500) found["notes"] = "Máximo de 500 caracteres.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await updateAppointmentDetails(appointment.id, {
        customer_name: name.trim(),
        customer_phone: phoneDigits(phone),
        customer_email: email.trim() ? email.trim().toLowerCase() : null,
        notes: notes.trim() ? notes.trim() : null,
      });
      toast.success("Dados atualizados.");
      await onSaved();
    } catch (error) {
      toast.error(friendlyError(error, "Não foi possível salvar as alterações."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-5 px-6 py-6">
      <p className="eyebrow text-bronze">Editar dados</p>
      <FormField label="Nome" htmlFor="ed-name" error={errors["name"]}>
        <input id="ed-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Telefone" htmlFor="ed-phone" error={errors["phone"]}>
        <input id="ed-phone" type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className={inputClass} />
      </FormField>
      <FormField label="E-mail" htmlFor="ed-email" error={errors["email"]}>
        <input id="ed-email" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Observações" htmlFor="ed-notes" error={errors["notes"]} hint={`${notes.length}/500`}>
        <textarea id="ed-notes" rows={3} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} className={cn(inputClass, "h-auto py-2.5")} />
      </FormField>
      <div className="flex gap-3">
        <Button type="button" variant="line" size="compact" onClick={onCancel} disabled={busy}>
          Voltar
        </Button>
        <Button type="submit" variant="bronze" size="compact" disabled={busy}>
          {busy ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function RescheduleForm({
  appointment,
  barbers,
  onCancel,
  onSaved,
}: {
  appointment: Appointment;
  barbers: readonly BarberRow[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [barberId, setBarberId] = useState(
    barbers.some((b) => b.id === appointment.barber_id) ? appointment.barber_id : (barbers[0]?.id ?? ""),
  );
  const [date, setDate] = useState(toDateKey(appointment.starts_at));
  const [slot, setSlot] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const slots = useQuery({
    queryKey: ["admin", "reschedule-slots", appointment.id, barberId, date],
    queryFn: () => fetchRescheduleSlots(appointment, barberId, date),
    enabled: !!barberId && /^\d{4}-\d{2}-\d{2}$/.test(date),
    staleTime: 0,
  });

  const save = async () => {
    if (!slot) return;
    setBusy(true);
    try {
      await rescheduleAppointment(appointment.id, barberId, slot);
      toast.success("Agendamento reagendado.");
      setConfirming(false);
      await onSaved();
    } catch (error) {
      toast.error(friendlyError(error, "Não foi possível reagendar."));
      setConfirming(false);
      slots.refetch();
    } finally {
      setBusy(false);
    }
  };

  const barberName = barbers.find((b) => b.id === barberId)?.name ?? "";

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      <p className="eyebrow text-bronze">Reagendar</p>
      <p className="text-sm text-stone">
        Somente horários livres para {formatDuration(appointment.service_duration_minutes)} de
        atendimento são exibidos.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Barbeiro" htmlFor="rs-barber">
          <SelectField id="rs-barber" value={barberId} onChange={(v) => { setBarberId(v); setSlot(null); }}>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </SelectField>
        </FormField>
        <FormField label="Data" htmlFor="rs-date">
          <input
            id="rs-date"
            type="date"
            min={todayKey()}
            value={date}
            onChange={(e) => { setDate(e.target.value); setSlot(null); }}
            className={cn(inputClass, "[color-scheme:dark]")}
          />
        </FormField>
      </div>
      <div>
        <p className="eyebrow mb-3 text-[0.625rem] text-stone">Horários livres</p>
        {slots.isPending ? (
          <div className="h-24 animate-pulse bg-graphite/60" />
        ) : slots.isError ? (
          <p className="text-sm text-bronze-light">{friendlyError(slots.error, "Não foi possível carregar os horários.")}</p>
        ) : slots.data.length === 0 ? (
          <p className="text-sm text-stone">Nenhum horário livre nesta data para este barbeiro.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.data.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                aria-pressed={slot === s}
                className={cn(
                  "h-10 border text-sm tabular-nums transition-colors",
                  slot === s ? "border-bronze bg-bronze font-semibold text-ink" : "border-hairline text-ivory hover:border-bronze/60",
                )}
              >
                {formatTime(s)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="line" size="compact" onClick={onCancel} disabled={busy}>
          Voltar
        </Button>
        <Button type="button" variant="bronze" size="compact" disabled={!slot || busy} onClick={() => setConfirming(true)}>
          Reagendar
        </Button>
      </div>
      {slot && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title="Confirmar reagendamento?"
          description={`Novo horário: ${formatDateLong(date)}, às ${formatTime(slot)}, com ${barberName}. A disponibilidade é verificada novamente ao salvar.`}
          confirmLabel="Reagendar"
          onConfirm={save}
          busy={busy}
        />
      )}
    </div>
  );
}
