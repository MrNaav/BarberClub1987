create extension if not exists btree_gist;

-- ========== Shared helpers ==========
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ========== Roles ==========
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read their own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.has_role(auth.uid(), 'admin')
$$;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- First account ever created becomes the administrator (public sign-up is disabled).
create or replace function public.grant_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('bc1987_first_admin'));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_grant_first_admin
  after insert on auth.users for each row execute function public.grant_first_admin();

-- ========== Services ==========
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  price_cents integer not null check (price_cents between 0 and 10000000),
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  price_is_demo boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.services to anon, authenticated;
grant update on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "Anyone can view services" on public.services for select to anon, authenticated using (true);
create policy "Admins update services" on public.services for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

-- ========== Barbers ==========
create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  role text not null check (char_length(btrim(role)) between 1 and 60),
  specialty text not null default '' check (char_length(specialty) <= 80),
  bio text not null default '' check (char_length(bio) <= 400),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.barbers to anon, authenticated;
grant update on public.barbers to authenticated;
grant all on public.barbers to service_role;
alter table public.barbers enable row level security;
create policy "Anyone can view barbers" on public.barbers for select to anon, authenticated using (true);
create policy "Admins update barbers" on public.barbers for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger barbers_updated_at before update on public.barbers
  for each row execute function public.set_updated_at();

create table public.barber_services (
  barber_id uuid not null references public.barbers(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (barber_id, service_id)
);
create index barber_services_service_idx on public.barber_services (service_id);
grant select on public.barber_services to anon, authenticated;
grant insert, delete on public.barber_services to authenticated;
grant all on public.barber_services to service_role;
alter table public.barber_services enable row level security;
create policy "Anyone can view barber services" on public.barber_services for select to anon, authenticated using (true);
create policy "Admins add barber services" on public.barber_services for insert to authenticated with check (public.is_admin());
create policy "Admins remove barber services" on public.barber_services for delete to authenticated using (public.is_admin());

-- ========== Opening hours ==========
create table public.business_hours (
  weekday smallint primary key check (weekday between 0 and 6),
  is_open boolean not null default false,
  open_time time not null default '09:00',
  close_time time not null default '18:00',
  break_start time,
  break_end time,
  updated_at timestamptz not null default now(),
  check (close_time > open_time),
  check ((break_start is null) = (break_end is null)),
  check (break_start is null or break_end > break_start)
);
grant select on public.business_hours to anon, authenticated;
grant update on public.business_hours to authenticated;
grant all on public.business_hours to service_role;
alter table public.business_hours enable row level security;
create policy "Anyone can view opening hours" on public.business_hours for select to anon, authenticated using (true);
create policy "Admins update opening hours" on public.business_hours for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger business_hours_updated_at before update on public.business_hours
  for each row execute function public.set_updated_at();

create table public.barber_weekly_hours (
  barber_id uuid not null references public.barbers(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  is_working boolean not null default false,
  start_time time not null default '09:00',
  end_time time not null default '18:00',
  break_start time,
  break_end time,
  updated_at timestamptz not null default now(),
  primary key (barber_id, weekday),
  check (end_time > start_time),
  check ((break_start is null) = (break_end is null)),
  check (break_start is null or break_end > break_start)
);
grant select on public.barber_weekly_hours to anon, authenticated;
grant insert, update on public.barber_weekly_hours to authenticated;
grant all on public.barber_weekly_hours to service_role;
alter table public.barber_weekly_hours enable row level security;
create policy "Anyone can view barber hours" on public.barber_weekly_hours for select to anon, authenticated using (true);
create policy "Admins add barber hours" on public.barber_weekly_hours for insert to authenticated with check (public.is_admin());
create policy "Admins update barber hours" on public.barber_weekly_hours for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger barber_weekly_hours_updated_at before update on public.barber_weekly_hours
  for each row execute function public.set_updated_at();

-- ========== Schedule blocks (days off, blocked dates and times) ==========
create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references public.barbers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '' check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index schedule_blocks_range_idx on public.schedule_blocks (starts_at, ends_at);
grant select, insert, delete on public.schedule_blocks to authenticated;
grant all on public.schedule_blocks to service_role;
alter table public.schedule_blocks enable row level security;
create policy "Admins view blocks" on public.schedule_blocks for select to authenticated using (public.is_admin());
create policy "Admins add blocks" on public.schedule_blocks for insert to authenticated with check (public.is_admin());
create policy "Admins remove blocks" on public.schedule_blocks for delete to authenticated using (public.is_admin());

-- ========== General booking settings (single row) ==========
create table public.booking_settings (
  id smallint primary key default 1 check (id = 1),
  min_notice_minutes integer not null default 120 check (min_notice_minutes between 0 and 10080),
  max_days_ahead integer not null default 30 check (max_days_ahead between 1 and 180),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 120),
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes in (10, 15, 20, 30, 45, 60)),
  timezone text not null default 'America/Sao_Paulo',
  updated_at timestamptz not null default now()
);
grant select on public.booking_settings to anon, authenticated;
grant update on public.booking_settings to authenticated;
grant all on public.booking_settings to service_role;
alter table public.booking_settings enable row level security;
create policy "Anyone can view booking settings" on public.booking_settings for select to anon, authenticated using (true);
create policy "Admins update booking settings" on public.booking_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger booking_settings_updated_at before update on public.booking_settings
  for each row execute function public.set_updated_at();

