"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShopCard } from "@/components/ShopCard/ShopCard";
import type { NearbyShop } from "@/types/database.types";
import { Button } from "@/components/Button/Button";

export function NearMeSearch() {
  const supabase = createClient();
  const [shops, setShops] = useState<NearbyShop[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFindNearby() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location search.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { data, error: rpcError } = await supabase.rpc("nearby_shops", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius_km: 15,
        });

        setLoading(false);

        if (rpcError) {
          setError(rpcError.message);
          return;
        }

        setShops(data ?? []);
      },
      () => {
        setLoading(false);
        setError("Couldn't get your location — check your browser's permission for this site.");
      }
    );
  }

  return (
    <div className="near-me">
      <Button variant="outline" size="sm" onClick={handleFindNearby} disabled={loading}>
        {loading ? "Finding shops near you..." : "📍 Shops near me"}
      </Button>
      {error && <p className="form__error" style={{ marginTop: "0.75rem" }}>{error}</p>}

      {shops && (
        <div style={{ marginTop: "1.5rem" }}>
          <p className="hero__eyebrow">
            {shops.length} shop{shops.length === 1 ? "" : "s"} within 15km
          </p>
          <div className="l-grid" style={{ marginTop: "1rem" }}>
            {shops.map((shop) => (
              <div key={shop.id} style={{ position: "relative" }}>
                <ShopCard shop={shop} />
                <span className="near-me__distance">{shop.distance_km.toFixed(1)} km away</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
