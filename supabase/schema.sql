-- =========================================================
-- Barberly database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- ENUMS ----------
do $$ begin
  create type user_role as enum ('barber', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
exception when duplicate_object then null; end $$;

-- ---------- PROFILES ----------
-- One row per auth user. Created automatically by a trigger on signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'client',
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New user')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- SHOPS ----------
create table if not exists public.shops (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  address text not null,
  city text not null,
  area text,
  latitude double precision,
  longitude double precision,
  phone text,
  cover_image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists shops_city_idx on public.shops (city);
create index if not exists shops_owner_idx on public.shops (owner_id);

alter table public.shops enable row level security;

create policy "Published shops are publicly readable"
  on public.shops for select
  using (is_published = true or owner_id = auth.uid());

create policy "Barbers can insert their own shop"
  on public.shops for insert
  with check (owner_id = auth.uid());

create policy "Owners can update their shop"
  on public.shops for update
  using (owner_id = auth.uid());

create policy "Owners can delete their shop"
  on public.shops for delete
  using (owner_id = auth.uid());

-- ---------- SERVICES ----------
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null default 30,
  price numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists services_shop_idx on public.services (shop_id);

alter table public.services enable row level security;

create policy "Services are publicly readable"
  on public.services for select
  using (true);

create policy "Owners manage services"
  on public.services for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- ---------- SHOP HOURS ----------
create table if not exists public.shop_hours (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0 = Sunday
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  unique (shop_id, day_of_week)
);

alter table public.shop_hours enable row level security;

create policy "Shop hours are publicly readable"
  on public.shop_hours for select
  using (true);

create policy "Owners manage shop hours"
  on public.shop_hours for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- ---------- APPOINTMENTS ----------
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  client_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists appointments_shop_idx on public.appointments (shop_id, starts_at);
create index if not exists appointments_client_idx on public.appointments (client_id, starts_at);

alter table public.appointments enable row level security;

create policy "Clients can read their own appointments"
  on public.appointments for select
  using (client_id = auth.uid());

create policy "Owners can read appointments for their shop"
  on public.appointments for select
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

create policy "Clients can create appointments for themselves"
  on public.appointments for insert
  with check (client_id = auth.uid());

create policy "Clients can update (cancel) their own appointments"
  on public.appointments for update
  using (client_id = auth.uid());

create policy "Owners can update appointments for their shop"
  on public.appointments for update
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- ---------- REVIEWS (future-facing, included now since it's low-cost) ----------
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  appointment_id uuid unique references public.appointments (id) on delete set null,
  client_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "Clients can leave reviews for their own completed appointments"
  on public.reviews for insert
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.client_id = auth.uid()
        and a.status = 'completed'
    )
  );

