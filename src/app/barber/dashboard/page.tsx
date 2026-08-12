import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppointmentActions } from "@/components/AppointmentActions/AppointmentActions";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { formatDateTime } from "@/lib/utils/date";

export default async function BarberDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "barber") redirect("/");

  const { data: shop } = await supabase.from("shops").select("*").eq("owner_id", user.id).maybeSingle();

  if (!shop) {
    return (
      <section className="l-section l-container">
        <EmptyState title="You haven't listed a shop yet">
          <p style={{ marginBottom: "1.25rem" }}>
            Create your shop profile so clients can find you and book appointments.
          </p>
          <Link href="/barber/shop/new" className="btn btn--primary">
            List your shop
          </Link>
        </EmptyState>
      </section>
    );
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, notes, services(name), profiles(full_name, phone)")
    .eq("shop_id", shop.id)
    .order("starts_at", { ascending: true });

  const upcoming = (appointments ?? []).filter((a) => new Date(a.starts_at) >= new Date() && a.status !== "cancelled");
  const pendingCount = (appointments ?? []).filter((a) => a.status === "pending").length;

  return (
    <section className="l-section l-container">
      <div className="dashboard-header">
        <div>
          <p className="hero__eyebrow">Dashboard</p>
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
              <th className="table__head">Service</th>
              <th className="table__head">When</th>
              <th className="table__head">Status</th>
              <th className="table__head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a: any) => (
              <tr key={a.id}>
                <td className="table__cell">
                  {a.profiles?.full_name}
                  {a.profiles?.phone && (
                    <div style={{ color: "var(--color-ink-soft)", fontSize: "var(--fs-xs)" }}>{a.profiles.phone}</div>
                  )}
                </td>
                <td className="table__cell">{a.services?.name}</td>
                <td className="table__cell" style={{ fontFamily: "var(--font-mono)" }}>
                  {formatDateTime(a.starts_at)}
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
    </section>
  );
}
