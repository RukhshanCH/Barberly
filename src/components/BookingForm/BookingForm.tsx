"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Service, ShopHour, ShopStaff } from "@/types/database.types";
import { buildTimeSlots, WEEKDAY_LABELS } from "@/lib/utils/date";
import { ServiceMultiSelect } from "@/components/ServiceMultiSelect/ServiceMultiSelect";
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

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(services[0] ? [services[0].id] : []);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(ANY_STAFF);
  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);
  const [slots, setSlots] = useState<{ label: string; startsAt: Date; endsAt: Date }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ startsAt: Date; endsAt: Date } | null>(null);
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalDeposit = selectedServices.reduce((sum, s) => sum + Number(s.deposit_amount), 0);

  const todaysHours = hours.find((h) => h.day_of_week === selectedDay.getDay());

  function toggleService(service: Service) {
    setSelectedServiceIds((prev) =>
      prev.includes(service.id) ? prev.filter((id) => id !== service.id) : [...prev, service.id]
    );
  }

  useEffect(() => {
    // Intentional: whenever the service/day/staff selection changes, any
    // previously-picked slot is stale and must be cleared before the new
    // slots load below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSlot(null);
    setError(null);

    async function loadSlots() {
      if (selectedServices.length === 0 || !todaysHours || todaysHours.is_closed || !todaysHours.open_time || !todaysHours.close_time) {
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
        durationMinutes: totalDuration,
        existing: existing ?? [],
      });

      setSlots(computed);
      setLoadingSlots(false);
    }

    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceIds.join(","), selectedDay, selectedStaffId, shopId]);

  async function handleBook() {
    if (selectedServices.length === 0 || !selectedSlot) return;
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
        serviceIds: selectedServiceIds,
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
  const noSlotsAvailable = !loadingSlots && dayIsOpen && selectedServices.length > 0 && slots.length === 0;

  return (
    <div className="l-stack">
      <div>
        <h3 className="form__label">1. Choose your services</h3>
        <p className="form__hint" style={{ marginBottom: "0.5rem" }}>
          Pick as many as you like — the total time and price update as you go.
        </p>
        <ServiceMultiSelect services={services} selectedIds={selectedServiceIds} onToggle={toggleService} />
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
        {selectedServices.length === 0 && <p className="slot-grid__empty">Select at least one service first.</p>}
        {selectedServices.length > 0 && loadingSlots && <p className="slot-grid__empty">Loading available times&hellip;</p>}
        {selectedServices.length > 0 && !loadingSlots && !dayIsOpen && (
          <p className="slot-grid__empty">Closed on {WEEKDAY_LABELS[selectedDay.getDay()]}s.</p>
        )}
        {noSlotsAvailable && (
          <WaitlistForm
            shopId={shopId}
            serviceId={selectedServiceIds.length === 1 ? selectedServiceIds[0] : null}
            date={selectedDay}
          />
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
        disabled={selectedServices.length === 0 || !selectedSlot || submitting}
        onClick={handleBook}
      >
        {submitting
          ? "Booking..."
          : !isLoggedIn
            ? "Log in to book"
            : totalDeposit > 0
              ? `Pay Rs ${totalDeposit.toFixed(0)} deposit & book`
              : "Confirm appointment"}
      </Button>
    </div>
  );
}
