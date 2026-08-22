import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_FEE_PERCENT } from "@/app/lib/constants";

export default async function PayoutsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "barber") redirect("/");

  const { data: shops } = await supabase.from("shops").select("id").eq("owner_id", user.id);
  const shopIds = (shops ?? []).map((s) => s.id);

  const { data: appointments } = shopIds.length
    ? await supabase
        .from("appointments")
        .select("deposit_amount, payout_status")
        .in("shop_id", shopIds)
        .eq("payment_status", "paid")
    : { data: [] as { deposit_amount: number; payout_status: string }[] };

  const netFactor = 1 - PLATFORM_FEE_PERCENT / 100;
  const pending = (appointments ?? []).filter((a) => a.payout_status === "unpaid");
  const paidOut = (appointments ?? []).filter((a) => a.payout_status === "paid_out");
  const pendingTotal = pending.reduce((sum, a) => sum + Number(a.deposit_amount) * netFactor, 0);
  const paidOutTotal = paidOut.reduce((sum, a) => sum + Number(a.deposit_amount) * netFactor, 0);

  return (
    <section className="l-section l-container" style={{ maxWidth: 560 }}>
      <h1 className="section-title section-title--with-rule">Payouts</h1>
      <p style={{ color: "var(--color-ink-soft)", marginTop: "1rem" }}>
        Deposit payments collect into Barberly&apos;s account and are paid out to you manually —
        there&apos;s nothing to set up here. Amounts below are after Barberly&apos;s {PLATFORM_FEE_PERCENT}%
        platform fee. Reach out if a payout looks overdue.
      </p>

      <div className="stat-row" style={{ marginTop: "1.5rem" }}>
        <div className="stat-card">
          <p className="stat-card__value">Rs {pendingTotal.toFixed(0)}</p>
          <p className="stat-card__label">Owed to you, not yet paid out</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__value">Rs {paidOutTotal.toFixed(0)}</p>
          <p className="stat-card__label">Paid out to date</p>
        </div>
      </div>
    </section>
  );
}
