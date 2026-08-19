import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/app/lib/stripe";

/**
 * Creates (if needed) a Stripe Standard connected account for the current
 * barber, then returns a fresh Account Link URL for them to complete
 * Stripe's own onboarding (identity, bank account, etc). Safe to call
 * repeatedly — if they already have an account, it just issues a new
 * link so they can pick up onboarding where they left off.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, stripe_account_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "barber") {
    return NextResponse.json({ error: "Only barbers can connect a payout account." }, { status: 403 });
  }

  try {
    const stripe = getStripe();
    const origin = new URL(request.url).origin;

    let accountId = profile.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        email: user.email,
      });
      accountId = account.id;

      await supabase.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/barber/payouts`,
      return_url: `${origin}/barber/payouts?onboarding=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe is not configured." },
      { status: 500 }
    );
  }
}
