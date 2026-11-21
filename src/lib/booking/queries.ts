import { queryOptions } from "@tanstack/react-query";

import { getAvailableDates, getAvailableSlots, getPublicCatalog } from "./booking.functions";

export const catalogQuery = queryOptions({
  queryKey: ["public", "catalog"],
  queryFn: () => getPublicCatalog(),
  staleTime: 60_000,
});

export const availableDatesQuery = (serviceId: string, barberId: string | null) =>
  queryOptions({
    queryKey: ["public", "dates", serviceId, barberId],
    queryFn: () => getAvailableDates({ data: { serviceId, barberId } }),
    staleTime: 30_000,
  });

export const availableSlotsQuery = (serviceId: string, barberId: string | null, date: string) =>
  queryOptions({
    queryKey: ["public", "slots", serviceId, barberId, date],
    queryFn: () => getAvailableSlots({ data: { serviceId, barberId, date } }),
    staleTime: 0,
  });
