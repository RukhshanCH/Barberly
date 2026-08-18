"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { announceNotificationsRead } from "@/lib/utils/notificationBus";

// Marks any unread notifications as read once the person has actually
// opened this page, then tells the navbar bell (same tab, instantly — see
// notificationBus.ts) so the badge clears without a refresh.
export function MarkReadOnLoad({ ids }: { ids: string[] }) {
  const supabase = createClient();

  useEffect(() => {
    if (ids.length === 0) return;

    let cancelled = false;

    supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids)
      .then(({ error }) => {
        if (!error && !cancelled) announceNotificationsRead(ids.length);
      });

    return () => {
      cancelled = true;
    };
  }, [ids, supabase]);

  return null;
}
