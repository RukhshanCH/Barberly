"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button/Button";

const OPTIONS = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
];

export function CancellationPolicyForm({ shopId, initialMinutes }: { shopId: string; initialMinutes: number }) {
  const supabase = createClient();
  const [minutes, setMinutes] = useState(initialMinutes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from("shops").update({ cancellation_cutoff_minutes: minutes }).eq("id", shopId);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="l-stack">
      <p className="form__hint">Clients can&apos;t cancel online once an appointment is within this window.</p>
      <select className="select" value={minutes} onChange={(e) => { setMinutes(Number(e.target.value)); setSaved(false); }}>
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {saved && <p className="form__success">Saved.</p>}
      <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} style={{ width: "fit-content" }}>
        {saving ? "Saving..." : "Save policy"}
      </Button>
    </div>
  );
}
