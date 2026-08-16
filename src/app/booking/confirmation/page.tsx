import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface ConfirmationPageProps {
  searchParams: Promise<{ appointment_id?: string }>;
}

export default async function BookingConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const supabase = await createClient();
  const { appointment_id: appointmentId } = await searchParams;

  const { data: appointment } = appointmentId
    ? await supabase
      .from("appointments")
      .select("id, payment_status, status, services(name), shops(name)")
      .eq("id", appointmentId)
      .maybeSingle()
    : { data: null };

  return (
    <section className="l-section l-container" style={{ maxWidth: 480, textAlign: "center" }}>
      {!appointment ? (
        <>
          <h1 className="section-title">We couldn&apos;t find that booking</h1>
          <p style={{ color: "var(--color-ink-soft)", marginTop: "0.75rem" }}>
            If you completed a payment, check <Link href="/appointments">My appointments</Link>.
          </p>
        </>
      ) : (
        <>
          <h1 className="section-title">
            {(appointment as any).payment_status === "paid" ? "Deposit received" : "Payment processing"}
          </h1>
          <p style={{ color: "var(--color-ink-soft)", marginTop: "0.75rem" }}>
            {(appointment as any).payment_status === "paid"
              ? `Your ${(appointment as any).services?.name} appointment at ${(appointment as any).shops?.name} is confirmed.`
              : "Stripe is finishing up — this usually takes a few seconds. Refresh My appointments shortly if the status hasn't updated yet."}
          </p>
          <Link href="/appointments" className="btn btn--primary" style={{ marginTop: "1.5rem", display: "inline-flex" }}>
            View my appointments
          </Link>
        </>
      )}
    </section>
  );
}
