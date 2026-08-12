"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Service, ShopHour } from "@/types/database.types";
import { buildTimeSlots, WEEKDAY_LABELS } from "@/lib/utils/date";
import { ServiceList } from "@/components/ServiceList/ServiceList";
import { Button } from "@/components/Button/Button";

interface BookingFormProps {
  shopId: string;
  services: Service[];
  hours: ShopHour[];
  isLoggedIn: boolean;
}

function nextNDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

export function BookingForm({ shopId, services, hours, isLoggedIn }: BookingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const days = useMemo(() => nextNDays(14), []);
  const [selectedService, setSelectedService] = useState<Service | null>(services[0] ?? null);
  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);
  const [slots, setSlots] = useState<{ label: string; startsAt: Date; endsAt: Date }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ startsAt: Date; endsAt: Date } | null>(null);
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const todaysHours = hours.find((h) => h.day_of_week === selectedDay.getDay());

  useEffect(() => {
    setSelectedSlot(null);
    setError(null);

    async function loadSlots() {
      if (!selectedService || !todaysHours || todaysHours.is_closed || !todaysHours.open_time || !todaysHours.close_time) {
        setSlots([]);
        return;
      }

      setLoadingSlots(true);

      const dayStart = new Date(selectedDay);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDay);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: existing } = await supabase
        .from("appointments")
        .select("starts_at, ends_at")
        .eq("shop_id", shopId)
        .gte("starts_at", dayStart.toISOString())
        .lte("starts_at", dayEnd.toISOString())
        .neq("status", "cancelled");

      const computed = buildTimeSlots({
        date: selectedDay,
        openTime: todaysHours.open_time,
        closeTime: todaysHours.close_time,
        durationMinutes: selectedService.duration_minutes,
        existing: existing ?? [],
      });

      setSlots(computed);
      setLoadingSlots(false);
    }

    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService?.id, selectedDay, shopId]);

  async function handleBook() {
    if (!selectedService || !selectedSlot) return;
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("appointments").insert({
      shop_id: shopId,
      service_id: selectedService.id,
      client_id: user.id,
      starts_at: selectedSlot.startsAt.toISOString(),
      ends_at: selectedSlot.endsAt.toISOString(),
      notes: notes || null,
      status: "pending",
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/appointments"), 900);
  }

  if (success) {
    return <p className="form__success">Booked! Redirecting to your appointments&hellip;</p>;
  }

  return (
    <div className="l-stack">
      <div>
        <h3 className="form__label">1. Choose a service</h3>
        <ServiceList services={services} selectedId={selectedService?.id ?? null} onSelect={setSelectedService} />
      </div>

      <div>
        <h3 className="form__label">2. Choose a day</h3>
        <div className="day-picker">
          {days.map((day) => (
            <button
              key={day.toISOString()}
              type="button"
              className={
                day.toDateString() === selectedDay.toDateString()
                  ? "day-picker__day day-picker__day--active"
                  : "day-picker__day"
              }
              onClick={() => setSelectedDay(day)}
            >
              <span className="day-picker__weekday">{WEEKDAY_LABELS[day.getDay()].slice(0, 3)}</span>
              <span className="day-picker__date">{day.getDate()}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="form__label">3. Choose a time</h3>
        {loadingSlots && <p className="slot-grid__empty">Loading available times&hellip;</p>}
        {!loadingSlots && (!todaysHours || todaysHours.is_closed) && (
          <p className="slot-grid__empty">Closed on {WEEKDAY_LABELS[selectedDay.getDay()]}s.</p>
        )}
        {!loadingSlots && todaysHours && !todaysHours.is_closed && slots.length === 0 && (
          <p className="slot-grid__empty">No open slots left for this day.</p>
        )}
        {!loadingSlots && slots.length > 0 && (
          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                key={slot.startsAt.toISOString()}
                type="button"
                className={
                  selectedSlot?.startsAt.getTime() === slot.startsAt.getTime()
                    ? "slot-grid__slot slot-grid__slot--active"
                    : "slot-grid__slot"
                }
                onClick={() => setSelectedSlot(slot)}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form__group">
        <label className="form__label" htmlFor="notes">
          Notes for the barber (optional)
        </label>
        <textarea
          id="notes"
          className="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. skin fade, number 2 on the sides"
        />
      </div>

      {error && <p className="form__error">{error}</p>}

      <Button
        variant="primary"
        disabled={!selectedService || !selectedSlot || submitting}
        onClick={handleBook}
      >
        {submitting ? "Booking..." : isLoggedIn ? "Confirm appointment" : "Log in to book"}
      </Button>
    </div>
  );
}
