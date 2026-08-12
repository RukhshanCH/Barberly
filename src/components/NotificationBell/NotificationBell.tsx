"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCount() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", userId)
        .is("read_at", null);
      if (active) setUnread(count ?? 0);
    }

    loadCount();

    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `profile_id=eq.${userId}` },
        () => setUnread((n) => n + 1)
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return (
    <Link href="/notifications" className="navbar__link" style={{ position: "relative" }}>
      Notifications
      {unread > 0 && <span className="notif-dot">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}
