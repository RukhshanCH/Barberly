import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { CancelAppointmentButton } from "@/components/Ticket/CancelAppointmentButton";
import { formatDateTime } from "@/lib/utils/date";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, starts_at, status, shops(id, name), services(name)")
    .eq("client_id", user.id)
    .order("starts_at", { ascending: false });

  return (
    <section className="l-section l-container">
      <h1 className="section-title section-title--with-rule">My appointments</h1>

      {appointments && appointments.length > 0 ? (
        <div className="l-stack" style={{ marginTop: "1.5rem" }}>
          {appointments.map((a: any) => (
            <div key={a.id}>
              <div className="ticket">
                <div className="ticket__main">
                  <span className="ticket__shop">{a.shops?.name}</span>
                  <span className="ticket__service">{a.services?.name}</span>
                  <span className="ticket__time">{formatDateTime(a.starts_at)}</span>
                  <span className={`ticket__status ticket__status--${a.status}`}>{a.status}</span>
                </div>
                <div className="ticket__stub">TICKET</div>
              </div>
              <div className="l-row" style={{ marginTop: "0.6rem", justifyContent: "flex-end", gap: "0.6rem" }}>
                <Link href={`/shops/${a.shops?.id}`} className="btn btn--outline btn--sm">
                  View shop
                </Link>
                {(a.status === "pending" || a.status === "confirmed") && (
                  <CancelAppointmentButton appointmentId={a.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No appointments yet">
          <p style={{ marginBottom: "1.25rem" }}>Find a barber shop and book your first appointment.</p>
          <Link href="/" className="btn btn--primary">
            Browse shops
          </Link>
        </EmptyState>
      )}
    </section>
  );
}
