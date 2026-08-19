-- =========================================================
-- Barberly — upgrades migration #5
-- Run in the Supabase SQL editor after upgrades-4.sql.
-- Safe to re-run.
--
-- Stripe Connect: each barber gets their own connected Stripe account, so
-- deposit payments go to them (minus a platform fee) instead of all
-- landing in the platform's own Stripe balance.
--
-- One connected account per barber (profiles), not per shop — a barber
-- with multiple shops gets paid out to the same account for all of them.
-- =========================================================

alter table public.profiles add column if not exists stripe_account_id text;
alter table public.profiles add column if not exists stripe_charges_enabled boolean not null default false;

create unique index if not exists profiles_stripe_account_id_idx
  on public.profiles (stripe_account_id)
  where stripe_account_id is not null;

