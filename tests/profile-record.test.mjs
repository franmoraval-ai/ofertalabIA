import assert from "node:assert/strict";
import test from "node:test";

import {
  validateProfileDelete,
  validateProfileRecord,
} from "../app/api/profiles/profile-record.ts";

test("acepta un perfil válido de empresa", () => {
  const result = validateProfileRecord({
    id: "empresa-1",
    company_name: "Seguridad Integral S.A.",
    contact_name: "Marco",
    contact_email: "MARCO@EMPRESA.COM",
    contact_phone: "+50688887777",
    company_products: "Cámaras, alarmas y monitoreo",
  });

  assert.equal(result.id, "empresa-1");
  assert.equal(result.contact_email, "marco@empresa.com");
  assert.match(result.updated_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("rechaza perfiles sin campos mínimos", () => {
  assert.throws(() =>
    validateProfileRecord({
      id: "empresa-1",
      company_name: "",
      contact_name: "",
      contact_email: "",
      company_products: "",
    }),
  );
});

test("rechaza correos inválidos", () => {
  assert.throws(() =>
    validateProfileRecord({
      id: "empresa-1",
      company_name: "Empresa",
      contact_name: "Marco",
      contact_email: "invalido",
      company_products: "Servicios",
    }),
  );
});

test("recorta textos largos y valida eliminación", () => {
  const result = validateProfileRecord({
    id: "empresa-1",
    company_name: "Empresa",
    contact_name: "Marco",
    contact_email: "marco@example.com",
    company_products: "p".repeat(2000),
    company_summary: "s".repeat(2000),
  });

  assert.equal(result.company_products.length, 1500);
  assert.equal(result.company_summary.length, 1000);
  assert.deepEqual(validateProfileDelete({ id: "empresa-1" }), { id: "empresa-1" });
});