import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the Vertice Legal public route offers a real legal intake", async () => {
  const page = await readFile(new URL("../app/vertice-legal/page.tsx", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/vertice-legal/vertice-legal-client.tsx", import.meta.url), "utf8");
  const middleware = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");

  assert.match(page, /Vértice Legal/);
  assert.match(page, /https:\/\/vertice\.ofertalabcr\.com/);
  assert.match(client, /Evaluar mi trámite/);
  assert.match(client, /\/api\/requests/);
  assert.match(client, /vertice-legal:/);
  assert.match(client, /No comparta contraseñas/);
  assert.match(middleware, /vertice\.ofertalabcr\.com/);
  assert.match(middleware, /NextResponse\.rewrite/);
});