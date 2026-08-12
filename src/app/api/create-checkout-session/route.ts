import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/app/lib/stripe";

/**
 * Creates a pending appointment + a Stripe Checkout session for its
 * deposit, then hands back the Checkout URL for the browser to redirect
 * to. The appointment is only ever marked "paid" by the webhook route
 * (server-to-server), never by this route or the browser, so a client
 * can't fake payment by hitting the success_url directly.
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
  const { shopId, serviceId, staffId, startsAt, endsAt, notes } = body as {
    shopId: string;
    serviceId: string;
    staffId: string | null;
    startsAt: string;
    endsAt: string;
    notes: string | null;
  };

  const [{ data: shop }, { data: service }] = await Promise.all([
    supabase.from("shops").select("id, name").eq("id", shopId).single(),
    supabase.from("services").select("id, name, deposit_amount").eq("id", serviceId).single(),
  ]);

  if (!shop || !service) {
    return NextResponse.json({ error: "Shop or service not found." }, { status: 404 });
  }

  const depositAmount = Number(service.deposit_amount) || 0;

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      shop_id: shopId,
      service_id: serviceId,
      staff_id: staffId,
      client_id: user.id,
      starts_at: startsAt,
      ends_at: endsAt,
      notes,
      status: "pending",
      deposit_amount: depositAmount,
      payment_status: depositAmount > 0 ? "pending" : "not_required",
    })
    .select("id")
    .single();

  if (insertError || !appointment) {
    return NextResponse.json({ error: insertError?.message ?? "Could not create appointment." }, { status: 400 });
  }

  // No deposit required — nothing to check out, the appointment is booked.
  if (depositAmount <= 0) {
    return NextResponse.json({ appointmentId: appointment.id, checkoutUrl: null });
  }

  try {
    const stripe = getStripe();
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "pkr",
            unit_amount: Math.round(depositAmount * 100),
            product_data: {
              name: `Deposit — ${service.name} at ${shop.name}`,
            },
          },
          quantity: 1,
        },
      ],
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
