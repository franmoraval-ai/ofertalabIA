import assert from "node:assert/strict";
import test from "node:test";

import { businessSectors } from "../app/business-taxonomy.ts";
import {
  classifyBusinessProfile,
  describeProfileSector,
} from "../app/opportunity-matching.ts";

test("ofrece una taxonomía comercial amplia y sin etiquetas repetidas", () => {
  assert.equal(businessSectors.length, 18);
  assert.equal(new Set(businessSectors.map((sector) => sector.label)).size, 18);
  assert.equal(businessSectors.every((sector) => sector.terms.length >= 5), true);
});

test("clasifica actividades de sectores distintos", () => {
  const cases = [
    ["venta de muebles y sillas de oficina", "Oficina y mobiliario"],
    ["reactivos y equipos para laboratorio clínico", "Salud, equipo médico y laboratorio"],
    ["repuestos, llantas y lubricantes para vehículos", "Automotriz y repuestos"],
    ["uniformes bordados y equipo de protección personal", "Textiles, uniformes y protección personal"],
    ["auditoría contable y servicios tributarios", "Contabilidad, auditoría y servicios legales"],
    ["construcción de carreteras y obra civil", "Construcción y obra civil"],
  ];

  for (const [profile, expected] of cases) {
    assert.equal(classifyBusinessProfile(profile).includes(expected), true, profile);
  }
});

test("resume hasta dos sectores para mantener legible el panel", () => {
  assert.equal(
    describeProfileSector("software y cámaras de videovigilancia"),
    "Seguridad electrónica y vigilancia + Tecnología y telecomunicaciones",
  );
});
