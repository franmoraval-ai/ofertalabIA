import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateServiceRequest } from "../app/api/requests/service-request.ts";
import { buildVerticeLegalRequest } from "../app/vertice-legal/intake-request.ts";
import { buildLegalQueue } from "../lib/legal-workbench.ts";

test("the Vertice Legal public route offers a real legal intake", async () => {
  const page = await readFile(new URL("../app/vertice-legal/page.tsx", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/vertice-legal/vertice-legal-client.tsx", import.meta.url), "utf8");
  const intake = await readFile(new URL("../app/vertice-legal/intake-request.ts", import.meta.url), "utf8");
  const middleware = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");

  assert.match(page, /Vértice Legal/);
  assert.match(page, /https:\/\/vertice\.ofertalabcr\.com/);
  assert.match(client, /Evaluar mi trámite/);
  assert.match(client, /vertice-legal-logo\.png/);
  assert.match(client, /\/api\/requests/);
  assert.match(client, /buildVerticeLegalRequest/);
  assert.match(intake, /vertice-legal:/);
  assert.match(client, /No comparta contraseñas/);
  assert.match(middleware, /vertice\.ofertalabcr\.com/);
  assert.match(middleware, /NextResponse\.rewrite/);
});

test("a Vertice Legal intake becomes a complete case in Mesa Legal", () => {
  const request = validateServiceRequest(buildVerticeLegalRequest({
    procedure: "Revisión de requisitos",
    company: "Empresa Vértice S.A.",
    contact: "Ana Pérez",
    email: "ANA@EMPRESA.TEST",
    phone: "8888-0001",
    detail: "Necesitamos revisar requisitos y documentos para iniciar el trámite.",
  }));
  const queue = buildLegalQueue([], [request], []);

  assert.equal(request.id, "vertice-legal:revision-de-requisitos:ana@empresa.test::integral");
  assert.equal(queue.length, 1);
  assert.equal(queue[0].case_key, `request:${request.id}`);
  assert.equal(queue[0].company_name, "Empresa Vértice S.A.");
  assert.equal(queue[0].latest_institution, "Vértice Legal");
  assert.equal(queue[0].legal_label, "Listo para Legal");
});