"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ShopStaff } from "@/types/database.types";
import { Button } from "@/components/Button/Button";

interface StaffManagerProps {
  shopId: string;
  initialStaff: ShopStaff[];
}

export function StaffManager({ shopId, initialStaff }: StaffManagerProps) {
  const supabase = createClient();
  const [staff, setStaff] = useState(initialStaff);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { data, error: insertError } = await supabase
      .from("shop_staff")
      .insert({ shop_id: shopId, full_name: name })
      .select()
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setStaff((prev) => [...prev, data]);
    setName("");
  }

  async function toggleActive(member: ShopStaff) {
    const previous = staff;
    setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, is_active: !s.is_active } : s)));
    const { error: updateError } = await supabase
      .from("shop_staff")
      .update({ is_active: !member.is_active })
      .eq("id", member.id);
    if (updateError) {
      setStaff(previous);
      setError(updateError.message);
    }
  }

  async function handleRemove(id: string) {
    const previous = staff;
    setStaff((prev) => prev.filter((s) => s.id !== id));
    const { error: deleteError } = await supabase.from("shop_staff").delete().eq("id", id);
    if (deleteError) {
      setStaff(previous);
      setError(deleteError.message);
    }
  }

  return (
    <div className="l-stack">
      {staff.length === 0 ? (
        <p style={{ color: "var(--color-ink-soft)", fontSize: "var(--fs-sm)" }}>
          No barbers added yet — clients will just book "any available" at your shop.
        </p>
      ) : (
        <ul className="service-list">
          {staff.map((member) => (
            <li key={member.id} className="service-list__item">
              <div>
                <p className="service-list__name">{member.full_name}</p>
                {!member.is_active && <p className="service-list__desc">Hidden from booking</p>}
              </div>
              <div className="service-list__meta">
                <button type="button" className="service-list__select" onClick={() => toggleActive(member)}>
                  {member.is_active ? "Hide" : "Show"}
                </button>
                <button type="button" className="service-list__select" onClick={() => handleRemove(member.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="form" onSubmit={handleAdd} style={{ borderTop: "1px solid var(--color-line)", paddingTop: "1.25rem" }}>
        <div className="form__group">
          <label className="form__label" htmlFor="staff-name">
            Barber name
          </label>
          <input
            id="staff-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ali Raza"
            required
          />
        </div>
        {error && <p className="form__error">{error}</p>}
        <Button type="submit" variant="outline" disabled={saving}>
          {saving ? "Adding..." : "Add barber"}
        </Button>
      </form>
    </div>
  );
}
