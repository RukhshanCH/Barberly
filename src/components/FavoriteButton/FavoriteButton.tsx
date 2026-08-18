"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface FavoriteButtonProps {
  shopId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
}

export function FavoriteButton({ shopId, initialFavorited, isLoggedIn }: FavoriteButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setPending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPending(false);
      router.push("/login");
      return;
    }

    if (favorited) {
      const { error } = await supabase.from("favorites").delete().eq("client_id", user.id).eq("shop_id", shopId);
      if (!error) setFavorited(false);
    } else {
      const { error } = await supabase.from("favorites").insert({ client_id: user.id, shop_id: shopId });
      if (!error) setFavorited(true);
    }

    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      className={favorited ? "favorite-btn favorite-btn--active" : "favorite-btn"}
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
    >
      <span aria-hidden="true">{favorited ? "♥" : "♡"}</span>
      {favorited ? "Saved" : "Save shop"}
    </button>
  );
}
