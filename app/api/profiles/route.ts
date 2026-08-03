import { desc, eq } from "drizzle-orm";

import { getDb } from "../../../db";
import { portalProfiles } from "../../../db/schema";
import { hasValidSyncToken } from "../sync/opportunity-feed";
import { validateProfileDelete, validateProfileRecord } from "./profile-record";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 12_000;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "El perfil es demasiado grande." }, { status: 413 });
  }

  try {
    const entry = validateProfileRecord(JSON.parse(raw));
    const db = getDb();
    await db
      .insert(portalProfiles)
      .values({
        id: entry.id,
        companyName: entry.company_name,
        contactName: entry.contact_name,
        contactEmail: entry.contact_email,
        contactPhone: entry.contact_phone,
        companyWebsite: entry.company_website,
        companyProvince: entry.company_province,
        companyExperience: entry.company_experience,
        companyCapacity: entry.company_capacity,
        companyProducts: entry.company_products,
        companySummary: entry.company_summary,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      })
      .onConflictDoUpdate({
        target: portalProfiles.id,
        set: {
          companyName: entry.company_name,
          contactName: entry.contact_name,
          contactEmail: entry.contact_email,
          contactPhone: entry.contact_phone,
          companyWebsite: entry.company_website,
          companyProvince: entry.company_province,
          companyExperience: entry.company_experience,
          companyCapacity: entry.company_capacity,
          companyProducts: entry.company_products,
          companySummary: entry.company_summary,
          updatedAt: entry.updated_at,
        },
      });
    return Response.json({ saved: true, id: entry.id }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo guardar el perfil.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (
    !hasValidSyncToken(
      request.headers.get("authorization"),
      process.env.OFERTALAB_SYNC_TOKEN,
    )
  ) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: portalProfiles.id,
        company_name: portalProfiles.companyName,
        contact_name: portalProfiles.contactName,
        contact_email: portalProfiles.contactEmail,
        contact_phone: portalProfiles.contactPhone,
        company_website: portalProfiles.companyWebsite,
        company_province: portalProfiles.companyProvince,
        company_experience: portalProfiles.companyExperience,
        company_capacity: portalProfiles.companyCapacity,
        company_products: portalProfiles.companyProducts,
        company_summary: portalProfiles.companySummary,
        created_at: portalProfiles.createdAt,
        updated_at: portalProfiles.updatedAt,
      })
      .from(portalProfiles)
      .orderBy(desc(portalProfiles.updatedAt))
      .limit(1000);
    return Response.json({ count: rows.length, profiles: rows });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron leer los perfiles.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const raw = await request.text();
  if (raw.length > 500) {
    return Response.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  }

  try {
    const payload = raw ? JSON.parse(raw) : {};
    const { id } = validateProfileDelete(payload);
    const db = getDb();
    await db.delete(portalProfiles).where(eq(portalProfiles.id, id));
    return Response.json({ deleted: true, id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo eliminar el perfil.";
    return Response.json({ error: message }, { status: 400 });
  }
}