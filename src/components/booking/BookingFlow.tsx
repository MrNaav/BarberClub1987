import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { createBooking, type BookingResult } from "@/lib/booking/booking.functions";
import {
  addDaysToKey,
  formatDateLong,
  formatDuration,
  formatPhone,
  formatPrice,
  formatTime,
  friendlyError,
  isValidPhone,
  periodOf,
  todayKey,
  toDateKey,
} from "@/lib/booking/core";
import { BARBER_PHOTOS, FALLBACK_BARBER_PHOTO } from "@/lib/booking/images";
import { availableDatesQuery, availableSlotsQuery, catalogQuery } from "@/lib/booking/queries";
import { cn } from "@/lib/utils";

import { BookingCalendar } from "./BookingCalendar";

const STEPS = ["Serviço", "Barbeiro", "Data", "Horário", "Seus dados", "Revisão"] as const;
const ANY = "any";

type Customer = { name: string; phone: string; email: string; notes: string };
type CustomerErrors = Partial<Record<keyof Customer, string>>;
type Confirmed = Extract<BookingResult, { ok: true }>["booking"];

function validateCustomer(c: Customer): CustomerErrors {
  const errors: CustomerErrors = {};
  const name = c.name.trim();
  if (name.length < 2) errors.name = "Informe seu nome completo.";
  else if (name.length > 100) errors.name = "Use no máximo 100 caracteres.";
  if (!isValidPhone(c.phone)) errors.phone = "Informe um telefone válido com DDD.";
  const email = c.email.trim();
  if (email && (email.length > 255 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)))
    errors.email = "Informe um e-mail válido ou deixe em branco.";
  if (c.notes.trim().length > 500) errors.notes = "Use no máximo 500 caracteres.";
  return errors;
}

