interface StarRatingProps {
  value: number; // 0-5, can be fractional
  outOfFive?: number;
}

export function StarRating({ value }: StarRatingProps) {
  const rounded = Math.round(value);
  return (
    <span className="star-rating" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < rounded ? "star-rating__star" : "star-rating__star star-rating__star--empty"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}
