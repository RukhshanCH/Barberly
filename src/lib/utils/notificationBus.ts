// Tiny same-tab event bus so the navbar's unread badge can update the
// instant notifications are marked read, without waiting on a page
// refresh or depending solely on Supabase Realtime (which needs the
// `notifications` table added to the `supabase_realtime` publication —
// see supabase/upgrades-3.sql — and only reflects other tabs/devices).
const EVENT_NAME = "barberly:notifications-read";

export function announceNotificationsRead(count: number) {
  if (typeof window === "undefined" || count <= 0) return;
  window.dispatchEvent(new CustomEvent<number>(EVENT_NAME, { detail: count }));
}

export function onNotificationsRead(handler: (count: number) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<number>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
