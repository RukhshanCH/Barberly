import { StarRating } from "@/components/StarRating/StarRating";

interface ReviewListProps {
  reviews: { rating: number; comment: string | null; created_at: string }[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p style={{ color: "var(--color-ink-soft)", fontSize: "var(--fs-sm)" }}>No reviews yet.</p>;
  }

  return (
    <ul className="l-stack" style={{ gap: "1rem" }}>
      {reviews.map((review, i) => (
        <li key={i} style={{ borderBottom: "1px solid var(--color-line)", paddingBottom: "1rem" }}>
          <StarRating value={review.rating} />
          {review.comment && (
            <p style={{ marginTop: "0.4rem", fontSize: "var(--fs-sm)" }}>{review.comment}</p>
          )}
          <p style={{ marginTop: "0.3rem", fontSize: "var(--fs-xs)", color: "var(--color-ink-soft)" }}>
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
