"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Shop } from "@/types/database.types";
import { Button } from "@/components/Button/Button";

interface ShopDetailsFormProps {
  shop: Shop;
}

export function ShopDetailsForm({ shop }: ShopDetailsFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(shop.name);
  const [description, setDescription] = useState(shop.description ?? "");
  const [address, setAddress] = useState(shop.address);
  const [city, setCity] = useState(shop.city);
  const [area, setArea] = useState(shop.area ?? "");
  const [phone, setPhone] = useState(shop.phone ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(shop.cover_image_url ?? "");
  const [isPublished, setIsPublished] = useState(shop.is_published);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSaved(false);

    const path = `${shop.id}/cover-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;

    const { error: uploadError } = await supabase.storage.from("shop-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: publicUrl } = supabase.storage.from("shop-photos").getPublicUrl(path);
    setCoverImageUrl(publicUrl.publicUrl);
    e.target.value = "";
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error: updateError } = await supabase
      .from("shops")
      .update({
        name,
        description: description || null,
        address,
        city,
        area: area || null,
        phone: phone || null,
        cover_image_url: coverImageUrl || null,
        is_published: isPublished,
      })
      .eq("id", shop.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form className="form" onSubmit={handleSave}>
      <div className="form__group">
        <label className="form__label" htmlFor="edit-cover">
          Cover image
        </label>
        {coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt="Shop cover"
            style={{
              width: "100%",
              maxWidth: 320,
              aspectRatio: "16 / 10",
              objectFit: "cover",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-line)",
              marginBottom: "0.5rem",
            }}
          />
        )}
        <label className="btn btn--outline btn--sm" style={{ width: "fit-content", cursor: "pointer" }}>
          {uploading ? "Uploading..." : coverImageUrl ? "Replace cover image" : "Upload cover image"}
          <input
            id="edit-cover"
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>

      <div className="form__group">
        <label className="form__label" htmlFor="edit-name">
          Shop name
        </label>
        <input id="edit-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="form__group">
        <label className="form__label" htmlFor="edit-description">
          Description
        </label>
        <textarea
          id="edit-description"
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form__group">
        <label className="form__label" htmlFor="edit-address">
          Street address
        </label>
        <input
          id="edit-address"
          className="input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>

      <div className="form__row">
        <div className="form__group">
          <label className="form__label" htmlFor="edit-city">
            City
          </label>
          <input id="edit-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div className="form__group">
          <label className="form__label" htmlFor="edit-area">
            Area / neighborhood
          </label>
          <input id="edit-area" className="input" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
      </div>

      <div className="form__group">
        <label className="form__label" htmlFor="edit-phone">
          Phone
        </label>
        <input id="edit-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <label className="l-row" style={{ fontSize: "var(--fs-sm)", gap: "0.5rem" }}>
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Visible in search (uncheck to temporarily hide this shop from clients)
      </label>

      {error && <p className="form__error">{error}</p>}
      {saved && <p className="form__success">Saved.</p>}

      <Button type="submit" variant="primary" size="sm" disabled={saving} style={{ width: "fit-content" }}>
        {saving ? "Saving..." : "Save shop details"}
      </Button>
    </form>
  );
}
