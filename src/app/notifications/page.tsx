import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { MarkReadOnLoad } from "./MarkReadOnLoad";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <section className="l-section l-container" style={{ maxWidth: 640 }}>
      <h1 className="section-title section-title--with-rule">Notifications</h1>

      {notifications && notifications.length > 0 ? (
        <>
          <MarkReadOnLoad ids={notifications.filter((n) => !n.read_at).map((n) => n.id)} />
          <ul className="l-stack" style={{ marginTop: "1.5rem", gap: "0.75rem" }}>
            {notifications.map((n) => (
              <li
                key={n.id}
                style={{
                  padding: "1rem",
                  background: n.read_at ? "transparent" : "var(--color-white)",
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <p style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>{n.title}</p>
                {n.body && <p style={{ marginTop: "0.25rem", fontSize: "var(--fs-sm)", color: "var(--color-ink-soft)" }}>{n.body}</p>}
                <p style={{ marginTop: "0.35rem", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--color-ink-soft)" }}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState title="Nothing yet">
          <p>Booking updates and waitlist openings will show up here.</p>
        </EmptyState>
      )}
    </section>
  );
}
