// Optional Supabase Edge Function: sends an email whenever a row is
// inserted into public.notifications, using Resend (https://resend.com).
//
// This is NOT required for the app to work — in-app notifications
// (the bell icon + /notifications page) work out of the box with no
// extra setup. Deploy this only if you also want emails.
//
// Setup:
//   1. supabase functions deploy notify-email
//   2. supabase secrets set RESEND_API_KEY=re_xxx NOTIFY_FROM_EMAIL="Barberly <notify@yourdomain.com>"
//   3. In the Supabase dashboard: Database -> Webhooks -> Create a new
//      webhook on public.notifications, event = INSERT, target = this
//      function's URL.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("NOTIFY_FROM_EMAIL") ?? "Barberly <notify@example.com>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: any) => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ skipped: "RESEND_API_KEY not set" }), { status: 200 });
  }

  const payload = await req.json();
  const notification = payload.record as { profile_id: string; title: string; body: string | null };

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // We only store profiles (no email column) in this schema — pull the
  // email from auth.users via the admin API.
  const { data: userData } = await supabase.auth.admin.getUserById(notification.profile_id);
  const email = userData?.user?.email;

  if (!email) {
    return new Response(JSON.stringify({ skipped: "no email on file" }), { status: 200 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: notification.title,
      text: notification.body ?? notification.title,
    }),
  });

  return new Response(JSON.stringify({ sent: res.ok }), { status: 200 });
});
