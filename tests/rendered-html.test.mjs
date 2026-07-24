import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("the layout exposes the OfertaLab IA client metadata", async () => {
  const layout = await readSource("../app/layout.tsx");
  assert.match(layout, /title:\s*"OfertaLab IA Clientes"/);
  assert.match(layout, /Su empresa también puede venderle al Estado/);
});

test("the client experience keeps its core marketing copy", async () => {
  const page = await readSource("../app/page.tsx");
  assert.match(page, /Su empresa también puede/);
  assert.match(page, /venderle al Estado/);
  assert.match(page, /Quiero empezar a ofertar/);
  assert.match(page, /Datos públicos de SICOP/);
  assert.match(page, /No le enviamos cientos de concursos/);
  assert.doesNotMatch(page, /codex-preview|react-loading-skeleton/i);
});

test("includes the three service choices in the client experience", async () => {
  const html = await readSource("../app/page.tsx");
  assert.match(html, /Quiero hacerlo yo/);
  assert.match(html, /Prepárenme la oferta/);
  assert.match(html, /Encárguense de todo/);
  assert.match(html, /Nunca le pediremos contraseñas/);
});
