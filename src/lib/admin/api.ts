import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { addDaysToKey, localToIso, type AppointmentStatus } from "@/lib/booking/core";

/*
 * Admin data access goes straight through the signed-in browser client.
 * Row-level security (admin role) is the real boundary; every query here fails for non-admins.
 */

type Tables = Database["public"]["Tables"];
export type Appointment = Tables["appointments"]["Row"];
export type ServiceRow = Tables["services"]["Row"];
export type BarberRow = Tables["barbers"]["Row"];
export type BarberHoursRow = Tables["barber_weekly_hours"]["Row"];
export type BusinessHoursRow = Tables["business_hours"]["Row"];
export type BlockRow = Tables["schedule_blocks"]["Row"];
export type SettingsRow = Tables["booking_settings"]["Row"];

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null || result.data === undefined) throw new Error("EMPTY_RESPONSE");
  return result.data as NonNullable<T>;
}

export type AppointmentFilters = {
  from: string; // date key, inclusive
  to: string; // date key, inclusive
  barberId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  search?: string;
};

export const appointmentsQuery = (filters: AppointmentFilters) =>
  queryOptions({
    queryKey: ["admin", "appointments", filters],
    queryFn: async () => {
      const fetchPage = (offset: number) => {
      let q = supabase
        .from("appointments")
        .select("*")
        .gte("starts_at", localToIso(filters.from, "00:00"))
        .lt("starts_at", localToIso(addDaysToKey(filters.to, 1), "00:00"))
        .order("starts_at", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + 999);
      if (filters.barberId) q = q.eq("barber_id", filters.barberId);
      if (filters.serviceId) q = q.eq("service_id", filters.serviceId);
      if (filters.status) q = q.eq("status", filters.status);
      const term = filters.search?.trim();
      if (term) {
        const digits = term.replace(/\D/g, "");
        const safe = term.replace(/[%,()*\\]/g, " ").trim();
        q =
          digits.length >= 3 && digits.length === term.replace(/[\s()+-]/g, "").length
            ? q.like("customer_phone", `%${digits}%`)
            : q.ilike("customer_name", `%${safe}%`);
      }
      return q;
      };
      const rows: Appointment[] = [];
      for (let offset = 0; ; offset += 1000) {
        const page = unwrap(await fetchPage(offset));
        rows.push(...page);
        if (page.length < 1000) break;
      }
      return rows;
    },
    refetchInterval: 30_000,
  });

export const upcomingQuery = queryOptions({
  queryKey: ["admin", "appointments", "upcoming"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("appointments")
        .select("*")
        .in("status", ["pending", "confirmed"])
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(8),
    ),
  refetchInterval: 30_000,
});

export const servicesQuery = queryOptions({
  queryKey: ["admin", "services"],
  queryFn: async () => unwrap(await supabase.from("services").select("*").order("sort_order")),
});

export const barbersQuery = queryOptions({
  queryKey: ["admin", "barbers"],
  queryFn: async () => unwrap(await supabase.from("barbers").select("*").order("sort_order")),
});

export const barberServicesQuery = queryOptions({
  queryKey: ["admin", "barber-services"],
  queryFn: async () => unwrap(await supabase.from("barber_services").select("barber_id, service_id")),
});

export const barberHoursQuery = queryOptions({
  queryKey: ["admin", "barber-hours"],
  queryFn: async () =>
    unwrap(await supabase.from("barber_weekly_hours").select("*").order("weekday")),
});

export const businessHoursQuery = queryOptions({
  queryKey: ["admin", "business-hours"],
  queryFn: async () => unwrap(await supabase.from("business_hours").select("*").order("weekday")),
});

export const settingsQuery = queryOptions({
  queryKey: ["admin", "settings"],
  queryFn: async () =>
    unwrap(await supabase.from("booking_settings").select("*").eq("id", 1).single()),
});

export const blocksQuery = queryOptions({
  queryKey: ["admin", "blocks"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("schedule_blocks")
        .select("*")
        .order("starts_at"),
    ),
});

// ---------- Mutations ----------

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  unwrap(await supabase.from("appointments").update({ status }).eq("id", id).select("id").single());
}

export async function updateAppointmentDetails(
  id: string,
  values: { customer_name: string; customer_phone: string; customer_email: string | null; notes: string | null },
) {
  unwrap(await supabase.from("appointments").update(values).eq("id", id).select("id").single());
}

export async function rescheduleAppointment(id: string, barberId: string, startsAt: string) {
  const { error } = await supabase.rpc("admin_reschedule_appointment", {
    p_appointment_id: id,
    p_barber_id: barberId,
    p_starts_at: startsAt,
  });
  if (error) throw new Error(error.message);
}

export async function fetchRescheduleSlots(appointment: Appointment, barberId: string, date: string) {
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_service_id: appointment.service_id,
    p_date: date,
    p_barber_id: barberId,
    p_exclude_appointment_id: appointment.id,
    p_duration_minutes: appointment.service_duration_minutes,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => new Date(row.starts_at).toISOString());
}

export async function updateService(id: string, values: Tables["services"]["Update"]) {
  unwrap(await supabase.from("services").update(values).eq("id", id).select("id").single());
}

export async function saveBarberProfile(barberId: string, profile: {
  name: string; role: string; specialty: string; bio: string; is_active: boolean;
}, serviceIds: string[]) {
  const { error } = await supabase.rpc("save_barber_profile", {
    p_barber_id: barberId, p_profile: profile, p_service_ids: serviceIds,
  });
  if (error) throw new Error(error.message);
}

export async function saveBarberHours(rows: Tables["barber_weekly_hours"]["Insert"][]) {
  unwrap(
    await supabase
      .from("barber_weekly_hours")
      .upsert(rows, { onConflict: "barber_id,weekday" })
      .select("barber_id"),
  );
}

export async function saveBusinessHours(rows: Tables["business_hours"]["Update"][]) {
  const { error } = await supabase.rpc("save_business_hours", { p_rows: rows });
  if (error) throw new Error(error.message);
}

export async function saveSettings(values: Tables["booking_settings"]["Update"]) {
  unwrap(await supabase.from("booking_settings").update(values).eq("id", 1).select("id").single());
}

export async function addBlock(values: Tables["schedule_blocks"]["Insert"]) {
  unwrap(await supabase.from("schedule_blocks").insert(values).select("id").single());
}

export async function removeBlock(id: string) {
  unwrap(await supabase.from("schedule_blocks").delete().eq("id", id).select("id").single());
}
