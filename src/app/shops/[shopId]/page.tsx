import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/BookingForm/BookingForm";
import { StarRating } from "@/components/StarRating/StarRating";
import { PhotoGallery } from "@/components/PhotoGallery/PhotoGallery";
import { ReviewList } from "@/components/ReviewList/ReviewList";
import { FavoriteButton } from "@/components/FavoriteButton/FavoriteButton";
import { WEEKDAY_LABELS, formatTime } from "@/lib/utils/date";

interface ShopPageProps {
  params: Promise<{ shopId: string }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const supabase = await createClient();
  const { shopId } = await params;

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .single();

  if (!shop) notFound();

  const [{ data: services }, { data: hours }, { data: staff }, { data: photos }, { data: reviews }, { data: userData }] =
    await Promise.all([
      supabase.from("services").select("*").eq("shop_id", shop.id).eq("is_active", true).order("price"),
      supabase.from("shop_hours").select("*").eq("shop_id", shop.id).order("day_of_week"),
      supabase.from("shop_staff").select("*").eq("shop_id", shop.id).eq("is_active", true),
      supabase.from("shop_photos").select("*").eq("shop_id", shop.id).order("sort_order"),
      supabase.from("reviews").select("rating, comment, created_at").eq("shop_id", shop.id).order("created_at", { ascending: false }),
      supabase.auth.getUser(),
    ]);

  let isFavorited = false;
  if (userData?.user) {
    const { data: favorite } = await supabase
      .from("favorites")
      .select("id")
      .eq("client_id", userData.user.id)
      .eq("shop_id", shop.id)
      .maybeSingle();
    isFavorited = !!favorite;
  }

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
          <div className="l-row l-row--between" style={{ alignItems: "flex-start" }}>
            <h1 className="hero__title" style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)" }}>
              {shop.name}
            </h1>
            <FavoriteButton shopId={shop.id} initialFavorited={isFavorited} isLoggedIn={!!userData?.user} />
          </div>
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
          <p style={{ marginTop: "0.35rem", fontSize: "var(--fs-xs)", color: "var(--color-ink-soft)" }}>
            Free cancellation up to {shop.cancellation_cutoff_minutes >= 120
              ? `${Math.round(shop.cancellation_cutoff_minutes / 60)} hours`
              : `${shop.cancellation_cutoff_minutes} minutes`}{" "}
            before your appointment.
          </p>

          <PhotoGallery photos={photos ?? []} />
        </div>
      </section>

      <section className="l-section l-container" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "3rem" }}>
        <div>
          <h2 className="section-title">Book an appointment</h2>
          <BookingForm
            shopId={shop.id}
            services={services ?? []}
            hours={hours ?? []}
            staff={staff ?? []}
            isLoggedIn={!!userData?.user}
          />
        </div>

        <aside className="l-stack" style={{ gap: "2.5rem" }}>
          <div>
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
          </div>

          <div>
            <h2 className="section-title">Reviews</h2>
            <ReviewList reviews={reviews ?? []} />
          </div>
        </aside>
      </section>
    </>
  );
}
