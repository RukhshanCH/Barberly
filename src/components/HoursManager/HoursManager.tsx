"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ShopHour } from "@/types/database.types";
import { WEEKDAY_LABELS } from "@/lib/utils/date";
import { Button } from "@/components/Button/Button";

interface HoursManagerProps {
  shopId: string;
  initialHours: ShopHour[];
}

interface DayDraft {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

function buildInitialDrafts(hours: ShopHour[]): DayDraft[] {
  return Array.from({ length: 7 }).map((_, day) => {
    const existing = hours.find((h) => h.day_of_week === day);
    return {
      day_of_week: day,
      open_time: existing?.open_time?.slice(0, 5) ?? "09:00",
      close_time: existing?.close_time?.slice(0, 5) ?? "18:00",
      is_closed: existing?.is_closed ?? day === 0,
    };
  });
}

export function HoursManager({ shopId, initialHours }: HoursManagerProps) {
  const supabase = createClient();
  const [drafts, setDrafts] = useState<DayDraft[]>(buildInitialDrafts(initialHours));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(day: number, patch: Partial<DayDraft>) {
    setDrafts((prev) => prev.map((d) => (d.day_of_week === day ? { ...d, ...patch } : d)));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const rows = drafts.map((d) => ({
      shop_id: shopId,
      day_of_week: d.day_of_week,
      open_time: d.is_closed ? null : `${d.open_time}:00`,
      close_time: d.is_closed ? null : `${d.close_time}:00`,
      is_closed: d.is_closed,
    }));

    const { error: upsertError } = await supabase
      .from("shop_hours")
      .upsert(rows, { onConflict: "shop_id,day_of_week" });

    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="l-stack">
      <ul className="l-stack" style={{ gap: "0.6rem" }}>
        {drafts.map((d) => (
          <li key={d.day_of_week} className="l-row l-row--between l-row--wrap">
            <span style={{ width: 100, fontSize: "var(--fs-sm)", fontWeight: 600 }}>
              {WEEKDAY_LABELS[d.day_of_week]}
            </span>
            <label className="l-row" style={{ fontSize: "var(--fs-xs)", gap: "0.4rem" }}>
              <input
                type="checkbox"
                checked={!d.is_closed}
                onChange={(e) => updateDay(d.day_of_week, { is_closed: !e.target.checked })}
              />
              Open
            </label>
            {!d.is_closed && (
              <>
                <input
                  type="time"
                  className="input"
                  style={{ width: 120 }}
                  value={d.open_time}
                  onChange={(e) => updateDay(d.day_of_week, { open_time: e.target.value })}
                />
                <span style={{ color: "var(--color-ink-soft)" }}>to</span>
                <input
                  type="time"
                  className="input"
                  style={{ width: 120 }}
                  value={d.close_time}
                  onChange={(e) => updateDay(d.day_of_week, { close_time: e.target.value })}
                />
              </>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="form__error">{error}</p>}
      {saved && <p className="form__success">Hours saved.</p>}

      <Button variant="outline" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save hours"}
      </Button>
    </div>
  );
}
