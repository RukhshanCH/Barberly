"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button/Button";

export function MarkPaidOutButton({ appointmentIds }: { appointmentIds: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/mark-paid-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentIds }),
    });

    setLoading(false);

    if (!res.ok) {
      const result = await res.json();
      setError(result.error ?? "Something went wrong.");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? "Marking..." : `Mark ${appointmentIds.length} as paid out`}
      </Button>
      {error && <p className="form__error" style={{ marginTop: "0.4rem" }}>{error}</p>}
    </div>
  );
}
