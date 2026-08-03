import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const SESSION_COOKIE = "ofertalab_legal_session";

export type LegalUser = {
  email: string;
  role: "admin" | "member";
  token: string;
};

export function legalCookieSecure() {
  return process.env.NODE_ENV == "production";
}

function splitEmails(value: string | undefined) {
  return new Set(
    String(value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function legalAllowedEmails() {
  return splitEmails(process.env.OFERTALAB_LEGAL_ALLOWED_EMAILS);
}

function legalAdminEmails() {
  return splitEmails(process.env.OFERTALAB_LEGAL_ADMIN_EMAILS);
}

function supabaseIssuer() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  if (!url) {
    return "";
  }
  return `${url}/auth/v1`;
}

function remoteKeySet() {
  const issuer = supabaseIssuer();
  if (!issuer) {
    return null;
  }
  return createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
}

function resolveEmail(payload: JWTPayload) {
  return String(payload.email || "").trim().toLowerCase();
}

function legalAccessMetadata(payload: JWTPayload) {
  const metadata = payload.app_metadata;
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};
}

function hasManagedLegalAccess(payload: JWTPayload) {
  return legalAccessMetadata(payload).ofertalab_legal_access === true;
}

function resolveRole(payload: JWTPayload) {
  const email = resolveEmail(payload);
  if (
    legalAdminEmails().has(email) ||
    legalAccessMetadata(payload).ofertalab_legal_role === "admin"
  ) {
    return "admin" as const;
  }
  return "member" as const;
}

export async function verifyLegalAccessToken(token: string) {
  const normalized = token.trim();
  if (!normalized) {
    throw new Error("Token vacío.");
  }
  const jwks = remoteKeySet();
  const issuer = supabaseIssuer();
  if (!jwks || !issuer) {
    throw new Error("Supabase Auth no está configurado para Mesa Legal.");
  }
  const verification = await jwtVerify(normalized, jwks, {
    issuer,
  });
  const email = resolveEmail(verification.payload);
  if (!email) {
    throw new Error("La sesión no incluye un correo válido.");
  }
  const allowed = legalAllowedEmails();
  if (!allowed.has(email) && !hasManagedLegalAccess(verification.payload)) {
    throw new Error("El usuario no tiene acceso a Mesa Legal.");
  }
  return {
    email,
    role: resolveRole(verification.payload),
    payload: verification.payload,
  };
}

export function readBearerToken(header: string | null) {
  if (!header || !header.startsWith("Bearer ")) {
    return "";
  }
  return header.slice(7).trim();
}

export async function authenticateLegalRequest(request: Request | NextRequest) {
  const bearer = readBearerToken(request.headers.get("authorization"));
  const serviceToken = String(process.env.OFERTALAB_LEGAL_TOKEN || process.env.OFERTALAB_SYNC_TOKEN || "").trim();
  if (serviceToken && bearer && bearer === serviceToken) {
    return {
      ok: true as const,
      user: {
        email: "sistema@ofertalab.local",
        role: "admin" as const,
        token: bearer,
      },
    };
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!cookieToken) {
    return { ok: false as const, reason: "Sin sesión." };
  }
  try {
    const result = await verifyLegalAccessToken(decodeURIComponent(cookieToken));
    return {
      ok: true as const,
      user: {
        email: result.email,
        role: result.role,
        token: decodeURIComponent(cookieToken),
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      reason: error instanceof Error ? error.message : "Sesión inválida.",
    };
  }
}

export async function currentLegalUser() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value || "";
  if (!session) {
    return null;
  }
  try {
    const result = await verifyLegalAccessToken(session);
    return {
      email: result.email,
      role: result.role,
      token: session,
    } satisfies LegalUser;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };