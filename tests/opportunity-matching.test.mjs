import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_PREPARATION_DAYS,
  describeProfileSector,
  daysUntilClosing,
  hasClientPreparationWindow,
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

test("prioriza oportunidades con al menos quince días de preparación", () => {
  const today = new Date("2026-08-03T12:00:00");

  assert.equal(CLIENT_PREPARATION_DAYS, 15);
  assert.equal(daysUntilClosing("2026-08-17", today), 14);
  assert.equal(hasClientPreparationWindow("2026-08-17", today), false);
  assert.equal(daysUntilClosing("2026-08-18", today), 15);
  assert.equal(hasClientPreparationWindow("2026-08-18", today), true);
});

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

test("una descripción demasiado general no mezcla mantenimientos", () => {
  assert.deepEqual(rankOpportunities("Venta de equipos y mantenimiento general", samples), []);
});

test("una categoría amplia sola no muestra negocios relacionados de forma imprecisa", () => {
  assert.deepEqual(rankOpportunities("Seguridad", samples), []);
  assert.deepEqual(rankOpportunities("Tecnología", samples), []);
});

test("seguridad electrónica no confunde seguridad ocupacional", () => {
  const occupational = {
    score: 91,
    title: "Capacitación en seguridad ocupacional",
    fit: "",
    tags: ["Capacitación"],
    keywords: ["salud laboral"],
  };

  assert.deepEqual(
    rankOpportunities("Cámaras, alarmas y seguridad", [occupational]),
    [],
  );
});

test("motor no coincide dentro de la palabra promotor", () => {
  const recreational = {
    score: 90,
    title: "Servicios de un promotor recreativo",
    fit: "",
    tags: ["Servicios"],
    keywords: [],
  };

  assert.deepEqual(
    rankOpportunities("Repuestos para vehículos y motores", [recreational]),
    [],
  );
});

test("repuesto genérico necesita una señal automotriz", () => {
  const computerParts = {
    score: 90,
    title: "Repuestos para equipo de cómputo",
    fit: "",
    tags: ["Tecnología"],
    keywords: [],
  };
  const vehicleParts = {
    score: 90,
    title: "Repuestos y llantas para vehículos institucionales",
    fit: "",
    tags: ["Automotriz"],
    keywords: [],
  };
  const vehicleLegalService = {
    score: 89,
    title: "Servicios notariales para desinscripción de vehículos",
    fit: "",
    tags: ["Legal"],
    keywords: [],
  };

  const matches = rankOpportunities(
    "Repuestos para vehículos",
    [computerParts, vehicleParts, vehicleLegalService],
  );
  assert.deepEqual(matches.map((item) => item.title), [vehicleParts.title]);
});
