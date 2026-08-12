import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security — only use it
 * on the server, and only in trusted routes (e.g. the Stripe webhook,
 * which needs to update payment_status for an appointment that doesn't
 * belong to the currently-authenticated request at all).
 *
 * NEVER import this file into a Client Component or expose
 * SUPABASE_SERVICE_ROLE_KEY with the NEXT_PUBLIC_ prefix.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
