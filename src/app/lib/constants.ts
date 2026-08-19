// The cut Barberly keeps from each deposit payment, taken automatically
// via Stripe Connect's application_fee_amount — the rest transfers to the
// barber's connected Stripe account. Only applies to deposits; the full
// service price is still settled directly between barber and client
// (cash/card at the shop), so this fee never touches that amount.
export const PLATFORM_FEE_PERCENT = 5;
