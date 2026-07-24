import { env } from "cloudflare:workers";

import {
  hasValidSyncToken,
  validateOpportunityFeed,
} from "../opportunity-feed";

type RuntimeEnvironment = {
  DB?: D1Database;
  OFERTALAB_SYNC_TOKEN?: string;
};

const COLUMNS = [
  "procedure_no",
  "cartel_no",
  "title",
  "institution",
  "procedure_type",
  "status",
  "publication_date",
  "opening_date",
  "classification_code",
  "source_url",
] as const;

export async function POST(request: Request) {
  const runtime = env as unknown as RuntimeEnvironment;
  if (
    !hasValidSyncToken(
      request.headers.get("authorization"),
      runtime.OFERTALAB_SYNC_TOKEN,
    )
  ) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!runtime.DB) {
    return Response.json({ error: "Base del portal no disponible." }, { status: 503 });
  }

  try {
    const feed = validateOpportunityFeed(await request.json());
    const statements: D1PreparedStatement[] = [
      runtime.DB.prepare("DELETE FROM portal_opportunities"),
    ];

    for (let index = 0; index < feed.opportunities.length; index += 8) {
      const chunk = feed.opportunities.slice(index, index + 8);
      const placeholders = chunk
        .map(() => `(${COLUMNS.map(() => "?").join(",")})`)
        .join(",");
      const values = chunk.flatMap((item) => COLUMNS.map((column) => item[column]));
      statements.push(
        runtime.DB.prepare(
          `INSERT INTO portal_opportunities (${COLUMNS.join(",")}) VALUES ${placeholders}`,
        ).bind(...values),
      );
    }

    statements.push(
      runtime.DB.prepare(
        `
        INSERT INTO portal_sync_state (
          id, generated_at, source_updated_at, opportunity_count
        ) VALUES (1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          generated_at=excluded.generated_at,
          source_updated_at=excluded.source_updated_at,
          opportunity_count=excluded.opportunity_count
        `,
      ).bind(
        feed.generated_at,
        feed.source_updated_at,
        feed.opportunities.length,
      ),
    );
    await runtime.DB.batch(statements);
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
