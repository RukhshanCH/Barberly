"use client";

import { useState } from "react";
import { Button } from "@/components/Button/Button";

export function ConnectStripeButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/stripe/connect-account", { method: "POST" });
    const result = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(result.error ?? "Something went wrong.");
      return;
    }

    window.location.href = result.url;
  }

  return (
    <div>
      <Button variant="primary" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? "Redirecting to Stripe..." : label}
      </Button>
      {error && <p className="form__error" style={{ marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}
