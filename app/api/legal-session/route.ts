import { cookies } from "next/headers";

import { SESSION_COOKIE, legalCookieSecure, verifyLegalAccessToken } from "@/lib/legal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { access_token?: string };
    const accessToken = String(payload.access_token || "").trim();
    if (!accessToken) {
      return Response.json({ error: "Falta el token de sesión." }, { status: 400 });
    }
    const user = await verifyLegalAccessToken(accessToken);
    const store = await cookies();
    store.set({
      name: SESSION_COOKIE,
      value: accessToken,
      httpOnly: true,
      sameSite: "lax",
      secure: legalCookieSecure(),
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return Response.json({ authenticated: true, email: user.email, role: user.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo iniciar la sesión legal.";
    return Response.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: legalCookieSecure(),
    path: "/",
    maxAge: 0,
  });
  return Response.json({ cleared: true });
}