export type PortalProfileRecord = {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_website: string;
  company_province: string;
  company_experience: string;
  company_capacity: string;
  company_products: string;
  company_summary: string;
  created_at: string;
  updated_at: string;
};

export type ServiceRequestRecord = {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  institution: string;
  service: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_website: string;
  company_province: string;
  company_experience: string;
  company_capacity: string;
  company_products: string;
  company_summary: string;
  status: string;
  created_at: string;
};

export type PortalOpportunityRecord = {
  procedure_no: string;
  procedure_type: string;
  status: string;
  publication_date: string;
  opening_date: string;
  classification_code: string;
  source_url: string;
  detail_documents_count?: number;
  detail_change_summary?: string;
  detail_change_at?: string;
  opening_status?: string;
  opening_summary?: string;
  participant_count?: number;
  offer_count?: number;
  inadmissible_count?: number;
  opening_result_updated_at?: string;
};

export type LegalCaseRecord = {
  case_key: string;
  company_name: string;
  contact_email: string;
  follow_up_status: string;
  assigned_to: string;
  assigned_team: string;
  note: string;
  priority_label: string;
  next_step: string;
  target_date: string;
  updated_by: string;
  updated_at: string;
};

export type LegalCaseEventRecord = {
  id: string;
  case_key: string;
  event_type: string;
  actor_email: string;
  summary: string;
  note: string;
  follow_up_status: string;
  assigned_to: string;
  next_step: string;
  target_date: string;
  created_at: string;
};

export type LegalTimelineEvent = {
  id: string;
  event_type: string;
  actor_email: string;
  summary: string;
  note: string;
  follow_up_status: string;
  assigned_to: string;
  next_step: string;
  target_date: string;
  created_at: string;
};

export type LegalQueueRow = {
  case_key: string;
  status: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_website: string;
  company_province: string;
  company_experience: string;
  company_capacity: string;
  company_products: string;
  company_summary: string;
  request_count: number;
  latest_request_service: string;
  latest_request_status: string;
  latest_request_at: string;
  latest_opportunity_id: string;
  latest_opportunity_title: string;
  latest_institution: string;
  procurement_type: string;
  procurement_status: string;
  procurement_publication_date: string;
  procurement_opening_date: string;
  procurement_classification_code: string;
  procurement_source_url: string;
  procurement_detail_documents_count: number;
  procurement_detail_change_summary: string;
  procurement_detail_change_at: string;
  procurement_opening_status: string;
  procurement_opening_summary: string;
  procurement_participant_count: number;
  procurement_offer_count: number;
  procurement_inadmissible_count: number;
  procurement_opening_result_updated_at: string;
  legal_label: string;
  legal_tone: "good" | "warn" | "risk";
  follow_up_status: string;
  assigned_to: string;
  assigned_team: string;
  note: string;
  priority_label: string;
  next_step: string;
  target_date: string;
  updated_by: string;
  updated_at: string;
  sla_bucket: "critico" | "hoy" | "esta-semana" | "estable";
  urgency_label: string;
  age_days: number;
  timeline: LegalTimelineEvent[];
};

const FOLLOW_UP_STATUSES = new Set([
  "Sin estado",
  "Pendiente contacto",
  "En revisión",
  "Documentos recibidos",
  "Listo para oferta",
]);

const LEGAL_PRIORITY: Record<string, number> = {
  "Listo para Legal": 0,
  "Falta completar ficha": 1,
  "Contacto mínimo": 2,
};

const FOLLOW_UP_PRIORITY: Record<string, number> = {
  "Pendiente contacto": 0,
  "En revisión": 1,
  "Documentos recibidos": 2,
  "Listo para oferta": 3,
  "Sin estado": 4,
};

const SLA_PRIORITY: Record<LegalQueueRow["sla_bucket"], number> = {
  critico: 0,
  hoy: 1,
  "esta-semana": 2,
  estable: 3,
};

function text(value: unknown, maximum = 2_000) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function normalizeFollowUpStatus(value: unknown) {
  const status = text(value, 80);
  return FOLLOW_UP_STATUSES.has(status) ? status : "Sin estado";
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[-\s]+/g, "-")
    .slice(0, 120);
}

