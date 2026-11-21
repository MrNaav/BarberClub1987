import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { BlocksManager } from "@/components/admin/BlocksManager";
import {
  ConfirmDialog,
  ErrorState,
  FormField,
  inputClass,
  LoadingRows,
  PageHeader,
  Panel,
} from "@/components/admin/ui";
import { toTime, validateDayHours, WeeklyHoursEditor, type DayHours } from "@/components/admin/WeeklyHoursEditor";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  barberHoursQuery,
  barberServicesQuery,
  barbersQuery,
  saveBarberHours,
  servicesQuery,
  saveBarberProfile,
  type BarberHoursRow,
  type BarberRow,
  type ServiceRow,
} from "@/lib/admin/api";
import { friendlyError } from "@/lib/booking/core";
import { BARBER_PHOTOS, FALLBACK_BARBER_PHOTO } from "@/lib/booking/images";
import { cn } from "@/lib/utils";
import { adminHead } from "@/lib/admin/metadata";

export const Route = createFileRoute("/_authenticated/admin/barbeiros")({
  head: () => adminHead("Equipe", "Perfis e disponibilidade dos barbeiros da Barber Club 1987."),
  component: BarbersPage,
});

function BarbersPage() {
  const barbers = useQuery(barbersQuery);
  const services = useQuery(servicesQuery);
  const links = useQuery(barberServicesQuery);
  const hours = useQuery(barberHoursQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loading = barbers.isPending || services.isPending || links.isPending || hours.isPending;
  const failed = barbers.error ?? services.error ?? links.error ?? hours.error;
  const current = barbers.data?.find((b) => b.id === selectedId) ?? barbers.data?.[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Barbeiros"
        title="Equipe"
        description="Perfis, serviços, horários de trabalho, folgas e bloqueios de cada barbeiro."
      />
      {loading ? (
        <LoadingRows rows={5} />
      ) : failed ? (
        <ErrorState message={friendlyError(failed, "Não foi possível carregar a equipe.")} onRetry={() => { barbers.refetch(); services.refetch(); links.refetch(); hours.refetch(); }} />
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Barbeiros">
            {(barbers.data ?? []).map((b) => (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={current?.id === b.id}
                onClick={() => setSelectedId(b.id)}
                className={cn(
                  "flex items-center gap-4 border p-3 text-left transition-colors",
                  current?.id === b.id ? "border-bronze bg-ink-soft" : "border-hairline hover:border-ivory/25",
                )}
              >
                <img src={BARBER_PHOTOS[b.slug] ?? FALLBACK_BARBER_PHOTO} alt="" className="h-14 w-11 object-cover object-[center_15%]" />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ivory">{b.name}</span>
                  <span className="eyebrow text-[0.5625rem] text-stone">{b.is_active ? b.role : "Inativo"}</span>
                </span>
              </button>
            ))}
          </div>
          {current && (
            <BarberDetail
              key={`${current.id}-${current.updated_at}`}
              barber={current}
              services={services.data ?? []}
              serviceIds={(links.data ?? []).filter((l) => l.barber_id === current.id).map((l) => l.service_id)}
              hours={(hours.data ?? []).filter((h) => h.barber_id === current.id)}
            />
          )}
        </>
      )}
    </div>
  );
}

function BarberDetail({
  barber,
  services,
  serviceIds,
  hours,
}: {
  barber: BarberRow;
  services: ServiceRow[];
  serviceIds: string[];
  hours: BarberHoursRow[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(barber.name);
  const [role, setRole] = useState(barber.role);
  const [specialty, setSpecialty] = useState(barber.specialty);
  const [bio, setBio] = useState(barber.bio);
  const [active, setActive] = useState(barber.is_active);
  const [selectedServices, setSelectedServices] = useState(serviceIds);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const [days, setDays] = useState<DayHours[]>(() =>
    [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
      const row = hours.find((h) => h.weekday === weekday);
      return {
        weekday,
        enabled: row?.is_working ?? false,
        start: toTime(row?.start_time) || "10:00",
        end: toTime(row?.end_time) || "20:00",
        breakStart: toTime(row?.break_start),
        breakEnd: toTime(row?.break_end),
      };
    }),
  );
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [savingHours, setSavingHours] = useState(false);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: ["public"] }),
    ]);

  const saveProfile = async () => {
    const found: Record<string, string> = {};
    if (!name.trim() || name.trim().length > 80) found["name"] = "Nome entre 1 e 80 caracteres.";
    if (!role.trim() || role.trim().length > 60) found["role"] = "Cargo entre 1 e 60 caracteres.";
    if (specialty.length > 80) found["specialty"] = "Máximo de 80 caracteres.";
    if (bio.length > 400) found["bio"] = "Máximo de 400 caracteres.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await saveBarberProfile(barber.id, {
        name: name.trim(),
        role: role.trim(),
        specialty: specialty.trim(),
        bio: bio.trim(),
        is_active: active,
      }, selectedServices);
      toast.success("Perfil atualizado.");
      await refresh();
    } catch (error) {
      toast.error(friendlyError(error, "Não foi possível salvar o perfil."));
    } finally {
      setBusy(false);
    }
  };

  const saveHours = async () => {
    const problem = validateDayHours(days);
    setHoursError(problem);
    if (problem) return;
    setSavingHours(true);
    try {
      await saveBarberHours(
        days.map((d) => ({
          barber_id: barber.id,
          weekday: d.weekday,
          is_working: d.enabled,
          start_time: d.start,
          end_time: d.end,
          break_start: d.enabled && d.breakStart ? d.breakStart : null,
          break_end: d.enabled && d.breakEnd ? d.breakEnd : null,
        })),
      );
      toast.success("Horários salvos.");
      await refresh();
    } catch (error) {
      toast.error(friendlyError(error, "Não foi possível salvar os horários."));
    } finally {
      setSavingHours(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Perfil"
        description="Nome, cargo, especialidade e descrição aparecem no site e no agendamento."
        actions={
          <label className="flex items-center gap-3 text-sm text-stone">
            {active ? "Ativo" : "Inativo"}
            <Switch
              checked={active}
              onCheckedChange={(c) => (c ? setActive(true) : setConfirmDeactivate(true))}
              aria-label={`${barber.name} ativo`}
            />
          </label>
        }
      >
        <div className="grid gap-5 md:grid-cols-3">
          <FormField label="Nome" htmlFor="bb-name" error={errors["name"]}>
            <input id="bb-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Cargo" htmlFor="bb-role" error={errors["role"]}>
            <input id="bb-role" value={role} maxLength={60} onChange={(e) => setRole(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Especialidade" htmlFor="bb-spec" error={errors["specialty"]}>
            <input id="bb-spec" value={specialty} maxLength={80} onChange={(e) => setSpecialty(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Descrição" htmlFor="bb-bio" error={errors["bio"]} hint={`${bio.length}/400`} className="md:col-span-3">
            <textarea id="bb-bio" rows={3} maxLength={400} value={bio} onChange={(e) => setBio(e.target.value)} className={cn(inputClass, "h-auto py-2.5")} />
          </FormField>
          <fieldset className="md:col-span-3">
            <legend className="eyebrow mb-3 text-[0.625rem] text-stone">Serviços que realiza</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2.5 text-sm text-ivory/90">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(s.id)}
                    onChange={(e) =>
                      setSelectedServices((cur) => (e.target.checked ? [...cur, s.id] : cur.filter((id) => id !== s.id)))
                    }
                    className="h-4 w-4 accent-[var(--bronze)]"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="bronze" size="compact" onClick={saveProfile} disabled={busy}>
            {busy ? "Salvando…" : "Salvar perfil"}
          </Button>
        </div>
      </Panel>

      <Panel
        title="Disponibilidade semanal"
        description="Dias e horários de trabalho. A agenda também respeita o horário de funcionamento da barbearia."
      >
        <WeeklyHoursEditor days={days} onChange={setDays} enabledLabel="Trabalha" />
        {hoursError && (
          <p role="alert" className="mt-4 text-sm text-bronze-light">
            {hoursError}
          </p>
        )}
        <div className="mt-6 flex justify-end">
          <Button variant="bronze" size="compact" onClick={saveHours} disabled={savingHours}>
            {savingHours ? "Salvando…" : "Salvar horários"}
          </Button>
        </div>
      </Panel>

      <Panel title="Folgas e bloqueios" description={`Períodos em que ${barber.name.split(" ")[0]} não atende.`}>
        <BlocksManager barberId={barber.id} />
      </Panel>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Desativar este barbeiro?"
        description="Depois de salvar, ele sai do site e não recebe novos agendamentos. O histórico continua com o nome dele."
        confirmLabel="Desativar"
        onConfirm={() => {
          setActive(false);
          setConfirmDeactivate(false);
        }}
      />
    </div>
  );
}
