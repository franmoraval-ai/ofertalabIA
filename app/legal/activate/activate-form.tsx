"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const supabase = isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function LegalActivateForm() {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      if (!supabase) {
        if (active) {
          setError("Supabase Auth no está configurado correctamente para activar la cuenta.");
          setLoading(false);
        }
        return;
      }
      try {
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (active) setSession(data.session);
        } else {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (active) setSession(data.session);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "No se pudo validar la invitación.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadSession();
    return () => {
      active = false;
    };
  }, []);

  async function activateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!supabase || !session) {
      setError("El enlace de invitación ya no es válido. Pida una nueva invitación.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;
      const response = await fetch("/api/legal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: session.access_token }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "La cuenta se activó, pero no se pudo abrir Mesa Legal.");
      }
      window.location.href = "/legal";
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo activar la cuenta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="legal-login-shell">
      <section className="legal-login-card">
        <p className="legal-eyebrow">Acceso interno</p>
        <h1>Active su acceso</h1>
        <p className="legal-login-copy">
          Defina una contraseña para ingresar a Mesa Legal. Esta invitación es personal y no debe compartirse.
        </p>
        {loading ? <p className="legal-login-copy">Validando invitación...</p> : null}
        {!loading && !session ? (
          <p className="legal-error">{error || "El enlace de invitación ya no es válido. Pida una nueva invitación."}</p>
        ) : null}
        {!loading && session ? (
          <form className="legal-login-form" onSubmit={activateAccount}>
            <label>
              Nueva contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Confirmar contraseña
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            {error ? <p className="legal-error">{error}</p> : null}
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Activando..." : "Activar acceso a Mesa Legal"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
