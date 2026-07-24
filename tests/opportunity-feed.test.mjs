import assert from "node:assert/strict";
import test from "node:test";

import {
  hasValidSyncToken,
  validateOpportunityFeed,
} from "../app/api/sync/opportunity-feed.ts";

const validItem = {
  procedure_no: "2026LD-000001-0000000001",
  cartel_no: "20260700001",
  title: "Servicio de alimentación",
  institution: "Institución pública",
  procedure_type: "LD",
  status: "En recepción de ofertas",
  publication_date: "2026-07-20",
  opening_date: "2026-07-30",
  classification_code: "",
  source_url: "https://www.sicop.go.cr/publico",
};

test("valida y conserva únicamente campos públicos", () => {
  const feed = validateOpportunityFeed({
    generated_at: "2026-07-23T20:00:00Z",
    opportunities: [{ ...validItem, internal_note: "No debe pasar" }],
  });

  assert.equal(feed.opportunities.length, 1);
  assert.equal(feed.opportunities[0].source_url, validItem.source_url);
  assert.equal("internal_note" in feed.opportunities[0], false);
});

test("elimina enlaces que no pertenecen a SICOP", () => {
  const feed = validateOpportunityFeed({
    opportunities: [{ ...validItem, source_url: "https://example.com/privado" }],
  });

  assert.equal(feed.opportunities[0].source_url, "");
});

test("compara la clave privada sin aceptar prefijos", () => {
  assert.equal(hasValidSyncToken("Bearer secreto", "secreto"), true);
  assert.equal(hasValidSyncToken("Bearer secre", "secreto"), false);
  assert.equal(hasValidSyncToken("Bearer secreto-extra", "secreto"), false);
});