function sicopSourceUrl(value: unknown) {
  const sourceUrl = text(value, 2_000);
  try {
    const url = new URL(sourceUrl);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "sicop.go.cr" || host.endsWith(".sicop.go.cr"))
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

export function buildLegalCaseKey(profile?: Partial<PortalProfileRecord> | null, request?: Partial<ServiceRequestRecord> | null) {
  const requestId = text(request?.id, 120).toLowerCase();
  if (requestId) return `request:${requestId}`;
  const email = text(profile?.contact_email || request?.contact_email, 240).toLowerCase();
  if (email) return `email:${email}`;
  const profileId = text(profile?.id, 120).toLowerCase();
  if (profileId) return `profile:${profileId}`;
  const company = slug(text(profile?.company_name || request?.company_name, 240));
  if (company) return `company:${company}`;
  return "case:sin-clave";
}

function buildLegalReadiness(row: Pick<LegalQueueRow,
  | "contact_email"
  | "contact_phone"
  | "company_products"
  | "company_summary"
  | "company_website"
  | "company_experience"
  | "company_capacity"
  | "latest_opportunity_title"
  | "request_count"
>) {
  const email = text(row.contact_email, 240);
  const phone = text(row.contact_phone, 80);
  const products = text(row.company_products, 2_000);
  const summary = text(row.company_summary, 2_000);
  const website = text(row.company_website, 500);
  const experience = text(row.company_experience, 200);
  const capacity = text(row.company_capacity, 200);
  const latestOpportunity = text(row.latest_opportunity_title, 500);
  const checks = {
    contact: Boolean(email && phone),
    opportunity: Boolean(latestOpportunity || row.request_count),
    commercial: Boolean(products),
    context: Boolean(summary || website),
    capacity: Boolean(experience && experience !== "Sin detalle" && capacity && capacity !== "Sin detalle"),
  };
  const complete = Object.values(checks).filter(Boolean).length;
  const missing: string[] = [];
  if (!checks.contact) missing.push("contacto verificable");
  if (!checks.opportunity) missing.push("oferta identificada");
  if (!checks.commercial) missing.push("giro comercial");
  if (!checks.context) missing.push("resumen o presencia comercial");
  if (!checks.capacity) missing.push("capacidad y experiencia");
  if (complete >= 5) {
    return {
      label: "Listo para Legal",
      tone: "good" as const,
      detail: "La ficha tiene contacto, oferta, actividad y contexto suficiente para iniciar gestión.",
    };
  }
  if (complete >= 3) {
    return {
      label: "Falta completar ficha",
      tone: "warn" as const,
      detail: `Antes de avanzar conviene completar: ${missing.join(", ")}.`,
    };
  }
  return {
    label: "Contacto mínimo",
    tone: "risk" as const,
    detail: "Hay interés comercial, pero faltan datos base para que Legal intervenga con seguridad.",
  };
}

export function buildLegalNextStep(row: Pick<LegalQueueRow, "follow_up_status" | "legal_label">) {
  const followUpStatus = normalizeFollowUpStatus(row.follow_up_status);
  const legalLabel = text(row.legal_label, 80);
  if (followUpStatus === "Pendiente contacto") {
    return "Contactar al cliente y pedir documentos legales base.";
  }
  if (followUpStatus === "En revisión") {
    return "Revisar pliego, riesgos y documentos recibidos.";
  }
  if (followUpStatus === "Documentos recibidos") {
    return "Validar vigencia y brechas de los documentos enviados.";
  }
  if (followUpStatus === "Listo para oferta") {
    return "Coordinar cierre legal y presentación de la oferta.";
  }
  if (legalLabel === "Listo para Legal") {
    return "Asignar caso a Legal y abrir revisión del expediente.";
  }
  if (legalLabel === "Falta completar ficha") {
    return "Completar ficha comercial antes de escalar a Legal.";
  }
  return "Solicitar contacto verificable y datos base del cliente.";
}

function compareIsoDescending(left: string, right: string) {
  return right.localeCompare(left);
}

function parseIsoDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function wholeDaysBetween(older: Date, newer: Date) {
  return Math.max(0, Math.floor((newer.getTime() - older.getTime()) / 86_400_000));
}

function buildLegalSla(row: Pick<LegalQueueRow, "latest_request_at" | "updated_at" | "follow_up_status" | "legal_label" | "target_date">) {
  const targetDateValue = text(row.target_date, 40);
  if (targetDateValue) {
    const targetDate = new Date(`${targetDateValue}T00:00:00`);
    if (!Number.isNaN(targetDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / 86_400_000);
      if (diffDays < 0) {
        return {
          sla_bucket: "critico" as const,
          urgency_label: `Vencido desde ${targetDateValue}`,
          age_days: Math.abs(diffDays),
        };
      }
      if (diffDays <= 1) {
        return {
          sla_bucket: "hoy" as const,
          urgency_label: `Fecha objetivo: ${targetDateValue}`,
          age_days: 0,
        };
      }
      if (diffDays <= 7) {
        return {
          sla_bucket: "esta-semana" as const,
          urgency_label: `Objetivo esta semana: ${targetDateValue}`,
          age_days: 0,
        };
      }
    }
  }
  const anchor = parseIsoDate(text(row.latest_request_at, 80) || text(row.updated_at, 80));
  if (!anchor) {
    return {
      sla_bucket: "estable" as const,
      urgency_label: "Sin fecha base",
      age_days: 0,
    };
  }
  const ageDays = wholeDaysBetween(anchor, new Date());
  const followUp = normalizeFollowUpStatus(row.follow_up_status);
  const legalLabel = text(row.legal_label, 80);
  if ((followUp === "Pendiente contacto" || followUp === "Sin estado") && ageDays >= 3) {
    return {
      sla_bucket: "critico" as const,
      urgency_label: `Critico: ${ageDays} dia(s) sin movimiento`,
      age_days: ageDays,
    };
  }
  if (followUp === "En revisión" && ageDays >= 2) {
    return {
      sla_bucket: "hoy" as const,
      urgency_label: `Atender hoy: ${ageDays} dia(s) en revision`,
      age_days: ageDays,
    };
  }
  if (legalLabel === "Listo para Legal" && ageDays >= 1) {
    return {
      sla_bucket: "esta-semana" as const,
      urgency_label: `Mover esta semana: ${ageDays} dia(s) listo para Legal`,
      age_days: ageDays,
    };
  }
  return {
    sla_bucket: "estable" as const,
    urgency_label: ageDays ? `${ageDays} dia(s) desde la ultima actividad` : "Actividad reciente",
    age_days: ageDays,
  };
}

export function buildLegalQueue(
  profiles: PortalProfileRecord[],
  requests: ServiceRequestRecord[],
  legalCases: LegalCaseRecord[],
  legalCaseEvents: LegalCaseEventRecord[] = [],
  opportunities: PortalOpportunityRecord[] = [],
) {
  const caseMap = new Map<string, LegalCaseRecord>(
    legalCases.map((entry) => [text(entry.case_key, 200).toLowerCase(), entry]),
  );
  const eventMap = new Map<string, LegalTimelineEvent[]>();
  const opportunityMap = new Map(
    opportunities.map((entry) => [text(entry.procedure_no, 120), entry]),
  );
  for (const event of legalCaseEvents) {
    const key = text(event.case_key, 200).toLowerCase();
    const bucket = eventMap.get(key) || [];
    bucket.push({
      id: text(event.id, 240),
      event_type: text(event.event_type, 80) || "updated",
      actor_email: text(event.actor_email, 240),
      summary: text(event.summary, 1_000),
      note: text(event.note, 8_000),
      follow_up_status: text(event.follow_up_status, 120),
      assigned_to: text(event.assigned_to, 240),
      next_step: text(event.next_step, 500),
      target_date: text(event.target_date, 40),
      created_at: text(event.created_at, 80),
    });
    eventMap.set(key, bucket);
  }
  const rows = new Map<string, LegalQueueRow>();
  const profileByEmail = new Map(
    profiles
      .filter((profile) => text(profile.contact_email, 240))
      .map((profile) => [text(profile.contact_email, 240).toLowerCase(), profile]),
  );
  const requestEmails = new Set(
    requests.map((request) => text(request.contact_email, 240).toLowerCase()).filter(Boolean),
  );

  const ensureRow = (caseKey: string) => {
    const normalizedKey = text(caseKey, 200).toLowerCase();
    const existing = rows.get(normalizedKey);
    if (existing) return existing;
    const created: LegalQueueRow = {
      case_key: normalizedKey,
      status: "Solo solicitud",
      company_name: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      company_website: "",
      company_province: "",
      company_experience: "",
      company_capacity: "",
      company_products: "",
      company_summary: "",
      request_count: 0,
      latest_request_service: "",
      latest_request_status: "",
      latest_request_at: "",
      latest_opportunity_id: "",
      latest_opportunity_title: "",
      latest_institution: "",
      procurement_type: "",
      procurement_status: "",
      procurement_publication_date: "",
      procurement_opening_date: "",
      procurement_classification_code: "",
      procurement_source_url: "",
      procurement_detail_documents_count: 0,
      procurement_detail_change_summary: "",
      procurement_detail_change_at: "",
      procurement_opening_status: "",
      procurement_opening_summary: "",
      procurement_participant_count: 0,
      procurement_offer_count: 0,
      procurement_inadmissible_count: 0,
      procurement_opening_result_updated_at: "",
      legal_label: "",
      legal_tone: "warn",
      follow_up_status: "Sin estado",
      assigned_to: "",
      assigned_team: "Legal",
      note: "",
      priority_label: "",
      next_step: "",
      target_date: "",
      updated_by: "",
      updated_at: "",
      sla_bucket: "estable",
      urgency_label: "",
      age_days: 0,
      timeline: [],
    };
    rows.set(normalizedKey, created);
    return created;
  };

  for (const profile of profiles) {
    if (requestEmails.has(text(profile.contact_email, 240).toLowerCase())) continue;
    const caseKey = buildLegalCaseKey(profile, null);
    const row = ensureRow(caseKey);
    row.company_name = text(profile.company_name, 240) || row.company_name;
    row.contact_name = text(profile.contact_name, 240) || row.contact_name;
    row.contact_email = text(profile.contact_email, 240) || row.contact_email;
    row.contact_phone = text(profile.contact_phone, 80) || row.contact_phone;
    row.company_website = text(profile.company_website, 500) || row.company_website;
    row.company_province = text(profile.company_province, 120) || row.company_province;
    row.company_experience = text(profile.company_experience, 200) || row.company_experience;
    row.company_capacity = text(profile.company_capacity, 200) || row.company_capacity;
    row.company_products = text(profile.company_products, 2_000) || row.company_products;
    row.company_summary = text(profile.company_summary, 2_000) || row.company_summary;
    row.updated_at = text(profile.updated_at, 80) || row.updated_at;
    row.status = row.request_count > 0 ? "Perfil + solicitudes" : "Perfil registrado";
  }

  for (const request of requests) {
    const caseKey = buildLegalCaseKey(null, request);
    const row = ensureRow(caseKey);
    const profile = profileByEmail.get(text(request.contact_email, 240).toLowerCase());
    row.company_name = text(request.company_name || profile?.company_name, 240) || row.company_name;
    row.contact_name = text(request.contact_name || profile?.contact_name, 240) || row.contact_name;
    row.contact_email = text(request.contact_email || profile?.contact_email, 240) || row.contact_email;
    row.contact_phone = text(request.contact_phone || profile?.contact_phone, 80) || row.contact_phone;
    row.company_website = text(request.company_website || profile?.company_website, 500) || row.company_website;
    row.company_province = text(request.company_province || profile?.company_province, 120) || row.company_province;
    row.company_experience = text(request.company_experience || profile?.company_experience, 200) || row.company_experience;
    row.company_capacity = text(request.company_capacity || profile?.company_capacity, 200) || row.company_capacity;
    row.company_products = text(request.company_products || profile?.company_products, 2_000) || row.company_products;
    row.company_summary = text(request.company_summary || profile?.company_summary, 2_000) || row.company_summary;
    row.request_count += 1;
    const createdAt = text(request.created_at, 80);
    if (!row.latest_request_at || compareIsoDescending(row.latest_request_at, createdAt) > 0) {
      row.latest_request_service = text(request.service, 120);
      row.latest_request_status = text(request.status, 120);
      row.latest_request_at = createdAt;
      row.latest_opportunity_id = text(request.opportunity_id, 120);
      row.latest_opportunity_title = text(request.opportunity_title, 500);
      row.latest_institution = text(request.institution, 500);
    }
    row.updated_at = createdAt || row.updated_at;
    row.status = row.company_name || row.contact_email ? "Perfil + solicitudes" : "Solo solicitud";
  }

  const queue = Array.from(rows.values()).map((row) => {
    const opportunity = opportunityMap.get(row.latest_opportunity_id);
    row.procurement_type = text(opportunity?.procedure_type, 120);
    row.procurement_status = text(opportunity?.status, 120);
    row.procurement_publication_date = text(opportunity?.publication_date, 80);
    row.procurement_opening_date = text(opportunity?.opening_date, 80);
    row.procurement_classification_code = text(opportunity?.classification_code, 120);
    row.procurement_source_url = sicopSourceUrl(opportunity?.source_url);
    row.procurement_detail_documents_count = Number(opportunity?.detail_documents_count || 0);
    row.procurement_detail_change_summary = text(opportunity?.detail_change_summary, 2_000);
    row.procurement_detail_change_at = text(opportunity?.detail_change_at, 80);
    row.procurement_opening_status = text(opportunity?.opening_status, 240);
    row.procurement_opening_summary = text(opportunity?.opening_summary, 4_000);
    row.procurement_participant_count = Number(opportunity?.participant_count || 0);
    row.procurement_offer_count = Number(opportunity?.offer_count || 0);
    row.procurement_inadmissible_count = Number(opportunity?.inadmissible_count || 0);
    row.procurement_opening_result_updated_at = text(opportunity?.opening_result_updated_at, 80);
    const readiness = buildLegalReadiness(row);
    const legacyCaseKey = row.contact_email ? `email:${row.contact_email.toLowerCase()}` : "";
    const legalCase = caseMap.get(row.case_key) || caseMap.get(legacyCaseKey);
    row.legal_label = readiness.label;
    row.legal_tone = readiness.tone;
    row.follow_up_status = normalizeFollowUpStatus(legalCase?.follow_up_status);
    row.assigned_to = text(legalCase?.assigned_to, 240);
    row.assigned_team = text(legalCase?.assigned_team, 120) || "Legal";
    row.note = text(legalCase?.note, 8_000);
    row.priority_label = text(legalCase?.priority_label, 160) || readiness.label;
    row.next_step = text(legalCase?.next_step, 500) || buildLegalNextStep(row);
    row.target_date = text(legalCase?.target_date, 40);
    row.updated_by = text(legalCase?.updated_by, 160);
    row.updated_at = text(legalCase?.updated_at, 80) || row.latest_request_at || row.updated_at;
    const sla = buildLegalSla(row);
    row.sla_bucket = sla.sla_bucket;
    row.urgency_label = sla.urgency_label;
    row.age_days = sla.age_days;
    row.timeline = (eventMap.get(row.case_key) || eventMap.get(legacyCaseKey) || []).sort((left, right) => compareIsoDescending(left.created_at, right.created_at));
    return row;
  });

  queue.sort((left, right) => {
    const slaPriority =
      (SLA_PRIORITY[left.sla_bucket] ?? Number.MAX_SAFE_INTEGER) -
      (SLA_PRIORITY[right.sla_bucket] ?? Number.MAX_SAFE_INTEGER);
    if (slaPriority !== 0) return slaPriority;
    const legalPriority =
      (LEGAL_PRIORITY[left.legal_label] ?? Number.MAX_SAFE_INTEGER) -
      (LEGAL_PRIORITY[right.legal_label] ?? Number.MAX_SAFE_INTEGER);
    if (legalPriority !== 0) return legalPriority;
    const followUpPriority =
      (FOLLOW_UP_PRIORITY[left.follow_up_status] ?? Number.MAX_SAFE_INTEGER) -
      (FOLLOW_UP_PRIORITY[right.follow_up_status] ?? Number.MAX_SAFE_INTEGER);
    if (followUpPriority !== 0) return followUpPriority;
    if (left.request_count !== right.request_count) {
      return right.request_count - left.request_count;
    }
    const latestActivity = compareIsoDescending(left.latest_request_at || left.updated_at, right.latest_request_at || right.updated_at);
    if (latestActivity !== 0) return latestActivity;
    return left.company_name.localeCompare(right.company_name);
  });

  return queue;
}

export function buildLegalQueueSummary(rows: LegalQueueRow[]) {
  const total = rows.length;
  const ready = rows.filter((row) => row.legal_label === "Listo para Legal").length;
  const inReview = rows.filter((row) => row.follow_up_status === "En revisión").length;
  const pendingContact = rows.filter((row) => row.follow_up_status === "Pendiente contacto").length;
  const critical = rows.filter((row) => row.sla_bucket === "critico").length;
  return `Casos legales: ${total} · criticos: ${critical} · listos para Legal: ${ready} · en revisión: ${inReview} · pendientes de contacto: ${pendingContact}`;
}

export function excludeDismissedLegalCases(
  queue: LegalQueueRow[],
  dismissedCaseKeys: Iterable<string>,
) {
  const dismissed = new Set(dismissedCaseKeys);
  return queue.filter((entry) => !dismissed.has(entry.case_key));
}