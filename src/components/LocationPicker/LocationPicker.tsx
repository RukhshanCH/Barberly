"use client";

import { useState } from "react";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  /** Free-text address used to look up coordinates, e.g. "12 Mall Rd, Gulberg, Lahore". */
  addressQuery: string;
}

/**
 * Lets a barber set a shop's coordinates three ways: typing them in
 * directly, using the browser's geolocation (best when they're standing in
 * the shop), or looking them up from the address via OpenStreetMap's free
 * Nominatim geocoder (no API key needed).
 *
 * Coordinates are required for the shop to show up in "Shops near me" —
 * `nearby_shops()` filters out rows where latitude/longitude are null.
 */
export function LocationPicker({ latitude, longitude, onChange, addressQuery }: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support geolocation.");
      return;
    }
    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChange(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location — check your browser's permission for this site.");
      }
    );
  }

  async function findFromAddress() {
    if (!addressQuery.trim()) {
      setError("Fill in the address, city (and area) first.");
      return;
    }
    setError(null);
    setGeocoding(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addressQuery)}`,
        { headers: { Accept: "application/json" } }
      );
      const results = await res.json();

      if (!results || results.length === 0) {
        setError("Couldn't find that address — try adjusting it, or set the pin manually.");
        return;
      }

      onChange(parseFloat(results[0].lat), parseFloat(results[0].lon));
    } catch {
      setError("Address lookup failed — try again, or set the pin manually.");
    } finally {
      setGeocoding(false);
    }
  }

  const hasCoords = latitude !== null && longitude !== null;

  return (
    <div className="l-stack" style={{ gap: "0.6rem" }}>
      <div className="form__row">
        <div className="form__group">
          <label className="form__label" htmlFor="loc-lat">
            Latitude
          </label>
          <input
            id="loc-lat"
            className="input"
            type="number"
            step="any"
            value={latitude ?? ""}
            placeholder="e.g. 31.5204"
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value), longitude)}
          />
        </div>
        <div className="form__group">
          <label className="form__label" htmlFor="loc-lng">
            Longitude
          </label>
          <input
            id="loc-lng"
            className="input"
            type="number"
            step="any"
            value={longitude ?? ""}
            placeholder="e.g. 74.3587"
            onChange={(e) => onChange(latitude, e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
      </div>

      <div className="l-row l-row--wrap" style={{ gap: "0.5rem" }}>
        <button type="button" className="btn btn--outline btn--sm" onClick={findFromAddress} disabled={geocoding}>
          {geocoding ? "Looking up..." : "Find from address"}
        </button>
        <button type="button" className="btn btn--outline btn--sm" onClick={useCurrentLocation} disabled={locating}>
          {locating ? "Locating..." : "📍 Use my current location"}
        </button>
      </div>

      {error && <p className="form__error">{error}</p>}

      <p className={hasCoords ? "form__success" : "form__hint"}>
        {hasCoords
          ? `Coordinates set (${latitude!.toFixed(5)}, ${longitude!.toFixed(5)}).`
          : "Not set yet — without coordinates this shop won't appear in \"Shops near me\" search."}
      </p>
    </div>
  );
}
