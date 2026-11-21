/*
 * Pure booking helpers shared by the public booking flow, the landing page and the admin panel.
 * No network or browser APIs here, so everything is unit-testable.
 */

/** The shop works in São Paulo time. Brazil has had no daylight saving time since 2019. */
export const SHOP_TIME_ZONE = "America/Sao_Paulo";
export const SHOP_UTC_OFFSET = "-03:00";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export const STATUS_ORDER: readonly AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

/** Allowed status changes. The database enforces the same rules. */
const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "no_show", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function allowedTransitions(status: AppointmentStatus): readonly AppointmentStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Only pending and confirmed appointments hold a place in the schedule. */
export function isActiveStatus(status: AppointmentStatus): boolean {
  return status === "pending" || status === "confirmed";
}

/** "R$ 75" for whole reais, "R$ 75,50" when there are cents. */
export function formatPrice(cents: number): string {
  const reais = cents / 100;
  const hasCents = cents % 100 !== 0;
  return `R$ ${reais.toLocaleString("pt-BR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Parses "75", "75,50" or "75.5" into cents. Returns null when invalid. */
export function parsePriceToCents(input: string): number | null {
  const value = input.trim().replace(/^R\$\s*/i, "");
  const normalized = value.includes(",")
    ? (/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(value) ? value.replace(/\./g, "").replace(",", ".") : "")
    : (/^\d{1,3}(?:\.\d{3})+$/.test(value) ? value.replace(/\./g, "") : value);
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}`;
}

/** Keeps only digits. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formats a Brazilian phone as the user types: (11) 91234-5678 / (11) 1234-5678. */
export function formatPhone(value: string): string {
  const d = phoneDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const area = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${area}) ${rest}`;
  const split = rest.length === 9 ? 5 : 4;
  return `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Brazilian phone with area code: 10 (landline) or 11 (mobile) digits. */
export function isValidPhone(value: string): boolean {
  const d = phoneDigits(value);
  return d.length === 10 || d.length === 11;
}

// ---------- Dates and times (always in shop time) ----------

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHOP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SHOP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "2026-11-24" for an instant, in shop time. */
export function toDateKey(value: Date | string): string {
  return dateKeyFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

/** "14:30" for an instant, in shop time. */
export function formatTime(value: Date | string): string {
  return timeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** ISO instant for a shop-local date ("2026-11-24") and time ("14:30"). */
export function localToIso(dateKey: string, time: string): string {
  return new Date(`${dateKey}T${time.slice(0, 5)}:00${SHOP_UTC_OFFSET}`).toISOString();
}

/** Adds days to a date key. */
export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Weekday 0 (Sunday) to 6 (Saturday) of a date key. */
export function weekdayOfKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** A Date at local noon for a date key; safe to hand to calendar widgets. */
export function keyToCalendarDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12);
}

/** Date key of a calendar widget's Date (which uses the browser's local fields). */
export function calendarDateToKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const WEEKDAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

/** "Terça, 24 de novembro" */
export function formatDateLong(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return `${WEEKDAY_NAMES[weekdayOfKey(dateKey)]}, ${d} de ${MONTH_NAMES[m - 1]}`;
}

/** "24/11/2026" */
export function formatDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
}

/** "10h", "09h30" */
export function formatHour(time: string): string {
  const [h, m] = time.slice(0, 5).split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

/** Minutes since midnight for "HH:MM[:SS]". */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type DayPeriod = "Manhã" | "Tarde" | "Noite";

export function periodOf(time: string): DayPeriod {
  const minutes = timeToMinutes(time);
  if (minutes < 12 * 60) return "Manhã";
  if (minutes < 18 * 60) return "Tarde";
  return "Noite";
}

// ---------- Opening hours summary (footer) ----------

export type OpeningHours = {
  weekday: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
};

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

/**
 * Groups consecutive weekdays that share hours, starting the week on Tuesday so the
 * shop's usual week reads naturally: "Terça a sexta · 10h — 20h", "Domingo e segunda · Fechado".
 */
export function summarizeOpeningHours(hours: readonly OpeningHours[]): [string, string][] {
  const byDay = new Map(hours.map((h) => [h.weekday, h]));
  const order = [2, 3, 4, 5, 6, 0, 1];
  const label = (h: OpeningHours | undefined) =>
    h && h.is_open ? `${formatHour(h.open_time)} — ${formatHour(h.close_time)}` : "Fechado";

  const groups: { days: number[]; value: string }[] = [];
  for (const day of order) {
    const value = label(byDay.get(day));
    const last = groups[groups.length - 1];
    if (last && last.value === value) last.days.push(day);
    else groups.push({ days: [day], value });
  }

  // Closed groups go last, as in a printed schedule.
  groups.sort((a, b) => Number(a.value === "Fechado") - Number(b.value === "Fechado"));

  return groups.map(({ days, value }) => {
    const first = DAY_LABELS[days[0] ?? 0] ?? "";
    const lastDay = DAY_LABELS[days[days.length - 1] ?? 0] ?? "";
    let name: string;
    if (days.length === 1) name = first;
    else if (days.length === 2) name = `${first} e ${lastDay.toLowerCase()}`;
    else name = `${first} a ${lastDay.toLowerCase()}`;
    return [name, value];
  });
}

// ---------- Error messages ----------

const ERROR_MESSAGES: Record<string, string> = {
  SLOT_UNAVAILABLE: "Esse horário acabou de ficar indisponível. Escolha outro horário.",
  SERVICE_UNAVAILABLE: "Este serviço não está disponível para agendamento no momento.",
  BARBER_UNAVAILABLE: "Este barbeiro não está disponível para novos agendamentos.",
  INVALID_NAME: "Informe seu nome completo.",
  INVALID_PHONE: "Informe um telefone válido com DDD.",
  INVALID_EMAIL: "Informe um e-mail válido ou deixe o campo em branco.",
  INVALID_NOTES: "As observações podem ter no máximo 500 caracteres.",
  INVALID_STATUS_TRANSITION: "Essa mudança de status não é permitida.",
  APPOINTMENT_NOT_STARTED: "Só é possível marcar como concluído ou não compareceu após o horário.",
  APPOINTMENT_CLOSED: "Este agendamento já foi encerrado e não pode ser reagendado.",
  USE_RESCHEDULE: "Para mudar data, horário ou barbeiro, use a opção Reagendar.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  NOT_FOUND: "Agendamento não encontrado.",
  INVALID_HOURS: "Informe os sete dias da semana com horários válidos.",
  INVALID_SERVICES: "Confira os serviços selecionados para o barbeiro.",
};

/** Maps a backend error (code or message) to a friendly sentence, never the raw error. */
export function friendlyError(error: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  const text =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
  for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
    if (text.includes(code)) return message;
  }
  if (/jwt|token|session/i.test(text)) return "Sua sessão expirou. Entre novamente.";
  if (/fetch|network|Failed to/i.test(text)) return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
  if (/appointments_no_overlap|exclusion/i.test(text)) return ERROR_MESSAGES["SLOT_UNAVAILABLE"] ?? fallback;
  if (/appointments_brazilian_phone/i.test(text)) return ERROR_MESSAGES["INVALID_PHONE"] ?? fallback;
  return fallback;
}
