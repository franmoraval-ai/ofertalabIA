import {
  buildLegalCaseKey,
  buildLegalNextStep,
  type LegalCaseRecord,
  type LegalQueueRow,
} from "@/lib/legal-workbench";

const FOLLOW_UP_STATUSES = new Set([
  "Sin estado",
  "Pendiente contacto",
  "En revisión",
  "Documentos recibidos",
  "Listo para oferta",
]);

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function normalizeFollowUpStatus(value: unknown) {
  const status = text(value, 80);
  return FOLLOW_UP_STATUSES.has(status) ? status : "Sin estado";
}

function normalizeTargetDate(value: unknown) {
  const targetDate = text(value, 40);
  if (!targetDate) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error("La fecha objetivo debe usar el formato AAAA-MM-DD.");
  }
  return targetDate;
}

export function normalizeLegalCasePayload(payload: unknown): LegalCaseRecord {
  if (!payload || typeof payload !== "object") {
    throw new Error("El caso legal no es válido.");
  }
  const input = payload as Record<string, unknown>;
  const companyName = text(input.company_name, 240);
  const contactEmail = text(input.contact_email, 240).toLowerCase();
  const caseKey = text(input.case_key, 200).toLowerCase() || buildLegalCaseKey(
    companyName ? { company_name: companyName, contact_email: contactEmail } : null,
    null,
  );
  if (!caseKey || caseKey === "case:sin-clave") {
    throw new Error("El caso legal necesita una clave o un contacto para agruparlo.");
  }
  const followUpStatus = normalizeFollowUpStatus(input.follow_up_status);
  const legalLabel = text(input.priority_label, 160) || "Falta completar ficha";
  const draftRow = {
    follow_up_status: followUpStatus,
    legal_label: legalLabel,
  } as Pick<LegalQueueRow, "follow_up_status" | "legal_label">;
  return {
    case_key: caseKey,
    company_name: companyName,
    contact_email: contactEmail,
    follow_up_status: followUpStatus,
    assigned_to: text(input.assigned_to, 240),
    assigned_team: text(input.assigned_team, 120) || "Legal",
    note: text(input.note, 8_000),
    priority_label: legalLabel,
    next_step: text(input.next_step, 500) || buildLegalNextStep(draftRow),
    target_date: normalizeTargetDate(input.target_date),
    updated_by: text(input.updated_by, 160),
    updated_at: text(input.updated_at, 80) || new Date().toISOString(),
  };
}

export function normalizeLegalCaseBatchPayload(payload: unknown) {
  if (payload && typeof payload === "object" && Array.isArray((payload as { cases?: unknown[] }).cases)) {
    const cases = (payload as { cases: unknown[] }).cases;
    if (cases.length > 5_000) {
      throw new Error("La carga de casos legales es demasiado grande.");
    }
    return cases.map((entry) => normalizeLegalCasePayload(entry));
  }
  return [normalizeLegalCasePayload(payload)];
}