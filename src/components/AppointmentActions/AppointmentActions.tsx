"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AppointmentStatus } from "@/types/database.types";

interface AppointmentActionsProps {
  appointmentId: string;
  status: AppointmentStatus;
}

const NEXT_ACTIONS: Partial<Record<AppointmentStatus, { label: string; next: AppointmentStatus }[]>> = {
  pending: [
    { label: "Confirm", next: "confirmed" },
    { label: "Decline", next: "cancelled" },
  ],
  confirmed: [
    { label: "Mark completed", next: "completed" },
    { label: "Cancel", next: "cancelled" },
  ],
};

export function AppointmentActions({ appointmentId, status }: AppointmentActionsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const actions = NEXT_ACTIONS[status];
  if (!actions) return <span style={{ color: "var(--color-ink-soft)" }}>&mdash;</span>;

  async function handleUpdate(next: AppointmentStatus) {
    setUpdating(true);
    await supabase.from("appointments").update({ status: next }).eq("id", appointmentId);
    setUpdating(false);
    router.refresh();
  }

  return (
    <div className="l-row" style={{ gap: "0.4rem" }}>
      {actions.map((action) => (
        <button
          key={action.next}
          type="button"
          className="service-list__select"
          disabled={updating}
          onClick={() => handleUpdate(action.next)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
