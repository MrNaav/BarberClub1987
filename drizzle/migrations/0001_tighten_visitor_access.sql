revoke all on public.appointments from anon;
revoke all on public.schedule_blocks from anon;
revoke all on public.user_roles from anon;
revoke execute on function public.generate_booking_code() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;