"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use inside Client Components ("use client").
 * Safe to call multiple times — @supabase/ssr reuses the underlying client.
 *
 * Note: intentionally not parameterized with the Database type from
 * src/types/database.types.ts. That file is a hand-written simplification
 * (it doesn't encode foreign-key relationships), and several queries in
 * this app use PostgREST's join syntax (e.g. `services(name)`), which the
 * real generated types would model but ours don't. Swap in the real
 * generated types (see the comment at the top of database.types.ts) once
 * your schema stabilizes to get full autocomplete + type-checking back.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
