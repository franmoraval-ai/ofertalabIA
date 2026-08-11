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
      publicVisible: item.public_visible,
      detailDocumentsCount: item.detail_documents_count,
      detailChangeSummary: item.detail_change_summary,
      detailChangeAt: item.detail_change_at,
      openingStatus: item.opening_status,
      openingSummary: item.opening_summary,
      participantCount: item.participant_count,
      offerCount: item.offer_count,
      inadmissibleCount: item.inadmissible_count,
      openingResultUpdatedAt: item.opening_result_updated_at,
    }));
    const publicCount = feed.opportunities.filter((item) => item.public_visible).length;

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
          opportunityCount: publicCount,
        })
        .onConflictDoUpdate({
          target: portalSyncState.id,
          set: {
            generatedAt: feed.generated_at,
            sourceUpdatedAt: feed.source_updated_at,
            opportunityCount: publicCount,
          },
        });
    });

    return Response.json(
      {
        synchronized: true,
        count: publicCount,
        legal_archive_count: feed.opportunities.length - publicCount,
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