export function BookingFlow() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const queryClient = useQueryClient();
  const submitBooking = useServerFn(createBooking);
  const topRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberChoice, setBarberChoice] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "", notes: "" });
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; slotTaken: boolean } | null>(
    null,
  );
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);

  const service = catalog.services.find((s) => s.id === serviceId) ?? null;
  const barbersForService = useMemo(
    () => catalog.barbers.filter((b) => serviceId && b.service_ids.includes(serviceId)),
    [catalog.barbers, serviceId],
  );
  const barber = catalog.barbers.find((b) => b.id === barberChoice) ?? null;
  const barberId = barberChoice === ANY ? null : barberChoice;

  const datesQuery = useQuery({
    ...availableDatesQuery(serviceId ?? "", barberId),
    enabled: step >= 2 && !!serviceId && !!barberChoice,
  });
  const slotsQuery = useQuery({
    ...availableSlotsQuery(serviceId ?? "", barberId, date ?? ""),
    enabled: step >= 3 && !!serviceId && !!barberChoice && !!date,
  });

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, confirmed]);

  const chooseService = (id: string) => {
    if (id === serviceId) return;
    setServiceId(id);
    const stillValid =
      barberChoice === ANY ||
      catalog.barbers.some((b) => b.id === barberChoice && b.service_ids.includes(id));
    if (!stillValid) setBarberChoice(null);
    setDate(null);
    setSlot(null);
  };
  const chooseBarber = (id: string) => {
    if (id === barberChoice) return;
    setBarberChoice(id);
    setDate(null);
    setSlot(null);
  };
  const chooseDate = (key: string) => {
    if (key === date) return;
    setDate(key);
    setSlot(null);
  };

  const canContinue = [
    !!service,
    !!barberChoice,
    !!date,
    !!slot,
    true,
    true,
  ][step];

  const goNext = () => {
    if (step === 4) {
      const found = validateCustomer(customer);
      setErrors(found);
      if (Object.keys(found).length > 0) return;
    }
    setSubmitError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const confirm = async () => {
    if (!service || !slot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitBooking({
        data: {
          serviceId: service.id,
          barberId,
          startsAt: slot,
          name: customer.name.trim(),
          phone: customer.phone,
          email: customer.email.trim(),
          notes: customer.notes.trim(),
        },
      });
      if (result.ok) {
        setConfirmed(result.booking);
        queryClient.invalidateQueries({ queryKey: ["public", "slots"] });
        queryClient.invalidateQueries({ queryKey: ["public", "dates"] });
        return;
      }
      const slotTaken = result.code === "SLOT_UNAVAILABLE";
      if (slotTaken) {
        queryClient.invalidateQueries({ queryKey: ["public", "slots"] });
        queryClient.invalidateQueries({ queryKey: ["public", "dates"] });
      }
      setSubmitError({
        message: friendlyError(
          result.code,
          "Não foi possível concluir o agendamento. Seus dados foram mantidos; tente novamente.",
        ),
        slotTaken,
      });
    } catch {
      setSubmitError({
        message:
          "Não foi possível concluir o agendamento. Verifique sua conexão; seus dados foram mantidos.",
        slotTaken: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setConfirmed(null);
    setStep(0);
    setServiceId(null);
    setBarberChoice(null);
    setDate(null);
    setSlot(null);
    setCustomer({ name: "", phone: "", email: "", notes: "" });
    setSubmitError(null);
  };

  if (!catalog.ok || catalog.services.length === 0) {
    return (
      <div ref={topRef} className="border border-hairline bg-ink-soft p-8 sm:p-12">
        <h2 className="font-display text-3xl text-ivory">Agendamento indisponível no momento</h2>
        <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-stone">
          {catalog.ok
            ? "Nenhum serviço está aberto para agendamento agora."
            : "Não conseguimos carregar os serviços. Atualize a página em instantes."}
        </p>
        <Button asChild variant="line" size="cta" className="mt-8">
          <a href="/">Voltar ao site</a>
        </Button>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div ref={topRef} className="scroll-mt-24">
        <Confirmation booking={confirmed} customer={customer} onRestart={restart} />
      </div>
    );
  }

  const today = todayKey();

  return (
    <div ref={topRef} className="scroll-mt-24">
      <StepIndicator step={step} />

      <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-8">
          {step === 0 && (
            <StepShell title="Escolha o serviço">
              <div role="radiogroup" aria-label="Serviços" className="flex flex-col">
                {catalog.services.map((s) => (
                  <OptionRow
                    key={s.id}
                    selected={s.id === serviceId}
                    onSelect={() => chooseService(s.id)}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      <div className="min-w-0">
                        <p className="font-display text-[1.625rem] font-medium leading-tight text-ivory sm:text-[1.875rem]">
                          {s.name}
                        </p>
                        <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-stone">
                          {s.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-baseline gap-5 sm:flex-col sm:items-end sm:gap-1.5">
                        <span className="font-display text-[1.75rem] leading-none text-ivory">
                          {formatPrice(s.price_cents)}
                        </span>
                        <span className="eyebrow text-stone">{formatDuration(s.duration_minutes)}</span>
                      </div>
                    </div>
                  </OptionRow>
                ))}
              </div>
              {catalog.services.some((s) => s.price_is_demo) && (
                <p className="eyebrow mt-6 text-stone/80">Valores demonstrativos</p>
              )}
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="Escolha o barbeiro">
              <div role="radiogroup" aria-label="Barbeiros" className="flex flex-col">
                <OptionRow selected={barberChoice === ANY} onSelect={() => chooseBarber(ANY)}>
                  <div className="flex items-center gap-5 sm:gap-6">
                    <span
                      aria-hidden
                      className="eyebrow flex h-24 w-[4.5rem] shrink-0 items-center justify-center border border-hairline text-[0.625rem] text-bronze-light"
                    >
                      Equipe
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-[1.625rem] font-medium leading-tight text-ivory">
                        Qualquer barbeiro disponível
                      </p>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">
                        Mostramos todos os horários livres da equipe e reservamos com quem estiver
                        disponível.
                      </p>
                    </div>
                  </div>
                </OptionRow>
                {barbersForService.map((b) => (
                  <OptionRow key={b.id} selected={b.id === barberChoice} onSelect={() => chooseBarber(b.id)}>
                    <div className="flex items-start gap-5 sm:gap-6">
                      <img
                        src={BARBER_PHOTOS[b.slug] ?? FALLBACK_BARBER_PHOTO}
                        alt=""
                        width={144}
                        height={192}
                        loading="lazy"
                        className="h-24 w-[4.5rem] shrink-0 object-cover object-[center_15%]"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                          <p className="font-display text-[1.625rem] font-medium leading-tight text-ivory">
                            {b.name}
                          </p>
                          <span className="eyebrow text-bronze">{b.role}</span>
                        </div>
                        <p className="mt-1.5 text-[0.8125rem] text-ivory/85">{b.specialty}</p>
                        <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">{b.bio}</p>
                      </div>
                    </div>
                  </OptionRow>
                ))}
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Escolha a data">
              {datesQuery.isPending ? (
                <LoadingBlock label="Calculando datas disponíveis" />
              ) : datesQuery.isError || !datesQuery.data.ok ? (
                <Notice
                  message="Não foi possível calcular as datas disponíveis agora."
                  action={<Button variant="line" size="compact" onClick={() => datesQuery.refetch()}>Tentar novamente</Button>}
                />
              ) : datesQuery.data.dates.length === 0 ? (
                <Notice
                  message="Não há datas disponíveis para essa combinação nos próximos dias."
                  action={<Button variant="line" size="compact" onClick={() => setStep(1)}>Escolher outro barbeiro</Button>}
                />
              ) : (
                <div className="max-w-md">
                  <BookingCalendar
                    availableDates={datesQuery.data.dates}
                    selected={date}
                    onSelect={chooseDate}
                    fromKey={today}
                    toKey={addDaysToKey(today, catalog.maxDaysAhead)}
                  />
                  <p className="mt-6 border-t border-hairline pt-5 text-[0.9375rem] text-stone" aria-live="polite">
                    {date ? (
                      <>
                        Data selecionada: <span className="text-ivory">{formatDateLong(date)}</span>
                      </>
                    ) : (
                      "Datas riscadas não têm horários livres."
                    )}
                  </p>
                </div>
              )}
            </StepShell>
          )}

          {step === 3 && date && (
            <StepShell title="Escolha o horário" subtitle={formatDateLong(date)}>
              {slotsQuery.isPending ? (
                <LoadingBlock label="Buscando horários livres" />
              ) : slotsQuery.isError || !slotsQuery.data.ok ? (
                <Notice
                  message="Não foi possível carregar os horários agora."
                  action={<Button variant="line" size="compact" onClick={() => slotsQuery.refetch()}>Tentar novamente</Button>}
                />
              ) : slotsQuery.data.slots.length === 0 ? (
                <Notice
                  message="Não há mais horários livres nesta data."
                  action={
                    <div className="flex flex-wrap gap-3">
                      <Button variant="line" size="compact" onClick={() => setStep(2)}>Escolher outra data</Button>
                      <Button variant="line" size="compact" onClick={() => setStep(1)}>Escolher outro barbeiro</Button>
                    </div>
                  }
                />
              ) : (
                <SlotPicker
                  slots={slotsQuery.data.slots.map((s) => s.startsAt)}
                  selected={slot}
                  onSelect={setSlot}
                />
              )}
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="Seus dados" subtitle="Usamos apenas para confirmar o seu horário.">
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  goNext();
                }}
                className="grid max-w-xl gap-6"
              >
                <Field label="Nome completo" error={errors.name} htmlFor="bk-name">
                  <input
                    id="bk-name"
                    autoComplete="name"
                    maxLength={100}
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    aria-invalid={!!errors.name}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Telefone (WhatsApp)" error={errors.phone} htmlFor="bk-phone">
                  <input
                    id="bk-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="(11) 91234-5678"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: formatPhone(e.target.value) })}
                    aria-invalid={!!errors.phone}
                    className={fieldClass}
                  />
                </Field>
                <Field label="E-mail" optional error={errors.email} htmlFor="bk-email">
                  <input
                    id="bk-email"
                    type="email"
                    autoComplete="email"
                    maxLength={255}
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    aria-invalid={!!errors.email}
                    className={fieldClass}
                  />
                </Field>
                <Field
                  label="Observações"
                  optional
                  error={errors.notes}
                  htmlFor="bk-notes"
                  hint={`${customer.notes.length}/500`}
                >
                  <textarea
                    id="bk-notes"
                    rows={3}
                    maxLength={500}
                    value={customer.notes}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                    aria-invalid={!!errors.notes}
                    className={cn(fieldClass, "h-auto resize-none py-3")}
                  />
                </Field>
                <button type="submit" className="sr-only">
                  Continuar
                </button>
              </form>
            </StepShell>
          )}

          {step === 5 && service && slot && (
            <StepShell title="Revise seu agendamento">
              <dl className="grid border-t border-hairline sm:grid-cols-2">
                <ReviewItem label="Serviço" value={service.name} />
                <ReviewItem label="Preço" value={formatPrice(service.price_cents)} />
                <ReviewItem label="Duração" value={formatDuration(service.duration_minutes)} />
                <ReviewItem
                  label="Barbeiro"
                  value={barber ? barber.name : "Qualquer barbeiro disponível"}
                />
                <ReviewItem label="Data" value={formatDateLong(toDateKey(slot))} />
                <ReviewItem label="Horário" value={formatTime(slot)} />
                <ReviewItem label="Nome" value={customer.name.trim()} />
                <ReviewItem label="Telefone" value={customer.phone} />
              </dl>
              {service.price_is_demo && (
                <p className="eyebrow mt-5 text-stone/80">Valor demonstrativo</p>
              )}

              {submitError && (
                <div role="alert" className="mt-8 border border-bronze/60 bg-ink-soft p-5">
                  <p className="text-[0.9375rem] text-ivory">{submitError.message}</p>
                  {submitError.slotTaken && (
                    <Button
                      variant="line-bronze"
                      size="compact"
                      className="mt-4"
                      onClick={() => {
                        setSlot(null);
                        setSubmitError(null);
                        setStep(3);
                      }}
                    >
                      Escolher outro horário
                    </Button>
                  )}
                </div>
              )}

              <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="line" size="cta" onClick={goBack} disabled={submitting}>
                  Voltar e alterar
                </Button>
                <Button variant="bronze" size="cta" onClick={confirm} disabled={submitting}>
                  {submitting ? "Confirmando…" : "Confirmar agendamento"}
                </Button>
              </div>
            </StepShell>
          )}

          {step < 5 && (
            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? (
                <Button variant="line" size="cta" onClick={goBack}>
                  Voltar
                </Button>
              ) : (
                <Button asChild variant="line" size="cta">
                  <a href="/">Voltar ao site</a>
                </Button>
              )}
              <Button variant="bronze" size="cta" onClick={goNext} disabled={!canContinue}>
                Continuar
              </Button>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="border border-hairline bg-ink-soft p-6 lg:sticky lg:top-8 lg:p-8">
            <p className="eyebrow text-bronze">Seu agendamento</p>
            <dl className="mt-5 flex flex-col text-sm">
              <SummaryRow label="Serviço" value={service?.name} />
              <SummaryRow
                label="Barbeiro"
                value={barberChoice === ANY ? "Qualquer disponível" : barber?.name}
              />
              <SummaryRow label="Data" value={date ? formatDateLong(date) : undefined} />
              <SummaryRow label="Horário" value={slot ? formatTime(slot) : undefined} />
              <SummaryRow
                label="Duração"
                value={service ? formatDuration(service.duration_minutes) : undefined}
              />
            </dl>
            {service && (
              <div className="mt-6 flex items-baseline justify-between">
                <span className="eyebrow text-stone">Valor</span>
                <span className="font-display text-3xl leading-none text-ivory">
                  {formatPrice(service.price_cents)}
                </span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const fieldClass =
  "h-12 w-full rounded-none border border-hairline bg-ink-soft px-4 text-[0.9375rem] text-ivory placeholder:text-stone/50 transition-colors focus:border-bronze focus:outline-none aria-[invalid=true]:border-bronze-light";

function StepIndicator({ step }: { step: number }) {
  return (
    <nav aria-label="Etapas do agendamento">
      <p className="eyebrow text-stone sm:hidden">
        Etapa {step + 1} de {STEPS.length} · <span className="text-ivory">{STEPS[step]}</span>
      </p>
      <div className="mt-4 h-px w-full bg-hairline sm:hidden">
        <div
          className="h-px bg-bronze transition-[width] duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <ol className="hidden gap-2 sm:grid sm:grid-cols-6">
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={cn(
              "border-t pt-4 transition-colors",
              index <= step ? "border-bronze" : "border-hairline",
            )}
          >
            <span className={cn("eyebrow", index === step ? "text-bronze-light" : "text-stone/70")}>
              0{index + 1}
            </span>
            <span
              className={cn(
                "mt-1.5 block text-[0.8125rem]",
                index === step ? "text-ivory" : index < step ? "text-ivory/70" : "text-stone/70",
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby="step-title">
      <h2
        id="step-title"
        className="font-display text-[2.25rem] font-medium leading-tight text-ivory sm:text-[2.75rem]"
      >
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-[0.9375rem] text-stone">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function OptionRow({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group relative -mt-px w-full border p-5 text-left transition-colors sm:p-6",
        "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bronze",
        selected
          ? "z-[1] border-bronze bg-ink-soft"
          : "border-hairline hover:border-ivory/25 hover:bg-ink-soft/60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 h-full w-px origin-top bg-bronze transition-transform duration-500",
          selected ? "scale-y-100" : "scale-y-0",
        )}
      />
      {children}
    </button>
  );
}

function SlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  const groups = new Map<string, string[]>();
  for (const s of slots) {
    const period = periodOf(formatTime(s));
    groups.set(period, [...(groups.get(period) ?? []), s]);
  }
  return (
    <div className="flex flex-col gap-8">
      {[...groups.entries()].map(([period, items]) => (
        <div key={period}>
          <p className="eyebrow text-stone">{period}</p>
          <div role="radiogroup" aria-label={period} className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
            {items.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={selected === s}
                onClick={() => onSelect(s)}
                className={cn(
                  "h-12 border text-[0.9375rem] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bronze",
                  selected === s
                    ? "border-bronze bg-bronze font-semibold text-ink"
                    : "border-hairline bg-ink-soft text-ivory hover:border-bronze/60",
                )}
              >
                {formatTime(s)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="eyebrow text-ivory/85">
          {label}
          {optional && <span className="ml-2 normal-case tracking-normal text-stone">(opcional)</span>}
        </label>
        {hint && <span className="text-xs tabular-nums text-stone/70">{hint}</span>}
      </div>
      {children}
      {error && (
        <p role="alert" className="mt-2 text-[0.8125rem] text-bronze-light">
          {error}
        </p>
      )}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-hairline py-4 sm:odd:pr-6 sm:even:pl-6">
      <dt className="eyebrow text-stone">{label}</dt>
      <dd className="mt-1.5 break-words text-[1.0625rem] text-ivory">{value}</dd>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-3">
      <dt className="text-stone">{label}</dt>
      <dd className={cn("text-right", value ? "text-ivory" : "text-stone/50")}>{value ?? "—"}</dd>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col gap-3">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse bg-graphite/70" />
      ))}
    </div>
  );
}

function Notice({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="border border-hairline bg-ink-soft p-6">
      <p className="text-[0.9375rem] text-ivory">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Confirmation({
  booking,
  customer,
  onRestart,
}: {
  booking: Confirmed;
  customer: Customer;
  onRestart: () => void;
}) {
  return (
    <section aria-labelledby="done-title" className="mx-auto max-w-2xl">
      <p className="eyebrow flex items-center gap-4 text-bronze">
        <span aria-hidden className="h-px w-10 bg-bronze" />
        Agendamento recebido
      </p>
      <h2
        id="done-title"
        className="display mt-6 text-[2.75rem] text-ivory sm:text-[3.75rem]"
      >
        Até <em className="font-normal italic text-bronze-light">breve</em>.
      </h2>
      <p className="mt-6 text-[0.9875rem] leading-relaxed text-stone">
        Recebemos seu agendamento. Ele está pendente de confirmação pela barbearia, que entrará em
        contato pelo telefone informado se precisar.
      </p>

      <div className="mt-10 border border-hairline bg-ink-soft p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hairline pb-5">
          <span className="eyebrow text-stone">Código do agendamento</span>
          <span className="font-display text-3xl tracking-[0.08em] text-bronze-light">{booking.code}</span>
        </div>
        <dl className="grid sm:grid-cols-2">
          <ReviewItem label="Serviço" value={booking.serviceName} />
          <ReviewItem label="Barbeiro" value={booking.barberName} />
          <ReviewItem label="Data" value={formatDateLong(toDateKey(booking.startsAt))} />
          <ReviewItem
            label="Horário"
            value={`${formatTime(booking.startsAt)} — ${formatTime(booking.endsAt)}`}
          />
          <ReviewItem label="Valor" value={formatPrice(booking.priceCents)} />
          <ReviewItem label="Nome" value={customer.name.trim()} />
        </dl>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="bronze" size="cta">
          <a href="/">Voltar ao site</a>
        </Button>
        <Button variant="line" size="cta" onClick={onRestart}>
          Fazer outro agendamento
        </Button>
      </div>
    </section>
  );
}
