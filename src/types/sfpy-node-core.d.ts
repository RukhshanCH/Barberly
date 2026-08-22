// @sfpy/node-core ships no TypeScript declarations of its own (every
// official example uses plain require()/CommonJS), so without this file
// every import from it fails to type-check. This intentionally types it
// as `any` — real safety comes from the runtime checks already in
// src/app/lib/safepay.ts and the checkout/webhook routes (checking that
// expected fields actually came back before using them), not from
// compile-time types the package doesn't provide.
declare module "@sfpy/node-core" {
  const Safepay: any;
  export default Safepay;
}
