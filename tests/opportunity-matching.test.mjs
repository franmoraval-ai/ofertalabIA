import assert from "node:assert/strict";
import test from "node:test";

import {
  describeProfileSector,
  rankOpportunities,
} from "../app/opportunity-matching.ts";

const samples = [
  {
    score: 90,
    title: "Servicio de alimentación y comedor",
    fit: "Coincide con preparación de alimentos",
    tags: ["Alimentación"],
    keywords: ["comida", "catering", "víveres"],
  },
  {
    score: 94,
    title: "Mantenimiento de cámaras y alarmas",
    fit: "Coincide con seguridad electrónica",
    tags: ["Seguridad"],
    keywords: ["videovigilancia", "monitoreo"],
  },
  {
    score: 87,
    title: "Instalación de aire acondicionado",
    fit: "Coincide con climatización",
    tags: ["Climatización"],
    keywords: ["hvac", "refrigeración"],
  },
  {
    score: 89,
    title: "Sistemas de alimentación ininterrumpida UPS",
    fit: "Respaldo eléctrico para equipos",
    tags: ["Tecnología"],
    keywords: ["alimentación eléctrica", "baterías"],
  },
];

test("un perfil de comida recibe alimentación y no seguridad", () => {
  const matches = rankOpportunities("Venta de comida preparada", samples);

  assert.equal(matches.length, 1);
  assert.match(matches[0].title, /alimentación/i);
  assert.doesNotMatch(matches[0].title, /cámaras|alarmas/i);
  assert.equal(describeProfileSector("comida y catering"), "Alimentos y alimentación");
});

test("alimentación eléctrica UPS no se confunde con comida", () => {
  const matches = rankOpportunities("Comida, catering y alimentación", samples);

  assert.equal(matches.length, 1);
  assert.doesNotMatch(matches[0].title, /UPS/i);
});

test("reconoce sinónimos y acentos de climatización", () => {
  const matches = rankOpportunities("Refrigeración y HVAC", samples);

  assert.equal(matches.length, 1);
  assert.match(matches[0].title, /aire acondicionado/i);
});

test("no rellena con sectores ajenos cuando no hay coincidencias", () => {
  assert.deepEqual(rankOpportunities("Fabricación de violines", samples), []);
});
