import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { CancelAppointmentButton } from "@/components/Ticket/CancelAppointmentButton";
import { ReviewForm } from "@/components/ReviewForm/ReviewForm";
import { formatDateTime } from "@/lib/utils/date";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, status, payment_status, deposit_amount, shops(id, name, cancellation_cutoff_minutes), services(name), shop_staff(full_name)"
    )
    .eq("client_id", user.id)
    .order("starts_at", { ascending: false });

  const appointmentIds = (appointments ?? []).map((a: any) => a.id);

  const { data: appointmentServices } = appointmentIds.length
    ? await supabase
      .from("appointment_services")
      .select("appointment_id, services(name)")
      .in("appointment_id", appointmentIds)
    : { data: [] as any[] };

  const serviceNamesByAppointment = new Map<string, string[]>();
  for (const row of appointmentServices ?? []) {
    const name = (row as any).services?.name;
    if (!name) continue;
    const list = serviceNamesByAppointment.get(row.appointment_id) ?? [];
    list.push(name);
    serviceNamesByAppointment.set(row.appointment_id, list);
  }

  const completedIds = (appointments ?? []).filter((a: any) => a.status === "completed").map((a: any) => a.id);

  const { data: existingReviews } = completedIds.length
    ? await supabase.from("reviews").select("appointment_id").in("appointment_id", completedIds)
    : { data: [] as { appointment_id: string | null }[] };

  const reviewedIds = new Set((existingReviews ?? []).map((r) => r.appointment_id));

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
                  <span className="ticket__service">
                    {(serviceNamesByAppointment.get(a.id) ?? [a.services?.name]).filter(Boolean).join(" + ")}
                  </span>
                  {a.shop_staff?.full_name && (
                    <span className="ticket__time">with {a.shop_staff.full_name}</span>
                  )}
                  <span className="ticket__time">{formatDateTime(a.starts_at)}</span>
                  <span className={`ticket__status ticket__status--${a.status}`}>{a.status}</span>
                  {a.deposit_amount > 0 && (
                    <span className="ticket__time">
                      Deposit: Rs {Number(a.deposit_amount).toFixed(0)} ({a.payment_status})
                    </span>
                  )}
                </div>
                <div className="ticket__stub">TICKET</div>
              </div>
              <div className="l-row" style={{ marginTop: "0.6rem", justifyContent: "flex-end", gap: "0.6rem" }}>
                <Link href={`/shops/${a.shops?.id}`} className="btn btn--outline btn--sm">
                  View shop
                </Link>
                {(a.status === "pending" || a.status === "confirmed") && (
                  <CancelAppointmentButton
                    appointmentId={a.id}
                    startsAt={a.starts_at}
                    cancellationCutoffMinutes={a.shops?.cancellation_cutoff_minutes ?? 120}
                  />
                )}
              </div>
              {a.status === "completed" && !reviewedIds.has(a.id) && (
                <div style={{ marginTop: "0.75rem", padding: "1rem", border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)" }}>
                  <ReviewForm appointmentId={a.id} shopId={a.shops?.id} />
                </div>
              )}
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
