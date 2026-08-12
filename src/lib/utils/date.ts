export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function formatTime(time: string | null): string {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Builds a list of appointment-start-time candidates for a given day,
 * based on the shop's open/close time and service duration, then filters
 * out any that collide with existing appointments.
 */
export function buildTimeSlots(params: {
  date: Date;
  openTime: string; // "09:00:00"
  closeTime: string; // "18:00:00"
  durationMinutes: number;
  stepMinutes?: number;
  existing: { starts_at: string; ends_at: string }[];
}): { label: string; startsAt: Date; endsAt: Date }[] {
  const { date, openTime, closeTime, durationMinutes, existing } = params;
  const step = params.stepMinutes ?? 30;

  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(openH, openM, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(closeH, closeM, 0, 0);

  const slots: { label: string; startsAt: Date; endsAt: Date }[] = [];
  let cursor = new Date(dayStart);

  while (cursor.getTime() + durationMinutes * 60000 <= dayEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60000);

    const overlaps = existing.some((a) => {
      const existingStart = new Date(a.starts_at).getTime();
      const existingEnd = new Date(a.ends_at).getTime();
      return slotStart.getTime() < existingEnd && slotEnd.getTime() > existingStart;
    });

    if (!overlaps && slotStart.getTime() > Date.now()) {
      slots.push({
        label: slotStart.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
        startsAt: slotStart,
        endsAt: slotEnd,
      });
    }

    cursor = new Date(cursor.getTime() + step * 60000);
  }

  return slots;
}
