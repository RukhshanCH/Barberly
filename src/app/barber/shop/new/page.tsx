"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button/Button";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewShopPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
    });
  }, [router, supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const slug = `${slugify(name)}-${user.id.slice(0, 6)}`;

    const { data, error: insertError } = await supabase
      .from("shops")
      .insert({
        owner_id: user.id,
        name,
        slug,
        description: description || null,
        address,
        city,
        area: area || null,
        phone: phone || null,
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(`/barber/shop/${data.id}`);
  }

  return (
    <section className="l-section l-container" style={{ maxWidth: 560 }}>
      <h1 className="section-title section-title--with-rule">List your shop</h1>
      <p style={{ color: "var(--color-ink-soft)", marginTop: "1rem" }}>
        Add the basics now — you can add services and hours right after.
      </p>

      <form className="form" style={{ marginTop: "1.5rem" }} onSubmit={handleSubmit}>
        <div className="form__group">
          <label className="form__label" htmlFor="name">
            Shop name
          </label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="form__group">
          <label className="form__label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's your shop known for?"
          />
        </div>

        <div className="form__group">
          <label className="form__label" htmlFor="address">
            Street address
          </label>
          <input id="address" className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>

        <div className="form__row">
          <div className="form__group">
            <label className="form__label" htmlFor="city">
              City
            </label>
            <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div className="form__group">
            <label className="form__label" htmlFor="area">
              Area / neighborhood
            </label>
            <input id="area" className="input" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
        </div>

        <div className="form__group">
          <label className="form__label" htmlFor="phone">
            Phone
          </label>
          <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {error && <p className="form__error">{error}</p>}

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Creating..." : "Create shop"}
        </Button>
      </form>
    </section>
  );
}
