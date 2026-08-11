"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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

const supabaseConfigured = isValidSupabaseUrl(supabaseUrl) && Boolean(supabaseAnonKey);
const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function LegalLoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function recoverPassword() {
    setError("");
    setNotice("");
    if (!supabase) {
      setError("Supabase Auth no está configurado correctamente para recuperar el acceso.");
      return;
    }
    if (!email.trim()) {
      setError("Escriba su correo para enviar el enlace de recuperación.");
      return;
    }
    setLoading(true);
    try {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/legal/reset-password`,
      });
      if (recoveryError) {
        throw recoveryError;
      }
      setNotice("Revise su correo. Le enviamos un enlace para definir una contraseña nueva.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo enviar el enlace de recuperación.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!supabase) {
      setError(
        "Supabase Auth no está configurado correctamente para Mesa Legal. Revise NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        throw signInError;
      }
      const accessToken = data.session?.access_token || "";
      if (!accessToken) {
        throw new Error("Supabase no devolvió una sesión válida.");
      }
      const response = await fetch("/api/legal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo iniciar la sesión legal.");
      }
      window.location.href = next;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo iniciar la sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="legal-login-shell">
      <section className="legal-login-card">
        <p className="legal-eyebrow">Acceso interno</p>
        <h1>Mesa Legal</h1>
        <p className="legal-login-copy">
          Ingrese con su usuario interno de Supabase. El acceso se limita a los correos
          autorizados para el equipo legal.
        </p>
        <form className="legal-login-form" onSubmit={onSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="legal-error">{error}</p> : null}
          {notice ? <p className="legal-login-copy">{notice}</p> : null}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar a Mesa Legal"}
          </button>
          <button className="secondary" type="button" disabled={loading} onClick={recoverPassword}>
            ¿Olvidó su contraseña?
          </button>
        </form>
      </section>
    </main>
  );
}