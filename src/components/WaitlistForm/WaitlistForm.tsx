"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button/Button";

interface WaitlistFormProps {
  shopId: string;
  serviceId: string | null;
  date: Date;
}

export function WaitlistForm({ shopId, serviceId, date }: WaitlistFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("waitlist_entries").insert({
      shop_id: shopId,
      service_id: serviceId,
      client_id: user.id,
      preferred_date: date.toISOString().slice(0, 10),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setJoined(true);
  }

  if (joined) {
    return <p className="form__success">You&apos;re on the waitlist — we&apos;ll notify you if a slot opens up.</p>;
  }

  return (
    <div>
      <p className="slot-grid__empty">No open slots this day.</p>
      <Button variant="outline" size="sm" onClick={handleJoin} disabled={loading}>
        {loading ? "Joining..." : "Join the waitlist for this day"}
      </Button>
      {error && <p className="form__error">{error}</p>}
    </div>
  );
}
