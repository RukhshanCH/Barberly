-- =========================================================
-- Barberly — upgrades migration #4
-- Run in the Supabase SQL editor after upgrades-3.sql.
-- Safe to re-run.
--
-- Fixes: deleting a service that any appointment has ever referenced
-- fails with a foreign key violation —
--   update or delete on table "services" violates foreign key
--   constraint "appointments_service_id_fkey" on table "appointments"
-- — because appointments.service_id (and now appointment_services too)
-- reference services with ON DELETE RESTRICT, which is correct: it stops
-- a delete from silently orphaning/breaking booking history.
--
-- The real fix is to stop hard-deleting services once they have booking
-- history, and hide them instead. This adds an is_active flag so the app
-- can do that: barbers can "Remove" a never-booked service (a real
-- delete) or hide a previously-booked one (still visible in past
-- bookings, just no longer offered for new ones).
-- =========================================================

alter table public.services add column if not exists is_active boolean not null default true;

