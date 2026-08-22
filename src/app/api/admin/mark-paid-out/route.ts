import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";

function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/**
 * Marks a batch of appointments' deposits as paid out to their barber.
 * Restricted to ADMIN_EMAILS — see supabase/upgrades-6.sql for why this
 * exists (manual payouts instead of an automated Stripe-Connect-style
 * split). Uses the service-role client because RLS correctly has no
 * policy letting a third party update someone else's appointment.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { appointmentIds } = (await request.json()) as { appointmentIds: string[] };

  if (!Array.isArray(appointmentIds) || appointmentIds.length === 0) {
    return NextResponse.json({ error: "No appointments provided." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("appointments")
    .update({ payout_status: "paid_out", paid_out_at: new Date().toISOString() })
    .in("id", appointmentIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
