-- =========================================================
-- Barberly — upgrades migration #3
-- Run in the Supabase SQL editor after upgrades.sql and upgrades-2.sql.
-- Adds: client favorites, multi-service bookings, and makes sure
-- notification updates (not just inserts) are actually broadcast over
-- Realtime so the navbar badge can clear itself instantly.
-- =========================================================

-- ---------------------------------------------------------
-- 1. FAVORITES
-- ---------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, shop_id)
);

create index if not exists favorites_client_idx on public.favorites (client_id, created_at desc);

alter table public.favorites enable row level security;

create policy "Clients manage their own favorites"
  on public.favorites for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- ---------------------------------------------------------
-- 2. MULTI-SERVICE BOOKINGS
-- ---------------------------------------------------------
-- appointments.service_id stays as the "primary" (first-picked) service,
-- for backwards compatibility with anything that only needs one. The full
-- set of services on a booking — with a price/duration snapshot taken at
-- booking time, so later price changes don't rewrite history — lives here.
create table if not exists public.appointment_services (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  price numeric(10, 2) not null,
  duration_minutes integer not null,
  deposit_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists appointment_services_appointment_idx on public.appointment_services (appointment_id);

alter table public.appointment_services enable row level security;

create policy "Clients can read services on their own appointments"
  on public.appointment_services for select
  using (exists (select 1 from public.appointments a where a.id = appointment_id and a.client_id = auth.uid()));

create policy "Owners can read services on their shop's appointments"
  on public.appointment_services for select
  using (
    exists (
      select 1 from public.appointments a
      join public.shops s on s.id = a.shop_id
      where a.id = appointment_id and s.owner_id = auth.uid()
    )
  );

create policy "Clients can attach services to their own appointment"
  on public.appointment_services for insert
  with check (exists (select 1 from public.appointments a where a.id = appointment_id and a.client_id = auth.uid()));

-- ---------------------------------------------------------
-- 3. REALTIME FOR NOTIFICATION READ-STATE
-- ---------------------------------------------------------
-- Make sure UPDATEs (not just INSERTs) on notifications are published, so
-- the navbar bell can clear its badge the moment a notification is marked
-- read, in the same tab or any other open tab, with no page refresh.
-- Safe to re-run — Postgres just no-ops if the table's already in it.
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

alter table public.notifications replica identity full;

