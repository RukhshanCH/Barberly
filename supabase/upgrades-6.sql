-- =========================================================
-- Barberly — upgrades migration #6
-- Run in the Supabase SQL editor after upgrades-5.sql.
-- Safe to re-run.
--
-- Switches deposit payments from Stripe to Safepay (Stripe doesn't
-- support Pakistan-registered payout accounts, which upgrades-5.sql's
-- Stripe Connect setup depended on).
--
-- Also drops Stripe Connect entirely in favour of a much simpler model:
-- all deposits collect into Barberly's single Safepay merchant account,
-- and barbers are paid out manually (bank transfer / JazzCash / Easypaisa)
-- on a regular schedule instead of an automatic per-booking split. The
-- payout_status columns below exist so the platform owner can track who's
-- been paid out and who's still owed, from the /admin/payouts page.
-- =========================================================

alter table public.appointments add column if not exists payment_provider text not null default 'safepay';
alter table public.appointments add column if not exists safepay_tracker_token text;

do $$ begin
  create type payout_status as enum ('unpaid', 'paid_out');
exception when duplicate_object then null; end $$;

alter table public.appointments add column if not exists payout_status payout_status not null default 'unpaid';
alter table public.appointments add column if not exists paid_out_at timestamptz;

-- The old stripe_checkout_session_id / stripe_payment_intent_id columns
-- from upgrades-5.sql are left in place untouched — harmless, and keeps
-- history intact for any bookings already paid through Stripe.

