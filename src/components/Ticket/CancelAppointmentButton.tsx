"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface CancelAppointmentButtonProps {
  appointmentId: string;
  startsAt: string;
  cancellationCutoffMinutes: number;
}

export function CancelAppointmentButton({
  appointmentId,
  startsAt,
  cancellationCutoffMinutes,
}: CancelAppointmentButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Optimistic default (no flash for the common case where cancellation is
  // still allowed); Date.now() is impure, so it's read in an effect rather
  // than during render to avoid a server/client hydration mismatch.
  const [canCancel, setCanCancel] = useState(true);

  const cutoffMs = cancellationCutoffMinutes * 60000;

  useEffect(() => {
    // Date.now() can't be read during render (impure), so the only way to
    // derive this boolean is inside an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanCancel(Date.now() <= new Date(startsAt).getTime() - cutoffMs);
  }, [startsAt, cutoffMs]);

  async function handleCancel() {
    setLoading(true);
    setError(null);

    const { data } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId)
      .select()
      .maybeSingle();

    setLoading(false);

    if (!data) {
      setError("Too close to the appointment time to cancel online — please call the shop.");
      return;
    }

    router.refresh();
  }

  if (!canCancel) {
    const hours = Math.round(cancellationCutoffMinutes / 60);
    return (
      <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-ink-soft)" }}>
        Cancellation window closed ({hours >= 1 ? `${hours}h` : `${cancellationCutoffMinutes}m`} notice required)
      </span>
    );
  }

  return (
    <div>
      <button type="button" className="btn btn--danger btn--sm" onClick={handleCancel} disabled={loading}>
        {loading ? "Cancelling..." : "Cancel"}
      </button>
      {error && <p className="form__error" style={{ marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}
