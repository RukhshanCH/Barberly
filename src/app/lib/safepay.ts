// Thin wrapper around Safepay's official Node SDK (@sfpy/node-core).
//
// ⚠️ VERIFY BEFORE TRUSTING THIS INTEGRATION — Safepay's own documentation
// disagrees with itself. Their docs site (safepay-docs.netlify.app) shows
// methods like `safepay.payments.session.setup(...)` and
// `safepay.auth.passport.create(...)`, but the README published with the
// npm package itself (npmjs.com/package/@sfpy/node-core, the version this
// code actually installs) shows a different shape entirely, e.g.
// `safepay.customers.object.create(...)`. I could not resolve which is
// current for the installed version without running it — do this before
// relying on any of this in production:
//   1. npm install, then read node_modules/@sfpy/node-core/README.md and
//      any .d.ts files directly — that's the actual contract you're
//      calling, more trustworthy than either docs page.
//   2. Run a full sandbox booking end-to-end and confirm each step
//      (session.setup, auth.passport.create, checkouts.payment.create)
//      returns what this code expects — the method/field names in
//      create-checkout-session/route.ts may need small corrections.
//
// Also unconfirmed: the `intent` value below. Every doc example uses
// "CYBERSOURCE", but which processor is actually active on your merchant
// account is something only your Safepay dashboard or their support team
// can confirm — set SAFEPAY_INTENT in your env if yours is "MPGS" instead.
import Safepay from "@sfpy/node-core";

export const SAFEPAY_INTENT = process.env.SAFEPAY_INTENT || "CYBERSOURCE";

export function getSafepay() {
  const key = process.env.SAFEPAY_SECRET_KEY;
  if (!key) {
    throw new Error("SAFEPAY_SECRET_KEY is not set. Add it to .env.local to enable deposit payments.");
  }

  const host =
    process.env.SAFEPAY_HOST ||
    (process.env.NODE_ENV === "production" ? "https://api.getsafepay.com" : "https://sandbox.api.getsafepay.com");

  // Safepay's SDK exports a factory function you call with (secretKey,
  // options) — not a class you `new` — per their docs:
  //   const safepay = require('@sfpy/node-core')('KEY', { authType, host })
  return new Safepay(key, { authType: "secret", host });
}

export function getSafepayPublicKey() {
  const publicKey = process.env.SAFEPAY_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("SAFEPAY_PUBLIC_KEY is not set. Add it to .env.local to enable deposit payments.");
  }
  return publicKey;
}
