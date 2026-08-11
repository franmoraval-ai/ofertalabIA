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

export function LegalResetPasswordForm() {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRecoverySession() {
      if (!supabase) {
        if (active) {
          setError("Supabase Auth no está configurado correctamente para recuperar el acceso.");
          setLoading(false);
        }
        return;
      }

      try {
        const code = new URLSearchParams(window.location.search).get("code");
        const result = code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.getSession();
        if (result.error) {
          throw result.error;
        }
        if (active) {
          setSession(result.data.session);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "No se pudo validar el enlace.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRecoverySession();
    return () => {
      active = false;
    };
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!supabase || !session) {
      setError("El enlace de recuperación ya no es válido. Solicite uno nuevo.");
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
      if (passwordError) {
        throw passwordError;
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      const accessToken = data.session?.access_token || session.access_token;
      const response = await fetch("/api/legal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "La contraseña cambió, pero no se pudo abrir Mesa Legal.");
      }
      window.location.href = "/legal";
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="legal-login-shell">
      <section className="legal-login-card">
        <p className="legal-eyebrow">Recuperación de acceso</p>
        <h1>Defina una contraseña nueva</h1>
        <p className="legal-login-copy">
          Use una contraseña de al menos 8 caracteres que no utilice en otros servicios.
        </p>
        {loading ? <p className="legal-login-copy">Validando enlace...</p> : null}
        {!loading && !session ? (
          <>
            <p className="legal-error">{error || "El enlace ya no es válido o venció."}</p>
            <a className="secondary" href="/legal/login">Solicitar otro enlace</a>
          </>
        ) : null}
        {!loading && session ? (
          <form className="legal-login-form" onSubmit={updatePassword}>
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
              {saving ? "Guardando..." : "Guardar contraseña y entrar"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
