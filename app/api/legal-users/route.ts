import { createClient } from "@supabase/supabase-js";

import { getDb } from "@/db";
import { legalStaff } from "@/db/schema";
import { authenticateLegalRequest } from "@/lib/legal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, maximum = 240) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function normalizePayload(payload: unknown) {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const email = text(source.email, 240).toLowerCase();
  const fullName = text(source.full_name || source.fullName, 240);
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Debe indicar un correo válido para la invitación.");
  }
  if (!fullName) {
    throw new Error("Debe indicar el nombre de la persona invitada.");
  }
  return {
    email,
    full_name: fullName,
    team: text(source.team, 120) || "Legal",
    role: text(source.role, 40) === "admin" ? "admin" as const : "member" as const,
  };
}

function supabaseAdminClient() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const secretKey = String(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ).trim();
  if (!url || !secretKey) {
    throw new Error("Configure SUPABASE_SECRET_KEY para invitar usuarios desde Mesa Legal.");
  }
  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  const auth = await authenticateLegalRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.reason || "No autorizado." }, { status: 401 });
  }
  if (auth.user.role !== "admin") {
    return Response.json({ error: "Solo un administrador puede invitar usuarios." }, { status: 403 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "La invitación es demasiado grande." }, { status: 413 });
  }

  try {
    const member = normalizePayload(raw ? JSON.parse(raw) : {});
    const supabase = supabaseAdminClient();
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(member.email, {
      data: { full_name: member.full_name },
    });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.user?.id) {
      throw new Error("Supabase no devolvió el usuario invitado.");
    }

    const { error: metadataError } = await supabase.auth.admin.updateUserById(data.user.id, {
      app_metadata: {
        ofertalab_legal_access: true,
        ofertalab_legal_role: member.role,
      },
    });
    if (metadataError) {
      throw new Error(metadataError.message);
    }

    const now = new Date().toISOString();
    await getDb()
      .insert(legalStaff)
      .values({
        email: member.email,
        fullName: member.full_name,
        team: member.team,
        role: member.role,
        active: "true",
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: legalStaff.email,
        set: {
          fullName: member.full_name,
          team: member.team,
          role: member.role,
          active: "true",
          updatedAt: now,
        },
      });
    return Response.json({ invited: true, member }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo invitar al usuario.";
    return Response.json({ error: message }, { status: 400 });
  }
}