-- ========== Appointments ==========
create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  service_id uuid not null references public.services(id) on delete restrict,
  barber_id uuid not null references public.barbers(id) on delete restrict,
  service_name text not null,
  service_price_cents integer not null,
  service_duration_minutes integer not null,
  barber_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  blocked_until timestamptz not null,
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 100),
  customer_phone text not null check (customer_phone ~ '^[0-9]{10,13}$'),
  customer_email text check (customer_email is null or (char_length(customer_email) <= 255 and customer_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  notes text check (notes is null or char_length(notes) <= 500),
  status public.appointment_status not null default 'pending',
  status_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (blocked_until >= ends_at),
  constraint appointments_no_overlap exclude using gist (
    barber_id with =,
    tstzrange(starts_at, blocked_until, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);
create index appointments_starts_at_idx on public.appointments (starts_at);
create index appointments_status_idx on public.appointments (status);
create index appointments_barber_starts_idx on public.appointments (barber_id, starts_at);
grant select, update on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;
create policy "Admins view appointments" on public.appointments for select to authenticated using (public.is_admin());
create policy "Admins update appointments" on public.appointments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.appointments_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status <> old.status then
    if not (
      (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
      or (old.status = 'confirmed' and new.status in ('completed', 'cancelled', 'no_show'))
    ) then
      raise exception 'INVALID_STATUS_TRANSITION';
    end if;
    if new.status in ('completed', 'no_show') and old.starts_at > now() then
      raise exception 'APPOINTMENT_NOT_STARTED';
    end if;
    new.status_changed_at := now();
  end if;

  if (new.starts_at, new.ends_at, new.blocked_until, new.barber_id, new.service_id)
       is distinct from (old.starts_at, old.ends_at, old.blocked_until, old.barber_id, old.service_id) then
    if coalesce(current_setting('bc.rescheduling', true), '') <> 'on' then
      raise exception 'USE_RESCHEDULE';
    end if;
    if old.status not in ('pending', 'confirmed') then
      raise exception 'APPOINTMENT_CLOSED';
    end if;
  end if;

  -- Booking snapshots and identifiers never change.
  new.code := old.code;
  new.created_at := old.created_at;
  new.service_name := old.service_name;
  new.service_price_cents := old.service_price_cents;
  new.service_duration_minutes := old.service_duration_minutes;
  if coalesce(current_setting('bc.rescheduling', true), '') <> 'on' then
    new.barber_name := old.barber_name;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger appointments_guard before update on public.appointments
  for each row execute function public.appointments_guard();

-- ========== Availability ==========
create or replace function public.get_available_slots(
  p_service_id uuid,
  p_date date,
  p_barber_id uuid default null,
  p_exclude_appointment_id uuid default null,
  p_duration_minutes integer default null
)
returns table (barber_id uuid, starts_at timestamptz)
language sql stable security definer set search_path = public as $$
  with
  s as (select * from public.booking_settings where id = 1),
  adm as (select public.is_admin() as yes),
  svc as (
    select sv.id,
      coalesce(case when (select yes from adm) then p_duration_minutes end, sv.duration_minutes) as duration
    from public.services sv
    where sv.id = p_service_id and (sv.is_active or (select yes from adm))
  ),
  bounds as (
    select (now() at time zone s.timezone)::date as today, s.* from s
  ),
  shop as (
    select bh.* from public.business_hours bh, bounds
    where bh.weekday = extract(dow from p_date)::int and bh.is_open
      and p_date >= bounds.today and p_date <= bounds.today + bounds.max_days_ahead
  ),
  windows as (
    select b.id as barber_id, b.sort_order,
      greatest(shop.open_time, wh.start_time) as win_start,
      least(shop.close_time, wh.end_time) as win_end,
      shop.break_start as sb_start, shop.break_end as sb_end,
      wh.break_start as bb_start, wh.break_end as bb_end
    from public.barbers b
    join public.barber_services bs on bs.barber_id = b.id and bs.service_id = p_service_id
    join public.barber_weekly_hours wh on wh.barber_id = b.id
      and wh.weekday = extract(dow from p_date)::int and wh.is_working
    cross join shop
    where b.is_active and (p_barber_id is null or b.id = p_barber_id)
  ),
  cand as (
    select w.*, svc.duration, gs as local_start, gs + make_interval(mins => svc.duration) as local_end
    from windows w
    cross join svc
    cross join bounds
    cross join lateral generate_series(
      p_date + w.win_start,
      p_date + w.win_end - make_interval(mins => svc.duration),
      make_interval(mins => bounds.slot_interval_minutes)
    ) gs
    where w.win_end > w.win_start
  ),
  tz as (
    select c.*,
      (c.local_start at time zone bounds.timezone) as slot_start,
      (c.local_end at time zone bounds.timezone) as slot_end,
      bounds.buffer_minutes, bounds.min_notice_minutes
    from cand c cross join bounds
  )
  select t.barber_id, t.slot_start
  from tz t
  where t.slot_start >= now() + make_interval(mins => t.min_notice_minutes)
    and (t.sb_start is null or not (t.local_start < p_date + t.sb_end and t.local_end > p_date + t.sb_start))
    and (t.bb_start is null or not (t.local_start < p_date + t.bb_end and t.local_end > p_date + t.bb_start))
    and not exists (
      select 1 from public.schedule_blocks blk
      where (blk.barber_id is null or blk.barber_id = t.barber_id)
        and blk.starts_at < t.slot_end and blk.ends_at > t.slot_start
    )
    and not exists (
      select 1 from public.appointments a
      where a.barber_id = t.barber_id
        and a.status in ('pending', 'confirmed')
        and a.id is distinct from (case when (select yes from adm) then p_exclude_appointment_id end)
        and a.starts_at < t.slot_end + make_interval(mins => t.buffer_minutes)
        and a.blocked_until > t.slot_start
    )
  order by t.slot_start, t.sort_order
$$;
grant execute on function public.get_available_slots(uuid, date, uuid, uuid, integer) to anon, authenticated;

create or replace function public.get_available_dates(p_service_id uuid, p_barber_id uuid default null)
returns table (available_date date)
language sql stable security definer set search_path = public as $$
  with b as (
    select (now() at time zone s.timezone)::date as today, s.max_days_ahead
    from public.booking_settings s where s.id = 1
  )
  select d::date
  from b, generate_series(b.today, b.today + b.max_days_ahead, interval '1 day') d
  where exists (select 1 from public.get_available_slots(p_service_id, d::date, p_barber_id))
  order by 1
$$;
grant execute on function public.get_available_dates(uuid, uuid) to anon, authenticated;

-- ========== Booking ==========
create or replace function public.generate_booking_code()
returns text language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := 'BC-';
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * 32)::int, 1);
  end loop;
  return result;
end $$;

create or replace function public.book_appointment(
  p_service_id uuid,
  p_barber_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_notes text default null
)
returns table (
  id uuid, code text, starts_at timestamptz, ends_at timestamptz,
  barber_id uuid, barber_name text, service_name text,
  service_price_cents integer, service_duration_minutes integer,
  status public.appointment_status
)
language plpgsql volatile security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_settings public.booking_settings;
  v_service public.services;
  v_barber public.barbers;
  v_candidate uuid;
  v_row public.appointments;
  v_local_date date;
  v_name text := btrim(coalesce(p_customer_name, ''));
  v_phone text := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_customer_email, ''))), '');
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
begin
  if char_length(v_name) < 2 or char_length(v_name) > 100 then raise exception 'INVALID_NAME'; end if;
  if v_phone !~ '^[0-9]{10,13}$' then raise exception 'INVALID_PHONE'; end if;
  if v_email is not null and (char_length(v_email) > 255 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'INVALID_EMAIL';
  end if;
  if v_notes is not null and char_length(v_notes) > 500 then raise exception 'INVALID_NOTES'; end if;

  select * into v_settings from public.booking_settings where id = 1;
  select * into v_service from public.services where id = p_service_id and is_active;
  if not found then raise exception 'SERVICE_UNAVAILABLE'; end if;

  v_local_date := (p_starts_at at time zone v_settings.timezone)::date;

  for v_candidate in
    select sl.barber_id
    from public.get_available_slots(p_service_id, v_local_date, p_barber_id) sl
    join public.barbers b on b.id = sl.barber_id
    where sl.starts_at = p_starts_at
    order by b.sort_order
  loop
    select * into v_barber from public.barbers where id = v_candidate;
    <<attempt>>
    loop
      begin
        insert into public.appointments (
          code, service_id, barber_id, service_name, service_price_cents, service_duration_minutes,
          barber_name, starts_at, ends_at, blocked_until,
          customer_name, customer_phone, customer_email, notes, status
        ) values (
          public.generate_booking_code(), v_service.id, v_barber.id, v_service.name, v_service.price_cents,
          v_service.duration_minutes, v_barber.name, p_starts_at,
          p_starts_at + make_interval(mins => v_service.duration_minutes),
          p_starts_at + make_interval(mins => v_service.duration_minutes + v_settings.buffer_minutes),
          v_name, v_phone, v_email, v_notes, 'pending'
        ) returning * into v_row;

        return query select v_row.id, v_row.code, v_row.starts_at, v_row.ends_at, v_row.barber_id,
          v_row.barber_name, v_row.service_name, v_row.service_price_cents,
          v_row.service_duration_minutes, v_row.status;
        return;
      exception
        when exclusion_violation then
          exit attempt; -- someone took this barber at this time; try the next one
        when unique_violation then
          null; -- booking code collision; retry with a new code
      end;
    end loop attempt;
  end loop;

  raise exception 'SLOT_UNAVAILABLE';
end $$;
grant execute on function public.book_appointment(uuid, uuid, timestamptz, text, text, text, text) to anon, authenticated;

create or replace function public.admin_reschedule_appointment(
  p_appointment_id uuid,
  p_barber_id uuid,
  p_starts_at timestamptz
)
returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  v_appt public.appointments;
  v_settings public.booking_settings;
  v_barber public.barbers;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  select * into v_appt from public.appointments where id = p_appointment_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_appt.status not in ('pending', 'confirmed') then raise exception 'APPOINTMENT_CLOSED'; end if;

  select * into v_settings from public.booking_settings where id = 1;
  select * into v_barber from public.barbers where id = p_barber_id and is_active;
  if not found then raise exception 'BARBER_UNAVAILABLE'; end if;

  if not exists (
    select 1 from public.get_available_slots(
      v_appt.service_id, (p_starts_at at time zone v_settings.timezone)::date,
      p_barber_id, p_appointment_id, v_appt.service_duration_minutes
    ) sl where sl.starts_at = p_starts_at
  ) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  perform set_config('bc.rescheduling', 'on', true);
  begin
    update public.appointments set
      barber_id = v_barber.id,
      barber_name = v_barber.name,
      starts_at = p_starts_at,
      ends_at = p_starts_at + make_interval(mins => v_appt.service_duration_minutes),
      blocked_until = p_starts_at + make_interval(mins => v_appt.service_duration_minutes + v_settings.buffer_minutes)
    where id = p_appointment_id;
  exception when exclusion_violation then
    perform set_config('bc.rescheduling', 'off', true);
    raise exception 'SLOT_UNAVAILABLE';
  end;
  perform set_config('bc.rescheduling', 'off', true);
end $$;
revoke execute on function public.admin_reschedule_appointment(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.admin_reschedule_appointment(uuid, uuid, timestamptz) to authenticated;

-- ========== Initial data ==========
insert into public.services (slug, name, description, price_cents, duration_minutes, is_featured, price_is_demo, sort_order) values
  ('corte-tradicional', 'Corte tradicional', 'Corte personalizado, executado com precisão e atenção ao estilo de cada cliente.', 7500, 45, false, true, 1),
  ('corte-barba', 'Corte + barba', 'Combinação de corte de cabelo e cuidado completo com a barba, garantindo harmonia e acabamento.', 12000, 75, true, true, 2),
  ('barba-completa', 'Barba completa', 'Modelagem, alinhamento e acabamento profissional para valorizar o formato do rosto.', 6500, 40, false, true, 3),
  ('acabamento-sobrancelha', 'Acabamento e sobrancelha', 'Detalhamento do corte, contornos e alinhamento das sobrancelhas.', 4000, 20, false, true, 4);

insert into public.barbers (slug, name, role, specialty, bio, sort_order) values
  ('rafael-mendes', 'Rafael Mendes', 'Master Barber', 'Cortes clássicos', 'Especialista em cortes clássicos e técnicas tradicionais, combinando experiência, precisão e atenção aos detalhes.', 1),
  ('lucas-ferreira', 'Lucas Ferreira', 'Barber', 'Degradês e estilos urbanos', 'Focado em cortes contemporâneos, degradês e estilos urbanos, com atenção à personalidade de cada cliente.', 2),
  ('andre-costa', 'André Costa', 'Barber', 'Barba e acabamento', 'Especialista em barba, acabamento e cuidado masculino, valorizando simetria, precisão e estilo.', 3);

insert into public.barber_services (barber_id, service_id)
  select b.id, s.id from public.barbers b cross join public.services s;

insert into public.business_hours (weekday, is_open, open_time, close_time) values
  (0, false, '09:00', '18:00'),
  (1, false, '09:00', '18:00'),
  (2, true, '10:00', '20:00'),
  (3, true, '10:00', '20:00'),
  (4, true, '10:00', '20:00'),
  (5, true, '10:00', '20:00'),
  (6, true, '09:00', '18:00');

insert into public.barber_weekly_hours (barber_id, weekday, is_working, start_time, end_time)
  select b.id, bh.weekday, bh.is_open, bh.open_time, bh.close_time
  from public.barbers b cross join public.business_hours bh;

insert into public.booking_settings (id) values (1);