import assert from "node:assert/strict";
import test from "node:test";

import { validateServiceRequest } from "../app/api/requests/service-request.ts";

test("acepta una solicitud válida y deriva id y estado", () => {
  const result = validateServiceRequest({
    opportunity_id: "2024LN-000001",
    opportunity_title: "Mantenimiento de cámaras",
    institution: "Consejo de Seguridad Vial",
    service: "asistida",
    company_name: "Seguridad Integral S.A.",
    contact_name: "Marco",
    contact_email: "marco@example.com",
    contact_phone: "+50688887777",
    company_products: "Cámaras, alarmas y monitoreo",
  });
  assert.equal(result.id, "2024LN-000001::asistida");
  assert.equal(result.service, "asistida");
  assert.equal(result.status, "Solicitada");
  assert.equal(result.contact_name, "Marco");
  assert.equal(result.company_name, "Seguridad Integral S.A.");
  assert.equal(result.contact_info, "marco@example.com · +50688887777");
  assert.match(result.created_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("rechaza un servicio desconocido", () => {
  assert.throws(() =>
    validateServiceRequest({
      opportunity_id: "2024LN-000001",
      opportunity_title: "Mantenimiento",
      service: "otro",
      company_name: "Empresa",
      contact_name: "Marco",
      contact_email: "marco@example.com",
      company_products: "Servicios",
    }),
  );
});

test("registra seguimiento sin convertirlo en una solicitud de servicio", () => {
  const result = validateServiceRequest({
    opportunity_id: "2026LY-000010",
    opportunity_title: "Compra de equipos",
    service: "seguimiento",
    company_name: "Empresa",
    contact_name: "Marco",
    contact_email: "marco@example.com",
    company_products: "Venta de equipos",
  });
  assert.equal(result.id, "2026LY-000010::seguimiento");
  assert.equal(result.status, "En seguimiento");
});

test("rechaza cuando faltan datos obligatorios", () => {
  assert.throws(() =>
    validateServiceRequest({ service: "autogestion", contact_email: "marco@example.com" }),
  );
});

test("rechaza cuando falta el correo electrónico", () => {
  assert.throws(() =>
    validateServiceRequest({
      opportunity_id: "2024LN-000001",
      opportunity_title: "Mantenimiento",
      service: "autogestion",
      company_name: "Empresa",
      contact_name: "Marco",
      company_products: "Mantenimiento",
    }),
  );
});

test("rechaza correos inválidos", () => {
  assert.throws(() =>
    validateServiceRequest({
      opportunity_id: "2024LN-000001",
      opportunity_title: "Mantenimiento",
      service: "autogestion",
      company_name: "Empresa",
      contact_name: "Marco",
      contact_email: "correo-invalido",
      company_products: "Mantenimiento",
    }),
  );
});

test("recorta longitudes excesivas", () => {
  const result = validateServiceRequest({
    opportunity_id: "x".repeat(300),
    opportunity_title: "y".repeat(2000),
    service: "integral",
    company_name: "Empresa",
    contact_name: "Marco",
    contact_email: "correo@example.com",
    contact_phone: "z".repeat(500),
    company_products: "p".repeat(2000),
    company_summary: "s".repeat(2000),
  });
  assert.equal(result.opportunity_id.length, 120);
  assert.equal(result.opportunity_title.length, 1_000);
  assert.equal(result.contact_phone.length, 80);
  assert.equal(result.company_products.length, 1500);
  assert.equal(result.company_summary.length, 1000);
});
