import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/app/lib/supabase/admin";

interface SafepayWebhookEvent {
  token: string;
  version: string;
  merchant_api_key: string;
  type: string;
  data: {
    tracker?: string;
    order_id?: string;
    amount?: number;
    [key: string]: unknown;
  };
}

/**
 * Safepay signs each webhook with an HMAC-SHA512 signature in the
 * X-SFPY-SIGNATURE header, computed over the exact raw request body — so
 * this route reads the body as text and hashes that, rather than
 * re-serializing a parsed object (which can produce a different byte
 * sequence and make a genuine webhook look "invalid").
 * https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures
 */
function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", secret).update(Buffer.from(rawBody)).digest("hex");
  // Constant-time comparison to avoid leaking the signature via timing.
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-sfpy-signature");

  if (!verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as SafepayWebhookEvent;
  const supabase = createAdminClient();

  // We stopped sending custom `metadata` (Safepay rejected it — see
  // create-checkout-session/route.ts), so the appointment is identified
  // by whichever of these actually comes back in the payload. order_id is
  // the one we're most confident in (it's the field we passed ourselves
  // at checkout time); tracker is a fallback since we already stored
  // safepay_tracker_token on the appointment when the session was
  // created. If NEITHER of these matches what you see in a real webhook
  // delivery (check Safepay Dashboard → Developers → Endpoints → your
  // endpoint → recent deliveries for the actual payload), that's the
  // next thing to fix here.
  const appointmentId = event.data?.order_id;
  const trackerToken = event.data?.tracker;

  async function findAppointmentId(): Promise<string | null> {
    if (appointmentId) return appointmentId;
    if (!trackerToken) return null;
    const { data } = await supabase
      .from("appointments")
      .select("id")
      .eq("safepay_tracker_token", trackerToken)
      .maybeSingle();
    return data?.id ?? null;
  }

  if (event.type === "payment.succeeded") {
    const id = await findAppointmentId();
    if (id) {
      await supabase
        .from("appointments")
        .update({
          payment_status: "paid",
          status: "confirmed",
          ...(trackerToken ? { safepay_tracker_token: trackerToken } : {}),
        })
        .eq("id", id);
    }
  }

  if (event.type === "payment.failed") {
    const id = await findAppointmentId();
    if (id) {
      await supabase.from("appointments").update({ status: "cancelled", payment_status: "failed" }).eq("id", id);
    }
  }

  if (event.type === "payment.refunded") {
    const id = await findAppointmentId();
    if (id) {
      await supabase.from("appointments").update({ payment_status: "refunded" }).eq("id", id);
    }
  }

  // Acknowledge quickly regardless — Safepay retries on non-2xx, and
  // unrecognised event types (new ones they add later) aren't errors.
  return NextResponse.json({ received: true });
}
