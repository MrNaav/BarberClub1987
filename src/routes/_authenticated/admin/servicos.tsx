import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog, ErrorState, FormField, inputClass, LoadingRows, PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { servicesQuery, updateService, type ServiceRow } from "@/lib/admin/api";
import { formatDuration, formatPrice, friendlyError, parsePriceToCents } from "@/lib/booking/core";
import { cn } from "@/lib/utils";
import { adminHead } from "@/lib/admin/metadata";

export const Route = createFileRoute("/_authenticated/admin/servicos")({
  head: () => adminHead("Serviços e preços", "Gestão do catálogo de serviços da Barber Club 1987."),
  component: ServicesPage,
});

function ServicesPage() {
  const services = useQuery(servicesQuery);
  const hasDemo = (services.data ?? []).some((s) => s.price_is_demo);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Serviços"
        title="Serviços e preços"
        description="As alterações aparecem no site e no agendamento. Serviços inativos saem do site e não aceitam novas reservas."
      />
      {hasDemo && (
        <div role="note" className="border border-bronze/60 bg-ink-soft px-5 py-4">
          <p className="eyebrow text-[0.625rem] text-bronze-light">Preços demonstrativos</p>
          <p className="mt-2 text-sm leading-relaxed text-ivory/90">
            Os preços iniciais são demonstrativos e precisam ser revisados antes da publicação comercial. Ao salvar um
            valor real, desmarque "Preço demonstrativo" para remover o aviso do site.
          </p>
        </div>
      )}
      {services.isPending ? (
        <LoadingRows rows={4} />
      ) : services.isError ? (
        <ErrorState message={friendlyError(services.error, "Não foi possível carregar os serviços.")} onRetry={() => services.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          {services.data.map((s) => (
            <ServiceEditor key={`${s.id}-${s.updated_at}`} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceEditor({ service }: { service: ServiceRow }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description);
  const [price, setPrice] = useState(formatPrice(service.price_cents).replace("R$ ", ""));
  const [duration, setDuration] = useState(String(service.duration_minutes));
  const [active, setActive] = useState(service.is_active);
  const [demo, setDemo] = useState(service.price_is_demo);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const cents = parsePriceToCents(price);
  const minutes = Number(duration);
  const dirty =
    name !== service.name ||
    description !== service.description ||
    cents !== service.price_cents ||
    minutes !== service.duration_minutes ||
    active !== service.is_active ||
    demo !== service.price_is_demo;

  const save = async () => {
    const found: Record<string, string> = {};
    if (!name.trim() || name.trim().length > 80) found["name"] = "Nome entre 1 e 80 caracteres.";
    if (description.length > 400) found["description"] = "Máximo de 400 caracteres.";
    if (cents === null || cents > 10_000_000) found["price"] = "Valor inválido. Ex.: 75 ou 75,50.";
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) found["duration"] = "Entre 5 e 480 minutos.";
    setErrors(found);
    if (Object.keys(found).length || cents === null) return;
    setBusy(true);
    try {
      await updateService(service.id, {
        name: name.trim(),
        description: description.trim(),
        price_cents: cents,
        duration_minutes: minutes,
        is_active: active,
        price_is_demo: demo,
      });
      toast.success(`${name.trim()} atualizado.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "services"] }),
        queryClient.invalidateQueries({ queryKey: ["public"] }),
      ]);
    } catch (error) {
      toast.error(friendlyError(error, "Não foi possível salvar o serviço."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cn("border bg-ink-soft", active ? "border-hairline" : "border-dashed border-hairline")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="truncate font-display text-2xl text-ivory">{service.name}</h2>
          <span className="text-sm tabular-nums text-stone">
            {formatPrice(service.price_cents)} · {formatDuration(service.duration_minutes)}
          </span>
        </div>
        <label className="flex items-center gap-3 text-sm text-stone">
          {active ? "Ativo" : "Inativo"}
          <Switch
            checked={active}
            onCheckedChange={(checked) => (checked ? setActive(true) : setConfirmDeactivate(true))}
            aria-label={`Serviço ${service.name} ativo`}
          />
        </label>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-6">
        <FormField label="Nome" htmlFor={`sv-name-${service.id}`} error={errors["name"]} className="md:col-span-2">
          <input id={`sv-name-${service.id}`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Preço (R$)" htmlFor={`sv-price-${service.id}`} error={errors["price"]} className="md:col-span-2">
          <input
            id={`sv-price-${service.id}`}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Duração (min)" htmlFor={`sv-dur-${service.id}`} error={errors["duration"]} className="md:col-span-2">
          <input
            id={`sv-dur-${service.id}`}
            type="number"
            min={5}
            max={480}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField
          label="Descrição"
          htmlFor={`sv-desc-${service.id}`}
          error={errors["description"]}
          hint={`${description.length}/400`}
          className="md:col-span-6"
        >
          <textarea
            id={`sv-desc-${service.id}`}
            rows={2}
            maxLength={400}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(inputClass, "h-auto py-2.5")}
          />
        </FormField>
        <div className="flex flex-col gap-4 md:col-span-6 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-2.5 text-sm text-stone">
            <input
              type="checkbox"
              checked={demo}
              onChange={(e) => setDemo(e.target.checked)}
              className="h-4 w-4 accent-[var(--bronze)]"
            />
            Preço demonstrativo (mostra o aviso no site)
          </label>
          <Button variant="bronze" size="compact" disabled={!dirty || busy} onClick={save}>
            {busy ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Desativar este serviço?"
        description="Depois de salvar, ele sai do site e não aceita novos agendamentos. Reservas já feitas continuam no histórico."
        confirmLabel="Desativar"
        onConfirm={() => {
          setActive(false);
          setConfirmDeactivate(false);
        }}
      />
    </section>
  );
}
