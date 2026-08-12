"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button/Button";

interface ReviewFormProps {
  appointmentId: string;
  shopId: string;
}

export function ReviewForm({ appointmentId, shopId }: ReviewFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("reviews").insert({
      shop_id: shopId,
      appointment_id: appointmentId,
      client_id: user.id,
      rating,
      comment: comment || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDone(true);
    router.refresh();
  }

  if (done) {
    return <p className="form__success">Thanks — your review is posted.</p>;
  }

  return (
    <div className="l-stack" style={{ gap: "0.6rem" }}>
      <div className="l-row" style={{ gap: "0.25rem" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} stars`}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.35rem", padding: 0 }}
          >
            <span className={n <= rating ? "star-rating__star" : "star-rating__star star-rating__star--empty"}>★</span>
          </button>
        ))}
      </div>
      <textarea
        className="textarea"
        placeholder="How was the cut? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="form__error">{error}</p>}
      <Button variant="outline" size="sm" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Posting..." : "Leave a review"}
      </Button>
    </div>
  );
}
