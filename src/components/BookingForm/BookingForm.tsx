"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Service, ShopHour, ShopStaff } from "@/types/database.types";
import { buildTimeSlots, WEEKDAY_LABELS } from "@/lib/utils/date";
import { ServiceList } from "@/components/ServiceList/ServiceList";
import { WaitlistForm } from "@/components/WaitlistForm/WaitlistForm";
import { Button } from "@/components/Button/Button";

interface BookingFormProps {
  shopId: string;
  services: Service[];
  hours: ShopHour[];
  staff: ShopStaff[];
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

const ANY_STAFF = "any";

export function BookingForm({ shopId, services, hours, staff, isLoggedIn }: BookingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const days = useMemo(() => nextNDays(14), []);
  const activeStaff = staff.filter((s) => s.is_active);

  const [selectedService, setSelectedService] = useState<Service | null>(services[0] ?? null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(ANY_STAFF);
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

      // A specific barber's slots only collide with that barber's own
      // appointments. "Any available" is treated as its own calendar
      // (appointments booked without a specific staff member).
      let query = supabase
        .from("appointments")
        .select("starts_at, ends_at")
        .eq("shop_id", shopId)
        .gte("starts_at", dayStart.toISOString())
        .lte("starts_at", dayEnd.toISOString())
        .neq("status", "cancelled");

      query = selectedStaffId === ANY_STAFF ? query.is("staff_id", null) : query.eq("staff_id", selectedStaffId);

      const { data: existing } = await query;

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
  }, [selectedService?.id, selectedDay, selectedStaffId, shopId]);

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

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId,
        serviceId: selectedService.id,
        staffId: selectedStaffId === ANY_STAFF ? null : selectedStaffId,
        startsAt: selectedSlot.startsAt.toISOString(),
        endsAt: selectedSlot.endsAt.toISOString(),
        notes: notes || null,
      }),
    });

    const result = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/appointments"), 900);
  }

  if (success) {
    return <p className="form__success">Booked! Redirecting to your appointments&hellip;</p>;
  }

  const dayIsOpen = !!todaysHours && !todaysHours.is_closed;
  const noSlotsAvailable = !loadingSlots && dayIsOpen && slots.length === 0;

  return (
    <div className="l-stack">
      <div>
        <h3 className="form__label">1. Choose a service</h3>
        <ServiceList services={services} selectedId={selectedService?.id ?? null} onSelect={setSelectedService} />
        {selectedService && Number(selectedService.deposit_amount) > 0 && (
          <p className="form__hint" style={{ marginTop: "0.5rem" }}>
            This service requires a Rs {Number(selectedService.deposit_amount).toFixed(0)} deposit, paid by card at
            checkout.
          </p>
        )}
      </div>

      {activeStaff.length > 0 && (
        <div>
          <h3 className="form__label">2. Choose a barber</h3>
          <div className="day-picker">
            <button
              type="button"
              className={selectedStaffId === ANY_STAFF ? "day-picker__day day-picker__day--active" : "day-picker__day"}
              onClick={() => setSelectedStaffId(ANY_STAFF)}
            >
              <span className="day-picker__date" style={{ fontSize: "var(--fs-sm)" }}>
                Any available
              </span>
            </button>
            {activeStaff.map((member) => (
              <button
                key={member.id}
                type="button"
                className={selectedStaffId === member.id ? "day-picker__day day-picker__day--active" : "day-picker__day"}
                onClick={() => setSelectedStaffId(member.id)}
              >
                <span className="day-picker__date" style={{ fontSize: "var(--fs-sm)" }}>
                  {member.full_name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="form__label">{activeStaff.length > 0 ? "3" : "2"}. Choose a day</h3>
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
        <h3 className="form__label">{activeStaff.length > 0 ? "4" : "3"}. Choose a time</h3>
        {loadingSlots && <p className="slot-grid__empty">Loading available times&hellip;</p>}
        {!loadingSlots && !dayIsOpen && (
          <p className="slot-grid__empty">Closed on {WEEKDAY_LABELS[selectedDay.getDay()]}s.</p>
        )}
        {noSlotsAvailable && selectedService && (
          <WaitlistForm shopId={shopId} serviceId={selectedService.id} date={selectedDay} />
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
        {submitting
          ? "Booking..."
          : !isLoggedIn
          ? "Log in to book"
          : selectedService && Number(selectedService.deposit_amount) > 0
          ? `Pay Rs ${Number(selectedService.deposit_amount).toFixed(0)} deposit & book`
          : "Confirm appointment"}
      </Button>
    </div>
  );
}
