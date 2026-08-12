"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/types/database.types";
import { Button } from "@/components/Button/Button";

interface ServiceManagerProps {
  shopId: string;
  initialServices: Service[];
}

export function ServiceManager({ shopId, initialServices }: ServiceManagerProps) {
  const supabase = createClient();
  const [services, setServices] = useState(initialServices);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { data, error: insertError } = await supabase
      .from("services")
      .insert({ shop_id: shopId, name, duration_minutes: duration, price })
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
  }

  async function handleDelete(id: string) {
    const previous = services;
    setServices((prev) => prev.filter((s) => s.id !== id));
    const { error: deleteError } = await supabase.from("services").delete().eq("id", id);
    if (deleteError) {
      setServices(previous);
      setError(deleteError.message);
    }
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
                <p className="service-list__name">{service.name}</p>
              </div>
              <div className="service-list__meta">
                <span className="service-list__duration">{service.duration_minutes} min</span>
                <span className="service-list__price">Rs {Number(service.price).toFixed(0)}</span>
                <button type="button" className="service-list__select" onClick={() => handleDelete(service.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

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

        {error && <p className="form__error">{error}</p>}

        <Button type="submit" variant="outline" disabled={saving}>
          {saving ? "Adding..." : "Add service"}
        </Button>
      </form>
    </div>
  );
}
