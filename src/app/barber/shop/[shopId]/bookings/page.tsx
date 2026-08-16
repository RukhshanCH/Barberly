import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppointmentActions } from "@/components/AppointmentActions/AppointmentActions";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { formatDateTime } from "@/lib/utils/date";

interface BookingsPageProps {
  params: Promise<{ shopId: string }>;
}

export default async function ShopBookingsPage({ params }: BookingsPageProps) {
  const supabase = await createClient();
  const { shopId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: shop } = await supabase.from("shops").select("*").eq("id", shopId).single();

  if (!shop) notFound();
  if (shop.owner_id !== user.id) redirect("/barber/dashboard");

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, notes, payment_status, deposit_amount, services(name), profiles(full_name, phone, no_show_count), shop_staff(full_name)"
    )
    .eq("shop_id", shop.id)
    .order("starts_at", { ascending: true });

  const { data: waitlist } = await supabase
    .from("waitlist_entries")
    .select("id, preferred_date, notified_at, profiles(full_name), services(name)")
    .eq("shop_id", shop.id)
    .order("preferred_date", { ascending: true });

  const upcoming = (appointments ?? []).filter((a) => new Date(a.starts_at) >= new Date() && a.status !== "cancelled");
  const pendingCount = (appointments ?? []).filter((a) => a.status === "pending").length;

  return (
    <section className="l-section l-container">
      <div className="dashboard-header">
        <div>
          <p className="hero__eyebrow">
            <Link href="/barber/dashboard" style={{ color: "inherit" }}>
              My Shops
            </Link>{" "}
            / Bookings
          </p>
          <h1 className="section-title" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
            {shop.name}
          </h1>
        </div>
        <Link href={`/barber/shop/${shop.id}`} className="btn btn--outline btn--sm">
          Manage services & hours
        </Link>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <p className="stat-card__value">{upcoming.length}</p>
          <p className="stat-card__label">Upcoming</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__value">{pendingCount}</p>
          <p className="stat-card__label">Awaiting confirmation</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__value">{appointments?.length ?? 0}</p>
          <p className="stat-card__label">Total bookings</p>
        </div>
      </div>

      <h2 className="section-title" style={{ fontSize: "var(--fs-lg)" }}>
        Appointments
      </h2>

      {appointments && appointments.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th className="table__head">Client</th>
              <th className="table__head">Barber</th>
              <th className="table__head">Service</th>
              <th className="table__head">When</th>
              <th className="table__head">Deposit</th>
              <th className="table__head">Status</th>
              <th className="table__head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a: any) => (
              <tr key={a.id}>
                <td className="table__cell">
                  {a.profiles?.full_name}
                  {a.profiles?.no_show_count > 0 && (
                    <div style={{ color: "var(--color-danger)", fontSize: "var(--fs-xs)" }}>
                      {a.profiles.no_show_count} past no-show{a.profiles.no_show_count === 1 ? "" : "s"}
                    </div>
                  )}
                  {a.profiles?.phone && (
                    <div style={{ color: "var(--color-ink-soft)", fontSize: "var(--fs-xs)" }}>{a.profiles.phone}</div>
                  )}
                </td>
                <td className="table__cell">{a.shop_staff?.full_name ?? "Any"}</td>
                <td className="table__cell">{a.services?.name}</td>
                <td className="table__cell" style={{ fontFamily: "var(--font-mono)" }}>
                  {formatDateTime(a.starts_at)}
                </td>
                <td className="table__cell" style={{ fontFamily: "var(--font-mono)" }}>
                  {a.deposit_amount > 0 ? `Rs ${Number(a.deposit_amount).toFixed(0)} (${a.payment_status})` : "—"}
                </td>
                <td className="table__cell">
                  <span className={`badge badge--role-${a.status === "cancelled" ? "client" : "barber"}`}>
                    {a.status}
                  </span>
                </td>
                <td className="table__cell">
                  <AppointmentActions appointmentId={a.id} status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState title="No appointments yet">
          <p>Once clients start booking, they&apos;ll show up here.</p>
        </EmptyState>
      )}

      {waitlist && waitlist.length > 0 && (
        <>
          <h2 className="section-title" style={{ fontSize: "var(--fs-lg)", marginTop: "2.5rem" }}>
            Waitlist
          </h2>
          <ul className="l-stack" style={{ gap: "0.5rem" }}>
            {waitlist.map((w: any) => (
              <li key={w.id} className="l-row l-row--between" style={{ fontSize: "var(--fs-sm)" }}>
                <span>
                  {w.profiles?.full_name} — {w.services?.name ?? "any service"}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-ink-soft)" }}>
                  {new Date(w.preferred_date).toLocaleDateString()} {w.notified_at ? "· notified" : ""}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
