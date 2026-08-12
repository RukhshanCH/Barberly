import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/BookingForm/BookingForm";
import { StarRating } from "@/components/StarRating/StarRating";
import { WEEKDAY_LABELS, formatTime } from "@/lib/utils/date";

interface ShopPageProps {
  params: { shopId: string };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const supabase = createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", params.shopId)
    .single();

  if (!shop) notFound();

  const [{ data: services }, { data: hours }, { data: reviews }, { data: userData }] = await Promise.all([
    supabase.from("services").select("*").eq("shop_id", shop.id).order("price"),
    supabase.from("shop_hours").select("*").eq("shop_id", shop.id).order("day_of_week"),
    supabase.from("reviews").select("rating, comment, created_at").eq("shop_id", shop.id),
    supabase.auth.getUser(),
  ]);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <>
      <section className="hero l-section--tight">
        <div className="l-container">
          <p className="hero__eyebrow">
            {shop.city}
            {shop.area ? ` · ${shop.area}` : ""}
          </p>
          <h1 className="hero__title" style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)" }}>
            {shop.name}
          </h1>
          {shop.description && <p className="hero__lede">{shop.description}</p>}

          <div className="l-row" style={{ marginTop: "1rem" }}>
            {avgRating && <StarRating value={avgRating} />}
            <span style={{ color: "var(--color-ink-soft)", fontSize: "var(--fs-sm)" }}>
              {reviews?.length ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "No reviews yet"}
            </span>
          </div>

          <p style={{ marginTop: "0.75rem", fontSize: "var(--fs-sm)", color: "var(--color-ink-soft)" }}>
            {shop.address}
            {shop.phone ? ` · ${shop.phone}` : ""}
          </p>
        </div>
      </section>

      <section className="l-section l-container" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "3rem" }}>
        <div>
          <h2 className="section-title">Book an appointment</h2>
          <BookingForm
            shopId={shop.id}
            services={services ?? []}
            hours={hours ?? []}
            isLoggedIn={!!userData?.user}
          />
        </div>

        <aside>
          <h2 className="section-title">Opening hours</h2>
          <ul className="l-stack" style={{ gap: "0.5rem" }}>
            {WEEKDAY_LABELS.map((label, idx) => {
              const day = hours?.find((h) => h.day_of_week === idx);
              return (
                <li key={label} className="l-row l-row--between" style={{ fontSize: "var(--fs-sm)" }}>
                  <span>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-ink-soft)" }}>
                    {!day || day.is_closed ? "Closed" : `${formatTime(day.open_time)} – ${formatTime(day.close_time)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </section>
    </>
  );
}
