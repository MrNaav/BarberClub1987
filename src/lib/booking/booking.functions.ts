import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isValidPhone, phoneDigits } from "./core";
import { createPublicClient } from "./public-client.server";

export type PublicService = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  duration_minutes: number;
  is_featured: boolean;
  price_is_demo: boolean;
};

export type PublicBarber = {
  id: string;
  slug: string;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  service_ids: string[];
};

export type PublicHours = {
  weekday: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
};

export type PublicCatalog = {
  ok: boolean;
  services: PublicService[];
  barbers: PublicBarber[];
  hours: PublicHours[];
  maxDaysAhead: number;
};

/** Active services, active barbers and opening hours for the site and the booking flow. */
export const getPublicCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicCatalog> => {
    try {
      const db = createPublicClient();
      const [services, barbers, links, hours, settings] = await Promise.all([
        db
          .from("services")
          .select("id, slug, name, description, price_cents, duration_minutes, is_featured, price_is_demo")
          .eq("is_active", true)
          .order("sort_order"),
        db
          .from("barbers")
          .select("id, slug, name, role, specialty, bio")
          .eq("is_active", true)
          .order("sort_order"),
        db.from("barber_services").select("barber_id, service_id"),
        db.from("business_hours").select("weekday, is_open, open_time, close_time").order("weekday"),
        db.from("booking_settings").select("max_days_ahead").eq("id", 1).maybeSingle(),
      ]);
      const failed = [services, barbers, links, hours, settings].find((r) => r.error);
      if (failed?.error) throw failed.error;

      return {
        ok: true,
        services: services.data ?? [],
        barbers: (barbers.data ?? []).map((b) => ({
          ...b,
          service_ids: (links.data ?? []).filter((l) => l.barber_id === b.id).map((l) => l.service_id),
        })),
        hours: hours.data ?? [],
        maxDaysAhead: settings.data?.max_days_ahead ?? 30,
      };
    } catch (error) {
      console.error("getPublicCatalog failed", error instanceof Error ? error.message : error);
      return { ok: false, services: [], barbers: [], hours: [], maxDaysAhead: 30 };
    }
  },
);

const uuid = z.string().uuid();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const getAvailableDates = createServerFn({ method: "GET" })
  .inputValidator((input: { serviceId: string; barberId: string | null }) =>
    z.object({ serviceId: uuid, barberId: uuid.nullable() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; dates: string[] }> => {
    const db = createPublicClient();
    const { data: rows, error } = await db.rpc("get_available_dates", {
      p_service_id: data.serviceId,
      ...(data.barberId ? { p_barber_id: data.barberId } : {}),
    });
    if (error) {
      console.error("getAvailableDates failed", error.message);
      return { ok: false, dates: [] };
    }
    return { ok: true, dates: (rows ?? []).map((r) => r.available_date) };
  });

export type PublicSlot = { startsAt: string; barberIds: string[] };

export const getAvailableSlots = createServerFn({ method: "GET" })
  .inputValidator((input: { serviceId: string; barberId: string | null; date: string }) =>
    z.object({ serviceId: uuid, barberId: uuid.nullable(), date: dateKey }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; slots: PublicSlot[] }> => {
    const db = createPublicClient();
    const { data: rows, error } = await db.rpc("get_available_slots", {
      p_service_id: data.serviceId,
      p_date: data.date,
      ...(data.barberId ? { p_barber_id: data.barberId } : {}),
    });
    if (error) {
      console.error("getAvailableSlots failed", error.message);
      return { ok: false, slots: [] };
    }
    const byStart = new Map<string, string[]>();
    for (const row of rows ?? []) {
      const key = new Date(row.starts_at).toISOString();
      byStart.set(key, [...(byStart.get(key) ?? []), row.barber_id]);
    }
    return {
      ok: true,
      slots: [...byStart.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([startsAt, barberIds]) => ({ startsAt, barberIds })),
    };
  });

export const bookingInputSchema = z.object({
  serviceId: uuid,
  barberId: uuid.nullable(),
  startsAt: z.string().datetime({ offset: true }),
  name: z.string().trim().min(2, "Informe seu nome completo.").max(100, "Nome muito longo."),
  phone: z
    .string()
    .trim()
    .refine(isValidPhone, "Informe um telefone válido com DDD."),
  email: z
    .string()
    .trim()
    .max(255, "E-mail muito longo.")
    .email("Informe um e-mail válido.")
    .or(z.literal("")),
  notes: z.string().trim().max(500, "Máximo de 500 caracteres."),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

export type BookingResult =
  | {
      ok: true;
      booking: {
        id: string;
        code: string;
        startsAt: string;
        endsAt: string;
        barberName: string;
        serviceName: string;
        priceCents: number;
        durationMinutes: number;
      };
    }
  | { ok: false; code: string };

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input: BookingInput) => bookingInputSchema.parse(input))
  .handler(async ({ data }): Promise<BookingResult> => {
    try {
      const db = createPublicClient();
      const { data: rows, error } = await db.rpc("book_appointment", {
        p_service_id: data.serviceId,
        p_barber_id: data.barberId,
        p_starts_at: data.startsAt,
        p_customer_name: data.name,
        p_customer_phone: phoneDigits(data.phone),
        ...(data.email ? { p_customer_email: data.email } : {}),
        ...(data.notes ? { p_notes: data.notes } : {}),
      } as never);
      if (error) {
        const known = error.message.match(/[A-Z_]{6,}/)?.[0];
        if (!known) console.error("createBooking failed", error.code);
        return { ok: false, code: known ?? "UNKNOWN" };
      }
      const row = rows?.[0];
      if (!row) return { ok: false, code: "UNKNOWN" };
      return {
        ok: true,
        booking: {
          id: row.id,
          code: row.code,
          startsAt: new Date(row.starts_at).toISOString(),
          endsAt: new Date(row.ends_at).toISOString(),
          barberName: row.barber_name,
          serviceName: row.service_name,
          priceCents: row.service_price_cents,
          durationMinutes: row.service_duration_minutes,
        },
      };
    } catch (error) {
      console.error("createBooking crashed", error instanceof Error ? error.name : "unknown");
      return { ok: false, code: "UNKNOWN" };
    }
  });
