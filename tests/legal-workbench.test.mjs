import assert from "node:assert/strict";
import test from "node:test";

import { buildLegalQueue, buildLegalQueueSummary } from "../lib/legal-workbench.ts";

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

test("prioriza casos criticos antes que el resto de la cola", () => {
  const queue = buildLegalQueue(
    [
      {
        id: "profile-1",
        company_name: "Critica S.A.",
        contact_name: "Ana",
        contact_email: "ana@critica.test",
        contact_phone: "8888-0001",
        company_website: "",
        company_province: "San Jose",
        company_experience: "5 anos",
        company_capacity: "Alta",
        company_products: "Servicios legales",
        company_summary: "Empresa lista para operar",
        created_at: isoDaysAgo(6),
        updated_at: isoDaysAgo(6),
      },
      {
        id: "profile-2",
        company_name: "Estable S.A.",
        contact_name: "Luis",
        contact_email: "luis@estable.test",
        contact_phone: "8888-0002",
        company_website: "",
        company_province: "Heredia",
        company_experience: "4 anos",
        company_capacity: "Media",
        company_products: "Consultoria",
        company_summary: "Empresa con ficha completa",
        created_at: isoDaysAgo(1),
        updated_at: isoDaysAgo(1),
      },
    ],
    [],
    [
      {
        case_key: "email:ana@critica.test",
        company_name: "Critica S.A.",
        contact_email: "ana@critica.test",
        follow_up_status: "Pendiente contacto",
        assigned_to: "",
        assigned_team: "Legal",
        note: "",
        priority_label: "Listo para Legal",
        next_step: "Contactar hoy",
        updated_by: "admin@ofertalab.test",
        updated_at: isoDaysAgo(5),
      },
      {
        case_key: "email:luis@estable.test",
        company_name: "Estable S.A.",
        contact_email: "luis@estable.test",
        follow_up_status: "Documentos recibidos",
        assigned_to: "Laura",
        assigned_team: "Legal",
        note: "",
        priority_label: "Listo para Legal",
        next_step: "Validar documentos",
        updated_by: "admin@ofertalab.test",
        updated_at: isoDaysAgo(1),
      },
    ],
  );

  assert.equal(queue[0].company_name, "Critica S.A.");
  assert.equal(queue[0].sla_bucket, "critico");
  assert.equal(queue[1].company_name, "Estable S.A.");
});

test("resume casos criticos dentro del texto de bandeja", () => {
  const queue = buildLegalQueue(
    [
      {
        id: "profile-3",
        company_name: "Revision S.A.",
        contact_name: "Marta",
        contact_email: "marta@revision.test",
        contact_phone: "8888-0003",
        company_website: "",
        company_province: "Cartago",
        company_experience: "3 anos",
        company_capacity: "Alta",
        company_products: "Analisis documental",
        company_summary: "Ficha completa",
        created_at: isoDaysAgo(4),
        updated_at: isoDaysAgo(4),
      },
    ],
    [],
    [
      {
        case_key: "email:marta@revision.test",
        company_name: "Revision S.A.",
        contact_email: "marta@revision.test",
        follow_up_status: "En revisión",
        assigned_to: "Laura",
        assigned_team: "Legal",
        note: "",
        priority_label: "Listo para Legal",
        next_step: "Revisar hoy",
        updated_by: "admin@ofertalab.test",
        updated_at: isoDaysAgo(3),
      },
    ],
  );

  assert.equal(queue[0].sla_bucket, "hoy");
  assert.match(buildLegalQueueSummary(queue), /criticos: 0/);
  assert.match(buildLegalQueueSummary(queue), /en revisión: 1/);
});

test("eleva casos con fecha objetivo vencida", () => {
  const queue = buildLegalQueue(
    [
      {
        id: "profile-4",
        company_name: "Objetivo S.A.",
        contact_name: "Eva",
        contact_email: "eva@objetivo.test",
        contact_phone: "8888-0004",
        company_website: "",
        company_province: "Alajuela",
        company_experience: "6 anos",
        company_capacity: "Alta",
        company_products: "Soporte legal",
        company_summary: "Ficha completa",
        created_at: isoDaysAgo(2),
        updated_at: isoDaysAgo(2),
      },
    ],
    [],
    [
      {
        case_key: "email:eva@objetivo.test",
        company_name: "Objetivo S.A.",
        contact_email: "eva@objetivo.test",
        follow_up_status: "Documentos recibidos",
        assigned_to: "Laura",
        assigned_team: "Legal",
        note: "",
        priority_label: "Listo para Legal",
        next_step: "Coordinar cierre",
        target_date: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
        updated_by: "admin@ofertalab.test",
        updated_at: isoDaysAgo(1),
      },
    ],
  );

  assert.equal(queue[0].sla_bucket, "critico");
  assert.match(queue[0].urgency_label, /Vencido desde/);
  assert.equal(queue[0].target_date.length, 10);
});

test("adjunta resumen y enlace seguro de SICOP a la contratación", () => {
  const queue = buildLegalQueue(
    [],
    [{
      id: "request-1",
      opportunity_id: "2026LD-000001-0000100001",
      opportunity_title: "Mantenimiento de infraestructura",
      institution: "Institución de prueba",
      service: "integral",
      company_name: "Empresa legal",
      contact_name: "Ana",
      contact_email: "ana@empresa.test",
      contact_phone: "8888-0001",
      company_website: "",
      company_province: "San Jose",
      company_experience: "5 anos",
      company_capacity: "Alta",
      company_products: "Mantenimiento",
      company_summary: "Ficha completa",
      status: "Solicitada",
      created_at: isoDaysAgo(1),
    }],
    [],
    [],
    [{
      procedure_no: "2026LD-000001-0000100001",
      procedure_type: "Licitación Reducida",
      status: "Publicado",
      publication_date: "2026-08-01",
      opening_date: "2026-08-20",
      classification_code: "72101500",
      source_url: "https://www.sicop.go.cr/expediente/123",
    }],
  );

  assert.equal(queue[0].procurement_type, "Licitación Reducida");
  assert.equal(queue[0].procurement_status, "Publicado");
  assert.equal(queue[0].procurement_opening_date, "2026-08-20");
  assert.equal(queue[0].procurement_source_url, "https://www.sicop.go.cr/expediente/123");
});