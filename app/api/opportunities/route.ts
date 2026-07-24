import { env } from "cloudflare:workers";

type RuntimeEnvironment = {
  DB?: D1Database;
};

export async function GET() {
  const runtime = env as unknown as RuntimeEnvironment;
  if (!runtime.DB) {
    return Response.json({ error: "Base del portal no disponible." }, { status: 503 });
  }

  try {
    const [opportunityResult, stateResult] = await runtime.DB.batch([
      runtime.DB.prepare(
        `
        SELECT procedure_no, cartel_no, title, institution, procedure_type,
               status, publication_date, opening_date, classification_code,
               source_url
        FROM portal_opportunities
        ORDER BY opening_date ASC, publication_date DESC, procedure_no ASC
        LIMIT 2000
        `,
      ),
      runtime.DB.prepare(
        `
        SELECT generated_at, source_updated_at, opportunity_count
        FROM portal_sync_state
        WHERE id=1
        `,
      ),
    ]);
    const state = (stateResult.results?.[0] ?? {}) as Record<string, unknown>;
    const opportunities = opportunityResult.results ?? [];
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
