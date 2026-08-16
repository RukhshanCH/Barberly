import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState/EmptyState";

export default async function MyShopsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "barber") redirect("/");

  const { data: shops } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (!shops || shops.length === 0) {
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

  const shopIds = shops.map((s) => s.id);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("shop_id, status, starts_at")
    .in("shop_id", shopIds);

  const statsByShop = new Map<string, { upcoming: number; pending: number }>();
  for (const shop of shops) statsByShop.set(shop.id, { upcoming: 0, pending: 0 });

  for (const a of appointments ?? []) {
    const stats = statsByShop.get(a.shop_id);
    if (!stats) continue;
    if (a.status === "pending") stats.pending += 1;
    if (new Date(a.starts_at) >= new Date() && a.status !== "cancelled") stats.upcoming += 1;
  }

  return (
    <section className="l-section l-container">
      <div className="dashboard-header">
        <div>
          <p className="hero__eyebrow">Dashboard</p>
          <h1 className="section-title" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
            My Shops
          </h1>
        </div>
        <Link href="/barber/shop/new" className="btn btn--primary btn--sm">
          + Add another shop
        </Link>
      </div>

      <div className="l-grid">
        {shops.map((shop) => {
          const stats = statsByShop.get(shop.id) ?? { upcoming: 0, pending: 0 };
          return (
            <div key={shop.id} className="shop-card" style={{ cursor: "default" }}>
              <div className="shop-card__media">
                {shop.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shop.cover_image_url}
                    alt={shop.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span>{shop.name.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="shop-card__body">
                <h3 className="shop-card__name">{shop.name}</h3>
                <p className="shop-card__meta">
                  {shop.area ? `${shop.area}, ` : ""}
                  {shop.city}
                  {!shop.is_published && (
                    <span className="badge" style={{ marginLeft: "0.5rem" }}>
                      hidden from search
                    </span>
                  )}
                </p>

                <div className="l-row" style={{ gap: "1rem", fontSize: "var(--fs-xs)", color: "var(--color-ink-soft)" }}>
                  <span>{stats.upcoming} upcoming</span>
                  <span>{stats.pending} pending</span>
                </div>

                <div className="l-row l-row--wrap" style={{ marginTop: "0.75rem", gap: "0.5rem" }}>
                  <Link href={`/barber/shop/${shop.id}/bookings`} className="btn btn--outline btn--sm">
                    View bookings
                  </Link>
                  <Link href={`/barber/shop/${shop.id}`} className="btn btn--outline btn--sm">
                    Manage
                  </Link>
                  <Link href={`/shops/${shop.id}`} className="btn btn--outline btn--sm">
                    Public page
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
