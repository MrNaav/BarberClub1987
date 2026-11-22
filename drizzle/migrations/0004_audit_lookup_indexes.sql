create index if not exists appointments_service_idx on public.appointments(service_id);
create index if not exists schedule_blocks_barber_idx on public.schedule_blocks(barber_id);