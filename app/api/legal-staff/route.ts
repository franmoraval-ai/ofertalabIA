import { asc } from "drizzle-orm";

import { getDb } from "@/db";
import { legalStaff } from "@/db/schema";
import { authenticateLegalRequest } from "@/lib/legal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LegalStaffRow = {
  email: string;
  full_name: string;
  team: string;
  role: string;
  active: string;
  created_at: string;
  updated_at: string;
};

function text(value: unknown, maximum = 240) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function normalizeRole(value: unknown) {
  return text(value, 40) === "admin" ? "admin" : "member";
}

function normalizeActive(value: unknown) {
  return String(value).trim().toLowerCase() === "false" ? "false" : "true";
}

function normalizePayload(payload: unknown) {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const email = text(source.email, 240).toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Debe indicar un correo válido para el miembro del equipo.");
  }
  const fullName = text(source.full_name || source.fullName, 240);
  if (!fullName) {
    throw new Error("Debe indicar el nombre del responsable.");
  }
  return {
    email,
    full_name: fullName,
    team: text(source.team, 120) || "Legal",
    role: normalizeRole(source.role),
    active: normalizeActive(source.active),
  };
}

export async function GET(request: Request) {
  const auth = await authenticateLegalRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.reason || "No autorizado." }, { status: 401 });
  }

  try {
    const rows = await getDb()
      .select({
        email: legalStaff.email,
        full_name: legalStaff.fullName,
        team: legalStaff.team,
        role: legalStaff.role,
        active: legalStaff.active,
        created_at: legalStaff.createdAt,
        updated_at: legalStaff.updatedAt,
      })
      .from(legalStaff)
      .orderBy(asc(legalStaff.fullName), asc(legalStaff.email));
    return Response.json({ count: rows.length, staff: rows satisfies LegalStaffRow[] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el equipo legal.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateLegalRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.reason || "No autorizado." }, { status: 401 });
  }
  if (auth.user.role !== "admin") {
    return Response.json({ error: "Solo un administrador puede gestionar el equipo legal." }, { status: 403 });
  }

  try {
    const payload = normalizePayload(await request.json());
    const now = new Date().toISOString();
    await getDb()
      .insert(legalStaff)
      .values({
        email: payload.email,
        fullName: payload.full_name,
        team: payload.team,
        role: payload.role,
        active: payload.active,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: legalStaff.email,
        set: {
          fullName: payload.full_name,
          team: payload.team,
          role: payload.role,
          active: payload.active,
          updatedAt: now,
        },
      });
    return Response.json({ saved: true, member: payload }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el miembro del equipo.";
    return Response.json({ error: message }, { status: 400 });
  }
}