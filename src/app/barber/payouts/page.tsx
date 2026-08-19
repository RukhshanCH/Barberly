import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/app/lib/stripe";
import { PLATFORM_FEE_PERCENT } from "@/app/lib/constants";
import { ConnectStripeButton } from "./ConnectStripeButton";

export default async function PayoutsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, stripe_account_id, stripe_charges_enabled")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "barber") redirect("/");

  let chargesEnabled = profile.stripe_charges_enabled;

  // If we think onboarding isn't finished yet, double-check with Stripe
  // directly rather than trust a possibly-stale flag (e.g. if the
  // account.updated webhook hasn't been set up yet — see the setup guide).
  if (profile.stripe_account_id && !chargesEnabled) {
    try {
      const stripe = getStripe();
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);
      chargesEnabled = !!account.charges_enabled;
      if (chargesEnabled) {
        await supabase.from("profiles").update({ stripe_charges_enabled: true }).eq("id", user.id);
      }
    } catch {
      // Stripe not configured or account lookup failed — fall back to the
      // stored flag, the button below will let them retry either way.
    }
  }

  return (
    <section className="l-section l-container" style={{ maxWidth: 560 }}>
      <h1 className="section-title section-title--with-rule">Payouts</h1>
      <p style={{ color: "var(--color-ink-soft)", marginTop: "1rem" }}>
        Connect a Stripe account so deposit payments from your bookings go straight to you.
        Barberly keeps a {PLATFORM_FEE_PERCENT}% platform fee on each deposit; the rest transfers
        to your account automatically. This covers every shop you run — you only connect once.
      </p>

      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)" }}>
        {!profile.stripe_account_id && (
          <>
            <p className="form__label">Not connected yet</p>
            <p style={{ color: "var(--color-ink-soft)", fontSize: "var(--fs-sm)", margin: "0.5rem 0 1rem" }}>
              Any service with a deposit above Rs 0 needs this to accept bookings — clients won&apos;t
              be able to pay a deposit until it&apos;s connected.
            </p>
            <ConnectStripeButton label="Connect Stripe" />
          </>
        )}

        {profile.stripe_account_id && !chargesEnabled && (
          <>
            <p className="form__label">Setup incomplete</p>
            <p style={{ color: "var(--color-ink-soft)", fontSize: "var(--fs-sm)", margin: "0.5rem 0 1rem" }}>
              You started connecting a Stripe account but haven&apos;t finished — Stripe still needs a
              few details (bank account, identity verification) before payouts can start.
            </p>
            <ConnectStripeButton label="Finish setup" />
          </>
        )}

        {profile.stripe_account_id && chargesEnabled && (
          <>
            <p className="form__success" style={{ margin: 0 }}>
              Connected — deposits will transfer to your account automatically.
            </p>
            <a
              href="https://dashboard.stripe.com/"
              target="_blank"
              rel="noreferrer"
              className="btn btn--outline btn--sm"
              style={{ marginTop: "1rem", display: "inline-flex" }}
            >
              Manage on Stripe &rarr;
            </a>
          </>
        )}
      </div>
    </section>
  );
}
