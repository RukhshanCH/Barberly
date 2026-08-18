"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { onNotificationsRead } from "@/lib/utils/notificationBus";

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

    // Same-tab: fires the instant MarkReadOnLoad marks notifications read
    // on the /notifications page, so the badge clears with no refresh.
    const unsubscribe = onNotificationsRead((count) => {
      setUnread((n) => Math.max(0, n - count));
    });

    // Cross-tab / cross-device: re-check the real count whenever a
    // notification is inserted or updated (e.g. marked read elsewhere).
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `profile_id=eq.${userId}` },
        () => loadCount()
      )
      .subscribe();

    return () => {
      active = false;
      unsubscribe();
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
