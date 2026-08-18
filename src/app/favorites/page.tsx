import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShopCard } from "@/components/ShopCard/ShopCard";
import { EmptyState } from "@/components/EmptyState/EmptyState";

export default async function FavoritesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select("shop_id, created_at, shops(id, name, city, area, cover_image_url)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const shops = (favorites ?? []).map((f: any) => f.shops).filter(Boolean);
  const shopIds = shops.map((s: any) => s.id);

  const ratingByShop = new Map<string, { avg: number; count: number }>();
  if (shopIds.length > 0) {
    const { data: reviews } = await supabase.from("reviews").select("shop_id, rating").in("shop_id", shopIds);
    const sums = new Map<string, { total: number; count: number }>();
    for (const r of reviews ?? []) {
      const entry = sums.get(r.shop_id) ?? { total: 0, count: 0 };
      entry.total += r.rating;
      entry.count += 1;
      sums.set(r.shop_id, entry);
    }
    for (const [shopId, { total, count }] of sums) {
      ratingByShop.set(shopId, { avg: total / count, count });
    }
  }

  return (
    <section className="l-section l-container">
      <h1 className="section-title section-title--with-rule">My favorite shops</h1>

      {shops.length > 0 ? (
        <div className="l-grid" style={{ marginTop: "1.5rem" }}>
          {shops.map((shop: any) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              rating={ratingByShop.get(shop.id)?.avg ?? null}
              reviewCount={ratingByShop.get(shop.id)?.count ?? 0}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No favorites yet">
          <p>Save a shop from its page and it&apos;ll show up here for quick rebooking.</p>
        </EmptyState>
      )}
    </section>
  );
}
