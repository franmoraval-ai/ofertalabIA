import { desc } from "drizzle-orm";

import { getDb } from "../../../db";
import { serviceRequests } from "../../../db/schema";
import { hasValidSyncToken } from "../sync/opportunity-feed";
import { validateServiceRequest } from "./service-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_000;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  }

  try {
    const entry = validateServiceRequest(JSON.parse(raw));
    const db = getDb();
    await db
      .insert(serviceRequests)
      .values({
        id: entry.id,
        opportunityId: entry.opportunity_id,
        opportunityTitle: entry.opportunity_title,
        institution: entry.institution,
        service: entry.service,
        contactName: entry.contact_name,
        contactInfo: entry.contact_info,
        status: entry.status,
        createdAt: entry.created_at,
      })
      .onConflictDoUpdate({
        target: serviceRequests.id,
        set: {
          opportunityTitle: entry.opportunity_title,
          institution: entry.institution,
          service: entry.service,
          contactName: entry.contact_name,
          contactInfo: entry.contact_info,
          createdAt: entry.created_at,
        },
      });
    return Response.json(
      { registered: true, id: entry.id, status: entry.status },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo registrar la solicitud.";
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
        id: serviceRequests.id,
        opportunity_id: serviceRequests.opportunityId,
        opportunity_title: serviceRequests.opportunityTitle,
        institution: serviceRequests.institution,
        service: serviceRequests.service,
        contact_name: serviceRequests.contactName,
        contact_info: serviceRequests.contactInfo,
        status: serviceRequests.status,
        created_at: serviceRequests.createdAt,
      })
      .from(serviceRequests)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(1000);
    return Response.json({ count: rows.length, requests: rows });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron leer las solicitudes.";
    return Response.json({ error: message }, { status: 500 });
  }
}
