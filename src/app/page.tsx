import { createClient } from "@/lib/supabase/server";
import { ShopCard } from "@/components/ShopCard/ShopCard";
import { EmptyState } from "@/components/EmptyState/EmptyState";

interface HomePageProps {
  searchParams: { q?: string; city?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const q = searchParams.q?.trim() ?? "";
  const city = searchParams.city?.trim() ?? "";

  let query = supabase
    .from("shops")
    .select("id, name, city, area, cover_image_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("name", `%${q}%`);
  if (city) query = query.ilike("city", `%${city}%`);

  const { data: shops } = await query;

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
        </div>
      </section>

      <section className="l-section l-container">
        <h2 className="section-title section-title--with-rule">
          {shops && shops.length > 0 ? `${shops.length} shop${shops.length === 1 ? "" : "s"} found` : "Shops"}
        </h2>

        {shops && shops.length > 0 ? (
          <div className="l-grid" style={{ marginTop: "1.5rem" }}>
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
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
