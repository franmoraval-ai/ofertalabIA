import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "../../../db";
import { portalOpportunities, portalSyncState } from "../../../db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const opportunities = await db
      .select({
        procedure_no: portalOpportunities.procedureNo,
        cartel_no: portalOpportunities.cartelNo,
        title: portalOpportunities.title,
        institution: portalOpportunities.institution,
        procedure_type: portalOpportunities.procedureType,
        status: portalOpportunities.status,
        publication_date: portalOpportunities.publicationDate,
        opening_date: portalOpportunities.openingDate,
        classification_code: portalOpportunities.classificationCode,
        source_url: portalOpportunities.sourceUrl,
      })
      .from(portalOpportunities)
      .orderBy(
        asc(portalOpportunities.openingDate),
        desc(portalOpportunities.publicationDate),
        asc(portalOpportunities.procedureNo),
      )
      .limit(2000);

    const stateRows = await db
      .select({
        generated_at: portalSyncState.generatedAt,
        source_updated_at: portalSyncState.sourceUpdatedAt,
        opportunity_count: portalSyncState.opportunityCount,
      })
      .from(portalSyncState)
      .where(eq(portalSyncState.id, 1))
      .limit(1);
    const state = stateRows[0] ?? {};

    return Response.json({
      schema_version: 1,
      generated_at: String(state.generated_at ?? ""),
      source_updated_at: String(state.source_updated_at ?? ""),
      source: "SICOP público sincronizado por OfertaLab IA",
      count: Number(state.opportunity_count ?? opportunities.length),
      opportunities,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron leer las oportunidades.";
    return Response.json({ error: message }, { status: 503 });
  }
}
