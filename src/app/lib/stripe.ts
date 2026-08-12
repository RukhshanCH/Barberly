import Stripe from "stripe";

// Lazily constructed so the app doesn't crash at import time in
// environments where Stripe isn't configured yet (e.g. before a barber
// has any paid deposits set up). Routes that need it call getStripe().
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local to enable deposit payments."
    );
  }
  return new Stripe(key, { apiVersion: "2024-06-20" });
}
