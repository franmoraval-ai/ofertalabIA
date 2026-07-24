import assert from "node:assert/strict";
import test from "node:test";

import { validateServiceRequest } from "../app/api/requests/service-request.ts";

test("acepta una solicitud válida y deriva id y estado", () => {
  const result = validateServiceRequest({
    opportunity_id: "2024LN-000001",
    opportunity_title: "Mantenimiento de cámaras",
    institution: "Consejo de Seguridad Vial",
    service: "asistida",
    contact_name: "Marco",
  });
  assert.equal(result.id, "2024LN-000001::asistida");
  assert.equal(result.service, "asistida");
  assert.equal(result.status, "Solicitada");
  assert.equal(result.contact_name, "Marco");
  assert.match(result.created_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("rechaza un servicio desconocido", () => {
  assert.throws(() =>
    validateServiceRequest({
      opportunity_id: "2024LN-000001",
      opportunity_title: "Mantenimiento",
      service: "otro",
    }),
  );
});

test("rechaza cuando faltan datos obligatorios", () => {
  assert.throws(() =>
    validateServiceRequest({ service: "autogestion" }),
  );
});

test("recorta longitudes excesivas", () => {
  const result = validateServiceRequest({
    opportunity_id: "x".repeat(300),
    opportunity_title: "y".repeat(2000),
    service: "integral",
    contact_info: "z".repeat(500),
  });
  assert.equal(result.opportunity_id.length, 120);
  assert.equal(result.opportunity_title.length, 1_000);
  assert.equal(result.contact_info.length, 200);
});
