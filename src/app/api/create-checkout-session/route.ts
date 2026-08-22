import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafepay, getSafepayPublicKey, SAFEPAY_INTENT } from "@/app/lib/safepay";

/**
 * Creates a pending appointment covering one or more services + a Safepay
 * Checkout session for their combined deposit, then hands back the
 * Checkout URL for the browser to redirect to. The appointment is only
 * ever marked "paid" by the /api/safepay-webhook route (server-to-server),
 * never by this route or the browser, so a client can't fake payment by
 * hitting the success_url directly.
 *
 * Every deposit collects into Barberly's own single Safepay account —
 * there's no per-barber payout split here (see supabase/upgrades-6.sql
 * for why). Barbers are paid out manually; see /admin/payouts.
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
    supabase.from("shops").select("id, name").eq("id", shopId).single(),
    supabase.from("services").select("id, name, price, duration_minutes, deposit_amount").in("id", serviceIds).eq("shop_id", shopId),
  ]);

  if (!shop || !services || services.length !== serviceIds.length) {
    return NextResponse.json({ error: "Shop or one of the selected services was not found." }, { status: 404 });
  }

  // Keep the client's chosen order so the first service they picked stays
  // the "primary" one stored on appointments.service_id.
  const orderedServices = serviceIds.map((id) => services.find((s) => s.id === id)!);
  const totalDeposit = orderedServices.reduce((sum, s) => sum + (Number(s.deposit_amount) || 0), 0);

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
      payment_provider: "safepay",
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
    const safepay = getSafepay();
    const origin = new URL(request.url).origin;
    const depositServiceNames = orderedServices
      .filter((s) => Number(s.deposit_amount) > 0)
      .map((s) => s.name)
      .join(" + ");

    // Step 1: create the payment session ("tracker").
    const sessionResponse = await safepay.payments.session.setup({
      merchant_api_key: getSafepayPublicKey(),
      intent: SAFEPAY_INTENT,
      mode: "payment",
      entry_mode: "raw",
      currency: "PKR",
      amount: Math.round(totalDeposit * 100),
      metadata: {
        appointment_id: appointment.id,
        shop_name: shop.name,
        services: depositServiceNames,
      },
    });

    const trackerToken: string | undefined = sessionResponse?.data?.tracker?.token;
    if (!trackerToken) {
      throw new Error("Safepay didn't return a tracker token — check SAFEPAY_INTENT matches your account.");
    }

    // Step 2: create a short-lived auth token for the checkout page.
    const passportResponse = await safepay.auth.passport.create();
    const authToken: string | undefined = passportResponse?.data;
    if (!authToken) {
      throw new Error("Safepay didn't return an authentication token.");
    }

    // Step 3: build the hosted Checkout URL.
    // NOTE: the SDK's return shape for this call isn't fully documented —
    // handle both "returns the URL string directly" and "returns an
    // object with a url field" until confirmed against a real sandbox run.
    const checkoutResult = safepay.checkouts.payment.create({
      tracker: trackerToken,
      tbt: authToken,
      environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      source: "hosted",
      redirect_url: `${origin}/booking/confirmation?appointment_id=${appointment.id}&tracker=${trackerToken}`,
      cancel_url: `${origin}/shops/${shopId}`,
    });
    const checkoutUrl: string | undefined =
      typeof checkoutResult === "string" ? checkoutResult : checkoutResult?.url ?? checkoutResult?.data;

    if (!checkoutUrl) {
      throw new Error("Could not build a Safepay checkout URL — check the SDK response shape in logs.");
    }

    await supabase.from("appointments").update({ safepay_tracker_token: trackerToken }).eq("id", appointment.id);

    return NextResponse.json({ appointmentId: appointment.id, checkoutUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Safepay is not configured." },
      { status: 500 }
    );
  }
}
