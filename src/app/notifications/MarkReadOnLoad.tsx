"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Fire-and-forget: mark any unread notifications as read once the person
// has actually opened this page.
export function MarkReadOnLoad({ ids }: { ids: string[] }) {
  const supabase = createClient();

  useEffect(() => {
    if (ids.length === 0) return;
    supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids).then();
  }, [ids, supabase]);

  return null;
}
