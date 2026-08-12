import Link from "next/link";
import type { Shop } from "@/types/database.types";

interface ShopCardProps {
  shop: Pick<Shop, "id" | "name" | "city" | "area" | "cover_image_url">;
  rating?: number | null;
  reviewCount?: number;
}

export function ShopCard({ shop, rating, reviewCount = 0 }: ShopCardProps) {
  return (
    <Link href={`/shops/${shop.id}`} className="shop-card">
      <div className="shop-card__media">
        {shop.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.cover_image_url} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span>{shop.name.slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div className="shop-card__body">
        <h3 className="shop-card__name">{shop.name}</h3>
        <p className="shop-card__meta">
          {shop.area ? `${shop.area}, ` : ""}
          {shop.city}
        </p>
        <div className="shop-card__footer">
          <span className="shop-card__rating">
            {rating ? `★ ${rating.toFixed(1)} (${reviewCount})` : "No reviews yet"}
          </span>
          <span className="shop-card__cta">Book &rarr;</span>
        </div>
      </div>
    </Link>
  );
}
