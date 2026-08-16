import { createClient } from "@/lib/supabase/server";
import { ShopCard } from "@/components/ShopCard/ShopCard";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { NearMeSearch } from "@/components/NearMeSearch/NearMeSearch";

interface HomePageProps {
  searchParams: { q?: string; city?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  // Next 16 passes searchParams as a Promise; unwrap it before use.
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").toString().trim();
  const city = (params.city ?? "").toString().trim();

  let query = supabase
    .from("shops")
    .select("id, name, city, area, cover_image_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("name", `%${q}%`);
  if (city) query = query.ilike("city", `%${city}%`);

  const { data: shops } = await query;

  const shopIds = (shops ?? []).map((s) => s.id);
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
    <>
      <section className="hero">
        <div className="l-container">
          <p className="hero__eyebrow">No. 001 — Book a chair</p>
          <h1 className="hero__title">
            Find your barber<span className="hero__title-accent">.</span> Skip the walk-in queue
            <span className="hero__title-accent">.</span>
          </h1>
          <p className="hero__lede">
            Barberly lists real shops in your city with live availability, so you can pick a time
            that works and walk straight to the chair.
          </p>

          <form className="search-bar" action="/" method="get">
            <div className="search-bar__field">
              <label className="search-bar__label" htmlFor="q">
                Shop name
              </label>
              <input id="q" name="q" className="input" placeholder="e.g. Fade Room" defaultValue={q} />
            </div>
            <div className="search-bar__field">
              <label className="search-bar__label" htmlFor="city">
                City / area
              </label>
              <input id="city" name="city" className="input" placeholder="e.g. Lahore" defaultValue={city} />
            </div>
            <button type="submit" className="btn btn--primary" style={{ alignSelf: "end" }}>
              Search
            </button>
          </form>

          <div style={{ marginTop: "1.25rem" }}>
            <NearMeSearch />
          </div>
        </div>
      </section>

      <section className="l-section l-container">
        <h2 className="section-title section-title--with-rule">
          {shops && shops.length > 0 ? `${shops.length} shop${shops.length === 1 ? "" : "s"} found` : "Shops"}
        </h2>

        {shops && shops.length > 0 ? (
          <div className="l-grid" style={{ marginTop: "1.5rem" }}>
            {shops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                rating={ratingByShop.get(shop.id)?.avg ?? null}
                reviewCount={ratingByShop.get(shop.id)?.count ?? 0}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No shops match yet">
            <p>Try a different city, or clear your search to see every shop on Barberly.</p>
          </EmptyState>
        )}
      </section>
    </>
  );
}
