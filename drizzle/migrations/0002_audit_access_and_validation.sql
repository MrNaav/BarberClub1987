create or replace function public.grant_first_admin()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  return new;
end $$;
comment on function public.grant_first_admin() is 'Deprecated: no automatic role grants. Provision roles explicitly using trusted privileged administration.';
revoke execute on function public.grant_first_admin() from public, anon, authenticated;

revoke select on public.barber_weekly_hours from anon;
alter policy "Anyone can view barber hours" on public.barber_weekly_hours to authenticated using (public.is_admin());

revoke select on public.booking_settings from anon;
grant select (max_days_ahead) on public.booking_settings to anon;
alter policy "Anyone can view booking settings" on public.booking_settings to anon using (id = 1);
create policy "Admins view booking settings" on public.booking_settings for select to authenticated using (public.is_admin());

alter policy "Anyone can view services" on public.services using (is_active or public.is_admin());
alter policy "Anyone can view barbers" on public.barbers using (is_active or public.is_admin());
alter policy "Anyone can view barber services" on public.barber_services using (public.is_admin() or (exists (select 1 from public.barbers b where b.id = barber_id and b.is_active) and exists (select 1 from public.services s where s.id = service_id and s.is_active)));

alter table public.business_hours add constraint business_break_within_hours check (break_start is null or (break_start >= open_time and break_end <= close_time));
alter table public.barber_weekly_hours add constraint barber_break_within_hours check (break_start is null or (break_start >= start_time and break_end <= end_time));
alter table public.booking_settings add constraint booking_supported_timezone check (timezone = 'America/Sao_Paulo');
alter table public.booking_settings add constraint booking_notice_within_horizon check (min_notice_minutes <= max_days_ahead * 1440);