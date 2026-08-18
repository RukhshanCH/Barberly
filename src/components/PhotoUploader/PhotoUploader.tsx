"use client";

import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ShopPhoto } from "@/types/database.types";

interface PhotoUploaderProps {
  shopId: string;
  initialPhotos: ShopPhoto[];
}

export function PhotoUploader({ shopId, initialPhotos }: PhotoUploaderProps) {
  const supabase = createClient();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    // eslint-disable-next-line react-hooks/purity -- runs inside a click/change handler, not during render
    const path = `${shopId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;

    const { error: uploadError } = await supabase.storage.from("shop-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrl } = supabase.storage.from("shop-photos").getPublicUrl(path);

    const { data: photoRow, error: insertError } = await supabase
      .from("shop_photos")
      .insert({ shop_id: shopId, url: publicUrl.publicUrl, sort_order: photos.length })
      .select()
      .single();

    setUploading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setPhotos((prev) => [...prev, photoRow]);
    e.target.value = "";
  }

  async function handleRemove(photo: ShopPhoto) {
    const previous = photos;
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));

    await supabase.from("shop_photos").delete().eq("id", photo.id);

    // Best-effort: also remove the underlying file from storage.
    const path = photo.url.split("/shop-photos/")[1];
    if (path) {
      await supabase.storage.from("shop-photos").remove([path]);
    }

    if (!previous.find((p) => p.id === photo.id)) return;
  }

  return (
    <div className="l-stack">
      {photos.length > 0 && (
        <div className="gallery">
          {photos.map((photo) => (
            <div key={photo.id} className="gallery__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.caption ?? "Shop photo"} className="gallery__image" />
              <button type="button" className="gallery__remove" onClick={() => handleRemove(photo)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="btn btn--outline btn--sm" style={{ width: "fit-content", cursor: "pointer" }}>
        {uploading ? "Uploading..." : "Upload photo"}
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: "none" }} />
      </label>
      {error && <p className="form__error">{error}</p>}
    </div>
  );
}
