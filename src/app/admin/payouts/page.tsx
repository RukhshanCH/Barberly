import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { PLATFORM_FEE_PERCENT } from "@/app/lib/constants";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { MarkPaidOutButton } from "./MarkPaidOutButton";

function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export default async function AdminPayoutsPage() {
  // Check who's logged in with the normal, RLS-respecting client first.
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) redirect("/");

  // This page needs to see every barber's appointments, which RLS
  // deliberately blocks for anyone but that appointment's own client or
  // shop owner — so once we've confirmed the session belongs to an admin
  // email above, the actual data fetch uses the service-role client to
  // bypass RLS on purpose.
  const admin = createAdminClient();

  const { data: appointments } = await admin
    .from("appointments")
    .select("id, deposit_amount, payout_status, shops(id, name, owner_id)")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: true });

  const ownerIds = Array.from(
    new Set((appointments ?? []).map((a: any) => a.shops?.owner_id).filter(Boolean))
  );

  const { data: owners } = ownerIds.length
    ? await admin.from("profiles").select("id, full_name, phone").in("id", ownerIds)
    : { data: [] as { id: string; full_name: string; phone: string | null }[] };

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));
  const netFactor = 1 - PLATFORM_FEE_PERCENT / 100;

  const byOwner = new Map<
    string,
    { unpaidIds: string[]; unpaidTotal: number; paidOutTotal: number; shopNames: Set<string> }
  >();

  for (const a of (appointments ?? []) as any[]) {
    const ownerId = a.shops?.owner_id;
    if (!ownerId) continue;
    const entry = byOwner.get(ownerId) ?? { unpaidIds: [], unpaidTotal: 0, paidOutTotal: 0, shopNames: new Set<string>() };
    entry.shopNames.add(a.shops?.name ?? "Unknown shop");
    const net = Number(a.deposit_amount) * netFactor;
    if (a.payout_status === "unpaid") {
      entry.unpaidIds.push(a.id);
      entry.unpaidTotal += net;
    } else {
      entry.paidOutTotal += net;
    }
    byOwner.set(ownerId, entry);
  }

  const rows = Array.from(byOwner.entries()).sort((a, b) => b[1].unpaidTotal - a[1].unpaidTotal);

  return (
    <section className="l-section l-container">
      <h1 className="section-title section-title--with-rule">Barber payouts</h1>
      <p style={{ color: "var(--color-ink-soft)", marginTop: "1rem" }}>
        Amounts are net of Barberly&apos;s {PLATFORM_FEE_PERCENT}% platform fee. After transferring
        money to a barber yourself (bank/JazzCash/Easypaisa), mark it paid out here.
      </p>

      {rows.length === 0 ? (
        <EmptyState title="Nothing owed right now">
          <p>Paid deposits will show up here as they come in.</p>
        </EmptyState>
      ) : (
        <table className="table" style={{ marginTop: "1.5rem" }}>
          <thead>
            <tr>
              <th className="table__head">Barber</th>
              <th className="table__head">Shops</th>
              <th className="table__head">Owed now</th>
              <th className="table__head">Paid out to date</th>
              <th className="table__head">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([ownerId, entry]) => {
              const owner = ownerById.get(ownerId);
              return (
                <tr key={ownerId}>
                  <td className="table__cell">
                    {owner?.full_name ?? "Unknown"}
                    {owner?.phone && (
                      <div style={{ color: "var(--color-ink-soft)", fontSize: "var(--fs-xs)" }}>{owner.phone}</div>
                    )}
                  </td>
                  <td className="table__cell">{Array.from(entry.shopNames).join(", ")}</td>
                  <td className="table__cell" style={{ fontFamily: "var(--font-mono)" }}>
                    Rs {entry.unpaidTotal.toFixed(0)}
                  </td>
                  <td className="table__cell" style={{ fontFamily: "var(--font-mono)" }}>
                    Rs {entry.paidOutTotal.toFixed(0)}
                  </td>
                  <td className="table__cell">
                    {entry.unpaidIds.length > 0 ? (
                      <MarkPaidOutButton appointmentIds={entry.unpaidIds} />
                    ) : (
                      <span style={{ color: "var(--color-ink-soft)" }}>&mdash;</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
