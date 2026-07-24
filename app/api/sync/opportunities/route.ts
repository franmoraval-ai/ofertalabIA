import { getDb } from "../../../../db";
import { portalOpportunities, portalSyncState } from "../../../../db/schema";
import {
  hasValidSyncToken,
  validateOpportunityFeed,
} from "../opportunity-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    !hasValidSyncToken(
      request.headers.get("authorization"),
      process.env.OFERTALAB_SYNC_TOKEN,
    )
  ) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const feed = validateOpportunityFeed(await request.json());
    const db = getDb();

    const rows = feed.opportunities.map((item) => ({
      procedureNo: item.procedure_no,
      cartelNo: item.cartel_no,
      title: item.title,
      institution: item.institution,
      procedureType: item.procedure_type,
      status: item.status,
      publicationDate: item.publication_date,
      openingDate: item.opening_date,
      classificationCode: item.classification_code,
      sourceUrl: item.source_url,
    }));

    await db.transaction(async (tx) => {
      await tx.delete(portalOpportunities);
      for (let index = 0; index < rows.length; index += 500) {
        await tx.insert(portalOpportunities).values(rows.slice(index, index + 500));
      }
      await tx
        .insert(portalSyncState)
        .values({
          id: 1,
          generatedAt: feed.generated_at,
          sourceUpdatedAt: feed.source_updated_at,
          opportunityCount: feed.opportunities.length,
        })
        .onConflictDoUpdate({
          target: portalSyncState.id,
          set: {
            generatedAt: feed.generated_at,
            sourceUpdatedAt: feed.source_updated_at,
            opportunityCount: feed.opportunities.length,
          },
        });
    });

    return Response.json(
      {
        synchronized: true,
        count: feed.opportunities.length,
        generated_at: feed.generated_at,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo sincronizar el portal.";
    return Response.json({ error: message }, { status: 400 });
  }
}
