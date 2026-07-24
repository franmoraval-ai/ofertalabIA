import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { register } from "node:module";
import test from "node:test";

register("./cloudflare-loader.mjs", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the OfertaLab IA client experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>OfertaLab IA Clientes<\/title>/i);
  assert.match(html, /Su empresa también puede/);
  assert.match(html, /venderle al Estado/);
  assert.match(html, /Quiero empezar a ofertar/);
  assert.match(html, /Datos públicos de SICOP/);
  assert.match(html, /No le enviamos cientos de concursos/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("includes the three service choices in the client experience", async () => {
  const html = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(html, /Quiero hacerlo yo/);
  assert.match(html, /Prepárenme la oferta/);
  assert.match(html, /Encárguense de todo/);
  assert.match(html, /Nunca le pediremos contraseñas/);
});
