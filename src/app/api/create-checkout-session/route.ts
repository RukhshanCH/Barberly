import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/app/lib/stripe";
import { PLATFORM_FEE_PERCENT } from "@/app/lib/constants";

/**
 * Creates a pending appointment covering one or more services + a Stripe
 * Checkout session for their combined deposit, then hands back the
 * Checkout URL for the browser to redirect to. The appointment is only
 * ever marked "paid" by the webhook route (server-to-server), never by
 * this route or the browser, so a client can't fake payment by hitting
 * the success_url directly.
 *
 * Deposits use Stripe Connect destination charges: the PaymentIntent is
 * created on Barberly's own account, then Stripe automatically transfers
 * the deposit — minus PLATFORM_FEE_PERCENT — to the barber's connected
 * account. The full service price is never touched by Stripe; that's
 * still settled directly between barber and client at the shop.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in to book." }, { status: 401 });
  }

  const body = await request.json();
  const { shopId, serviceIds, staffId, startsAt, endsAt, notes } = body as {
    shopId: string;
    serviceIds: string[];
    staffId: string | null;
    startsAt: string;
    endsAt: string;
    notes: string | null;
  };

  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    return NextResponse.json({ error: "Select at least one service." }, { status: 400 });
  }

  const [{ data: shop }, { data: services }] = await Promise.all([
    supabase.from("shops").select("id, name, owner_id").eq("id", shopId).single(),
    supabase.from("services").select("id, name, price, duration_minutes, deposit_amount").in("id", serviceIds).eq("shop_id", shopId),
  ]);

  if (!shop || !services || services.length !== serviceIds.length) {
    return NextResponse.json({ error: "Shop or one of the selected services was not found." }, { status: 404 });
  }

  // Keep the client's chosen order so the first service they picked stays
  // the "primary" one stored on appointments.service_id.
  const orderedServices = serviceIds.map((id) => services.find((s) => s.id === id)!);
  const totalDeposit = orderedServices.reduce((sum, s) => sum + (Number(s.deposit_amount) || 0), 0);

  // Fail fast, before creating anything, if a deposit is required but the
  // shop's owner hasn't finished connecting a payout account yet — rather
  // than leave a dangling pending appointment with nowhere for the money
  // to go.
  let ownerStripeAccountId: string | null = null;
  if (totalDeposit > 0) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", shop.owner_id)
      .single();

    if (!owner?.stripe_account_id || !owner.stripe_charges_enabled) {
      return NextResponse.json(
        { error: "This shop hasn't finished setting up payouts yet — please contact them or try again later." },
        { status: 409 }
      );
    }
    ownerStripeAccountId = owner.stripe_account_id;
  }

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      shop_id: shopId,
      service_id: orderedServices[0].id,
      staff_id: staffId,
      client_id: user.id,
      starts_at: startsAt,
      ends_at: endsAt,
      notes,
      status: "pending",
      deposit_amount: totalDeposit,
      payment_status: totalDeposit > 0 ? "pending" : "not_required",
    })
    .select("id")
    .single();

  if (insertError || !appointment) {
    return NextResponse.json({ error: insertError?.message ?? "Could not create appointment." }, { status: 400 });
  }

  const { error: servicesInsertError } = await supabase.from("appointment_services").insert(
    orderedServices.map((s) => ({
      appointment_id: appointment.id,
      service_id: s.id,
      price: s.price,
      duration_minutes: s.duration_minutes,
      deposit_amount: s.deposit_amount,
    }))
  );

  if (servicesInsertError) {
    return NextResponse.json({ error: servicesInsertError.message }, { status: 400 });
  }

  // No deposit required on any selected service — nothing to check out,
  // the appointment is booked as-is.
  if (totalDeposit <= 0) {
    return NextResponse.json({ appointmentId: appointment.id, checkoutUrl: null });
  }

  try {
    const stripe = getStripe();
    const origin = new URL(request.url).origin;

    const depositServices = orderedServices.filter((s) => Number(s.deposit_amount) > 0);
    const applicationFeeAmount = Math.round(totalDeposit * 100 * (PLATFORM_FEE_PERCENT / 100));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: depositServices.map((s) => ({
        price_data: {
          currency: "pkr",
          unit_amount: Math.round(Number(s.deposit_amount) * 100),
          product_data: {
            name: `Deposit — ${s.name} at ${shop.name}`,
          },
        },
        quantity: 1,
      })),
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: ownerStripeAccountId!,
        },
      },
      metadata: { appointment_id: appointment.id },
      success_url: `${origin}/booking/confirmation?appointment_id=${appointment.id}`,
      cancel_url: `${origin}/shops/${shopId}`,
    });

    await supabase
      .from("appointments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", appointment.id);

    return NextResponse.json({ appointmentId: appointment.id, checkoutUrl: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe is not configured." },
      { status: 500 }
    );
  }
}
