"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointmentId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button type="button" className="btn btn--danger btn--sm" onClick={handleCancel} disabled={loading}>
      {loading ? "Cancelling..." : "Cancel"}
    </button>
  );
}
