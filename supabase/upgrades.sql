-- =========================================================
-- Barberly — upgrades migration
-- Run this in the Supabase SQL editor AFTER supabase/schema.sql.
-- Adds: multi-barber staff, cancellation policy, photos, geo search,
-- in-app notifications, payments/deposits, and a waitlist.
-- =========================================================

-- ---------------------------------------------------------
-- 1. MULTIPLE BARBERS PER SHOP
-- ---------------------------------------------------------
create table if not exists public.shop_staff (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null, -- optional: staff with their own login
  full_name text not null,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists shop_staff_shop_idx on public.shop_staff (shop_id);

alter table public.shop_staff enable row level security;

create policy "Shop staff are publicly readable"
  on public.shop_staff for select
  using (true);

create policy "Owners manage shop staff"
  on public.shop_staff for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- Appointments can optionally be booked with a specific staff member.
-- NULL = "any available" (kept for backwards compatibility with existing rows).
alter table public.appointments add column if not exists staff_id uuid references public.shop_staff (id) on delete set null;
create index if not exists appointments_staff_idx on public.appointments (staff_id, starts_at);

-- ---------------------------------------------------------
-- 2. CANCELLATION / NO-SHOW POLICY
-- ---------------------------------------------------------
alter table public.shops add column if not exists cancellation_cutoff_minutes integer not null default 120;

alter table public.profiles add column if not exists no_show_count integer not null default 0;

-- Replace the old, unrestricted client-cancel policy with one that
-- respects each shop's cancellation cutoff.
drop policy if exists "Clients can update (cancel) their own appointments" on public.appointments;

create policy "Clients can cancel within the shop's cancellation window"
  on public.appointments for update
  using (
    client_id = auth.uid()
    and now() <= starts_at - (
      (select cancellation_cutoff_minutes from public.shops where id = shop_id) * interval '1 minute'
    )
  )
  with check (client_id = auth.uid());

-- Track no-shows: whenever an owner marks an appointment 'no_show',
-- bump the client's counter automatically.
create or replace function public.handle_no_show()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'no_show' and old.status is distinct from 'no_show' then
    update public.profiles set no_show_count = no_show_count + 1 where id = new.client_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_appointment_no_show on public.appointments;
create trigger on_appointment_no_show
  after update on public.appointments
  for each row execute procedure public.handle_no_show();

-- ---------------------------------------------------------
-- 3. PHOTOS (Supabase Storage)
-- ---------------------------------------------------------
create table if not exists public.shop_photos (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shop_photos_shop_idx on public.shop_photos (shop_id);

alter table public.shop_photos enable row level security;

create policy "Shop photos are publicly readable"
  on public.shop_photos for select
  using (true);

create policy "Owners manage shop photos"
  on public.shop_photos for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- Storage bucket for shop cover images + galleries.
insert into storage.buckets (id, name, public)
values ('shop-photos', 'shop-photos', true)
on conflict (id) do nothing;

-- Files must be uploaded under a path of "<shop_id>/<filename>" so we can
-- check shop ownership from the path. Public can read; only the owning
-- barber can write/delete.
create policy "Shop photos are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'shop-photos');

create policy "Owners can upload their shop's photos"
  on storage.objects for insert
  with check (
    bucket_id = 'shop-photos'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(name))[1]
        and s.owner_id = auth.uid()
    )
  );

create policy "Owners can delete their shop's photos"
  on storage.objects for delete
  using (
    bucket_id = 'shop-photos'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(name))[1]
        and s.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------
