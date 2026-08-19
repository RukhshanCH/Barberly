import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";
import { NotificationBell } from "@/components/NotificationBell/NotificationBell";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role: string; full_name: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="navbar">
      <div className="l-container navbar__inner">
        <Link href="/" className="navbar__brand">
          <span className="navbar__brand-mark">✂</span> Barberly
        </Link>

        <nav className="navbar__links">
          <Link href="/" className="navbar__link">
            Find a shop
          </Link>
          {profile?.role === "barber" && (
            <Link href="/barber/dashboard" className="navbar__link">
              My Shops
            </Link>
          )}
          {profile?.role === "barber" && (
            <Link href="/barber/payouts" className="navbar__link">
              Payouts
            </Link>
          )}
          {profile?.role === "client" && (
            <Link href="/appointments" className="navbar__link">
              My appointments
            </Link>
          )}
          {profile?.role === "client" && (
            <Link href="/favorites" className="navbar__link">
              Favorites
            </Link>
          )}
          {user && <NotificationBell userId={user.id} />}
        </nav>

        <div className="navbar__actions">
          {user && profile ? (
            <>
              <span className={`badge badge--role-${profile.role}`}>{profile.role}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn--outline btn--sm">
                Log in
              </Link>
              <Link href="/signup" className="btn btn--primary btn--sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
