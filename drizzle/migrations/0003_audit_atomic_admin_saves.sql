create or replace function public.save_business_hours(p_rows jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare v_count integer;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) <> 7 then raise exception 'INVALID_HOURS'; end if;
  if (select count(distinct weekday) from jsonb_to_recordset(p_rows) as x(weekday smallint)) <> 7 then raise exception 'INVALID_HOURS'; end if;
  update public.business_hours h set is_open=x.is_open, open_time=x.open_time, close_time=x.close_time, break_start=x.break_start, break_end=x.break_end
  from jsonb_to_recordset(p_rows) as x(weekday smallint,is_open boolean,open_time time,close_time time,break_start time,break_end time)
  where h.weekday=x.weekday;
  get diagnostics v_count = row_count;
  if v_count <> 7 then raise exception 'INVALID_HOURS'; end if;
end $$;
revoke execute on function public.save_business_hours(jsonb) from public, anon;
grant execute on function public.save_business_hours(jsonb) to authenticated;

create or replace function public.save_barber_profile(p_barber_id uuid,p_profile jsonb,p_service_ids uuid[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_service_ids is null then raise exception 'INVALID_SERVICES'; end if;
  update public.barbers set name=p_profile->>'name',role=p_profile->>'role',specialty=p_profile->>'specialty',bio=p_profile->>'bio',is_active=(p_profile->>'is_active')::boolean where id=p_barber_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  delete from public.barber_services where barber_id=p_barber_id and not (service_id=any(p_service_ids));
  insert into public.barber_services(barber_id,service_id) select p_barber_id,s from unnest(p_service_ids) s on conflict do nothing;
end $$;
revoke execute on function public.save_barber_profile(uuid,jsonb,uuid[]) from public, anon;
grant execute on function public.save_barber_profile(uuid,jsonb,uuid[]) to authenticated;

alter table public.appointments add constraint appointments_brazilian_phone check (customer_phone ~ '^[0-9]{10,11}$');
