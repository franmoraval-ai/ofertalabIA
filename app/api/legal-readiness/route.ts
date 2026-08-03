import { sql } from "drizzle-orm";

import { getDb } from "@/db";
import { legalStaff } from "@/db/schema";
import { authenticateLegalRequest } from "@/lib/legal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "OFERTALAB_LEGAL_ALLOWED_EMAILS",
  "OFERTALAB_LEGAL_ADMIN_EMAILS",
] as const;

function envState(name: (typeof REQUIRED_ENV)[number]) {
  const present = Boolean(String(process.env[name] || "").trim());
  return {
    name,
    present,
    message: present ? "Configurado" : "Pendiente",
  };
}

export async function GET(request: Request) {
  const auth = await authenticateLegalRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.reason || "No autorizado." }, { status: 401 });
  }
  if (auth.user.role !== "admin") {
    return Response.json({ error: "Solo un administrador puede revisar el estado de despliegue." }, { status: 403 });
  }

  const env = REQUIRED_ENV.map(envState);
  let databaseReady = false;
  let databaseMessage = "DATABASE_URL pendiente.";
  let staffCount = 0;
  const userManagementReady = Boolean(
    String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
  );

  if (env.every((entry) => entry.present)) {
    try {
      const db = getDb();
      const [staffRow] = await db.select({ count: sql<number>`count(*)::int` }).from(legalStaff);
      staffCount = Number(staffRow?.count || 0);
      databaseReady = true;
      databaseMessage = "Conexion DB disponible.";
    } catch (error) {
      databaseMessage = error instanceof Error ? error.message : "No se pudo abrir la base de datos.";
    }
  }

  return Response.json({
    env,
    database_ready: databaseReady,
    database_message: databaseMessage,
    staff_count: staffCount,
    user_management_ready: userManagementReady,
    next_steps: !env.every((entry) => entry.present)
      ? ["Complete las variables pendientes antes de operar Mesa Legal."]
      : !databaseReady
        ? ["Revise la conexión con la base de datos antes de operar Mesa Legal."]
        : !userManagementReady
          ? []
          : staffCount === 0
            ? ["Mesa Legal está lista. Invite al primer integrante del equipo."]
            : ["Mesa Legal está lista para operar."],
  });
}