-- 4. REAL LOCATION ("near me") SEARCH
-- ---------------------------------------------------------
-- Haversine distance in kilometers — no PostGIS/earthdistance extension
-- required, which keeps this runnable on every Supabase plan.
create or replace function public.nearby_shops(
  lat double precision,
  lng double precision,
  radius_km double precision default 15,
  search_q text default null
)
returns table (
  id uuid,
  name text,
  city text,
  area text,
  cover_image_url text,
  latitude double precision,
  longitude double precision,
  distance_km double precision
)
language sql
stable
as $$
  select
    s.id, s.name, s.city, s.area, s.cover_image_url, s.latitude, s.longitude,
    (
      6371 * acos(
        least(1, greatest(-1,
          cos(radians(lat)) * cos(radians(s.latitude)) *
          cos(radians(s.longitude) - radians(lng)) +
          sin(radians(lat)) * sin(radians(s.latitude))
        ))
      )
    ) as distance_km
  from public.shops s
  where s.is_published = true
    and s.latitude is not null
    and s.longitude is not null
    and (search_q is null or s.name ilike '%' || search_q || '%')
  having (
    6371 * acos(
      least(1, greatest(-1,
        cos(radians(lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(lng)) +
        sin(radians(lat)) * sin(radians(s.latitude))
      ))
    )
  ) <= radius_km
  order by distance_km asc;
$$;

-- ---------------------------------------------------------
-- 5. IN-APP NOTIFICATIONS
-- ---------------------------------------------------------
do $$ begin
  create type notification_type as enum (
    'appointment_requested',
    'appointment_confirmed',
    'appointment_cancelled',
    'appointment_completed',
    'waitlist_slot_open'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  appointment_id uuid references public.appointments (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_idx on public.notifications (profile_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users read their own notifications"
  on public.notifications for select
  using (profile_id = auth.uid());

create policy "Users mark their own notifications read"
  on public.notifications for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Notify both sides whenever an appointment is created or its status changes.
create or replace function public.handle_appointment_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  shop_owner uuid;
  shop_name text;
  service_name text;
begin
  select owner_id, name into shop_owner, shop_name from public.shops where id = new.shop_id;
  select name into service_name from public.services where id = new.service_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (profile_id, type, title, body, appointment_id)
    values (
      shop_owner,
      'appointment_requested',
      'New booking request',
      service_name || ' requested at ' || to_char(new.starts_at, 'Dy, Mon DD HH12:MI AM'),
      new.id
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'confirmed' then
      insert into public.notifications (profile_id, type, title, body, appointment_id)
      values (new.client_id, 'appointment_confirmed', 'Booking confirmed', shop_name || ' confirmed your appointment.', new.id);
    elsif new.status = 'cancelled' then
      insert into public.notifications (profile_id, type, title, body, appointment_id)
      values (
        case when auth.uid() = new.client_id then shop_owner else new.client_id end,
        'appointment_cancelled',
        'Booking cancelled',
        service_name || ' on ' || to_char(new.starts_at, 'Dy, Mon DD HH12:MI AM') || ' was cancelled.',
        new.id
      );

      -- A slot just opened up — ping anyone waiting for this shop/service/day.
      insert into public.notifications (profile_id, type, title, body, appointment_id)
      select w.client_id, 'waitlist_slot_open', 'A slot opened up', shop_name || ' has a new opening on ' || to_char(new.starts_at, 'Dy, Mon DD') || '.', new.id
      from public.waitlist_entries w
      where w.shop_id = new.shop_id
        and (w.service_id is null or w.service_id = new.service_id)
        and w.preferred_date = new.starts_at::date
        and w.notified_at is null;

      update public.waitlist_entries
      set notified_at = now()
      where shop_id = new.shop_id
        and (service_id is null or service_id = new.service_id)
        and preferred_date = new.starts_at::date
        and notified_at is null;
    elsif new.status = 'completed' then
      insert into public.notifications (profile_id, type, title, body, appointment_id)
      values (new.client_id, 'appointment_completed', 'Visit completed', 'Leave a review for ' || shop_name || '.', new.id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_appointment_notify on public.appointments;
create trigger on_appointment_notify
  after insert or update on public.appointments
  for each row execute procedure public.handle_appointment_notification();

-- ---------------------------------------------------------
-- 6. PAYMENTS / DEPOSITS (Stripe)
-- ---------------------------------------------------------
do $$ begin
  create type payment_status as enum ('not_required', 'pending', 'paid', 'refunded', 'failed');
exception when duplicate_object then null; end $$;

alter table public.services add column if not exists deposit_amount numeric(10, 2) not null default 0;

alter table public.appointments add column if not exists deposit_amount numeric(10, 2) not null default 0;
alter table public.appointments add column if not exists payment_status payment_status not null default 'not_required';
alter table public.appointments add column if not exists stripe_checkout_session_id text;
alter table public.appointments add column if not exists stripe_payment_intent_id text;

-- The webhook route updates payment fields using the service-role key, so
-- clients never need write access to these columns directly.

-- ---------------------------------------------------------
-- 7. WAITLIST
-- ---------------------------------------------------------
create table if not exists public.waitlist_entries (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  service_id uuid references public.services (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  preferred_date date not null,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_shop_date_idx on public.waitlist_entries (shop_id, preferred_date);

alter table public.waitlist_entries enable row level security;

create policy "Clients manage their own waitlist entries"
  on public.waitlist_entries for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "Owners can read their shop's waitlist"
  on public.waitlist_entries for select
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

