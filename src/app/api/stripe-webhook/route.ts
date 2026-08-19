import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase/admin";

// Stripe needs the raw request body to verify the signature, so this route
// must not be run through any body-parsing middleware.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const appointmentId = session.metadata?.appointment_id;

    if (appointmentId) {
      await supabase
        .from("appointments")
        .update({
          payment_status: "paid",
          status: "confirmed",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
        })
        .eq("id", appointmentId);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const appointmentId = session.metadata?.appointment_id;
    if (appointmentId) {
      await supabase
        .from("appointments")
        .update({ status: "cancelled", payment_status: "failed" })
        .eq("id", appointmentId);
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    if (charge.payment_intent) {
      const paymentIntentId =
        typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent.id;
      await supabase
        .from("appointments")
        .update({ payment_status: "refunded" })
        .eq("stripe_payment_intent_id", paymentIntentId);
    }
  }

  // Connect: fires whenever a barber's connected account changes — most
  // importantly, once they finish Stripe's onboarding (bank account,
  // identity) and charges_enabled flips to true. Requires the webhook
  // endpoint's "Listen to events on Connected accounts" option to be on
  // (see the setup guide) — otherwise this event type never arrives, and
  // the app falls back to checking on page load instead (see
  // /barber/payouts).
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    await supabase
      .from("profiles")
      .update({ stripe_charges_enabled: !!account.charges_enabled })
      .eq("stripe_account_id", account.id);
  }

  return NextResponse.json({ received: true });
}
