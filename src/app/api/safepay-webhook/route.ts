import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/app/lib/supabase/admin";

interface SafepayWebhookEvent {
  token: string;
  version: string;
  merchant_api_key: string;
  type: string;
  data: {
    tracker: string;
    amount?: number;
    metadata?: { appointment_id?: string };
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
  const appointmentId = event.data?.metadata?.appointment_id;

  if (event.type === "payment.succeeded" && appointmentId) {
    await supabase
      .from("appointments")
      .update({
        payment_status: "paid",
        status: "confirmed",
        safepay_tracker_token: event.data.tracker,
      })
      .eq("id", appointmentId);
  }

  if (event.type === "payment.failed" && appointmentId) {
    await supabase
      .from("appointments")
      .update({ status: "cancelled", payment_status: "failed" })
      .eq("id", appointmentId);
  }

  if (event.type === "payment.refunded" && appointmentId) {
    await supabase.from("appointments").update({ payment_status: "refunded" }).eq("id", appointmentId);
  }

  // Acknowledge quickly regardless — Safepay retries on non-2xx, and
  // unrecognised event types (new ones they add later) aren't errors.
  return NextResponse.json({ received: true });
}
