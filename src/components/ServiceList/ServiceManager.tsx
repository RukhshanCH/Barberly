"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/types/database.types";
import { Button } from "@/components/Button/Button";

interface ServiceManagerProps {
  shopId: string;
  initialServices: Service[];
}

// Postgres error code for a foreign key violation.
const FOREIGN_KEY_VIOLATION = "23503";

export function ServiceManager({ shopId, initialServices }: ServiceManagerProps) {
  const supabase = createClient();
  const [services, setServices] = useState(initialServices);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { data, error: insertError } = await supabase
      .from("services")
      .insert({ shop_id: shopId, name, duration_minutes: duration, price, deposit_amount: deposit })
      .select()
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setServices((prev) => [...prev, data]);
    setName("");
    setDuration(30);
    setPrice(0);
    setDeposit(0);
  }

  async function handleDelete(service: Service) {
    setError(null);
    setNotice(null);
    setBusyId(service.id);

    const { error: deleteError } = await supabase.from("services").delete().eq("id", service.id);

    if (!deleteError) {
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      setBusyId(null);
      return;
    }

    // This service has appointment history — Postgres correctly refuses
    // to delete it (it would orphan past bookings). Hide it instead so it
    // stops showing up for new bookings, without losing that history.
    if (deleteError.code === FOREIGN_KEY_VIOLATION) {
      const { error: hideError } = await supabase.from("services").update({ is_active: false }).eq("id", service.id);

      if (hideError) {
        setError(hideError.message);
      } else {
        setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, is_active: false } : s)));
        setNotice(`"${service.name}" has past bookings, so it's been hidden instead of deleted.`);
      }
    } else {
      setError(deleteError.message);
    }

    setBusyId(null);
  }

  async function toggleActive(service: Service) {
    setError(null);
    setBusyId(service.id);
    const nextActive = !service.is_active;

    const { error: updateError } = await supabase.from("services").update({ is_active: nextActive }).eq("id", service.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, is_active: nextActive } : s)));
    }
    setBusyId(null);
  }

  return (
    <div className="l-stack">
      {services.length === 0 ? (
        <p style={{ color: "var(--color-ink-soft)", fontSize: "var(--fs-sm)" }}>
          No services yet — add your first one below.
        </p>
      ) : (
        <ul className="service-list">
          {services.map((service) => (
            <li key={service.id} className="service-list__item">
              <div>
                <p className="service-list__name">
                  {service.name}
                  {!service.is_active && (
                    <span className="badge" style={{ marginLeft: "0.5rem" }}>
                      hidden
                    </span>
                  )}
                </p>
                {Number(service.deposit_amount) > 0 && (
                  <p className="service-list__desc">Rs {Number(service.deposit_amount).toFixed(0)} deposit required</p>
                )}
              </div>
              <div className="service-list__meta">
                <span className="service-list__duration">{service.duration_minutes} min</span>
                <span className="service-list__price">Rs {Number(service.price).toFixed(0)}</span>
                <button
                  type="button"
                  className="service-list__select"
                  onClick={() => toggleActive(service)}
                  disabled={busyId === service.id}
                >
                  {service.is_active ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="service-list__select"
                  onClick={() => handleDelete(service)}
                  disabled={busyId === service.id}
                >
                  {busyId === service.id ? "Working..." : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {notice && <p className="form__success">{notice}</p>}

      <form className="form" onSubmit={handleAdd} style={{ borderTop: "1px solid var(--color-line)", paddingTop: "1.25rem" }}>
        <div className="form__row">
          <div className="form__group">
            <label className="form__label" htmlFor="service-name">
              Service name
            </label>
            <input
              id="service-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skin fade"
              required
            />
          </div>
          <div className="form__group">
            <label className="form__label" htmlFor="service-duration">
              Duration (minutes)
            </label>
            <input
              id="service-duration"
              type="number"
              min={5}
              step={5}
              className="input"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="form__row">
          <div className="form__group">
            <label className="form__label" htmlFor="service-price">
              Price (Rs)
            </label>
            <input
              id="service-price"
              type="number"
              min={0}
              className="input"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
          </div>
          <div className="form__group">
            <label className="form__label" htmlFor="service-deposit">
              Deposit (Rs, optional)
            </label>
            <input
              id="service-deposit"
              type="number"
              min={0}
              className="input"
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
            />
          </div>
        </div>
        <p className="form__hint">
          Set a deposit above zero to require card payment (via Stripe) at booking time. Leave at 0 for pay-at-shop.
        </p>

        {error && <p className="form__error">{error}</p>}

        <Button type="submit" variant="outline" disabled={saving}>
          {saving ? "Adding..." : "Add service"}
        </Button>
      </form>
    </div>
  );
}
