"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database.types";
import { Button } from "@/components/Button/Button";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<UserRole>("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          router.push(role === "barber" ? "/barber/dashboard" : "/");
          router.refresh();
        } else {
          setNotice("Check your inbox to confirm your email, then log in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-card__title">{mode === "signup" ? "Create an account" : "Welcome back"}</h1>
      <p className="auth-card__subtitle">
        {mode === "signup"
          ? "Set up your account as a barber or a client."
          : "Log in to book a chair or manage your shop."}
      </p>

      <form className="form auth-card__form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div className="form__group">
            <label className="form__label">I am a...</label>
            <div className="role-toggle">
              <button
                type="button"
                className={role === "client" ? "role-toggle__option role-toggle__option--active" : "role-toggle__option"}
                onClick={() => setRole("client")}
              >
                Client
              </button>
              <button
                type="button"
                className={role === "barber" ? "role-toggle__option role-toggle__option--active" : "role-toggle__option"}
                onClick={() => setRole("barber")}
              >
                Barber
              </button>
            </div>
            <p className="form__hint">
              {role === "barber"
                ? "You'll be able to create and manage a shop after signing up."
                : "You'll be able to search shops and book appointments."}
            </p>
          </div>
        )}

        {mode === "signup" && (
          <div className="form__group">
            <label className="form__label" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form__group">
          <label className="form__label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form__group">
          <label className="form__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="form__error">{error}</p>}
        {notice && <p className="form__success">{notice}</p>}

        <Button type="submit" variant="primary" fullWidth disabled={loading}>
          {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
        </Button>
      </form>

      <p className="auth-card__footer">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="auth-card__footer-link">
              Log in
            </Link>
          </>
        ) : (
          <>
            New to Barberly?{" "}
            <Link href="/signup" className="auth-card__footer-link">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
