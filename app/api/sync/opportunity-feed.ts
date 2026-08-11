export type PublicOpportunityRecord = {
  procedure_no: string;
  cartel_no: string;
  title: string;
  institution: string;
  procedure_type: string;
  status: string;
  publication_date: string;
  opening_date: string;
  classification_code: string;
  source_url: string;
  public_visible: boolean;
  detail_documents_count: number;
  detail_change_summary: string;
  detail_change_at: string;
  opening_status: string;
  opening_summary: string;
  participant_count: number;
  offer_count: number;
  inadmissible_count: number;
  opening_result_updated_at: string;
};

export type ValidatedOpportunityFeed = {
  generated_at: string;
  source_updated_at: string;
  opportunities: PublicOpportunityRecord[];
};

const text = (value: unknown, maximum: number) =>
  typeof value === "string" ? value.trim().slice(0, maximum) : "";

const nonNegativeInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
};

function publicSicopUrl(value: unknown) {
  const candidate = text(value, 2_000);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      !["sicop.go.cr", "www.sicop.go.cr"].includes(url.hostname)
    ) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

export function validateOpportunityFeed(payload: unknown): ValidatedOpportunityFeed {
  if (!payload || typeof payload !== "object") {
    throw new Error("El paquete de oportunidades no es válido.");
  }
  const feed = payload as Record<string, unknown>;
  if (!Array.isArray(feed.opportunities) || feed.opportunities.length > 2_000) {
    throw new Error("La lista de oportunidades no es válida.");
  }

  const opportunities = feed.opportunities.map((value, index) => {
    if (!value || typeof value !== "object") {
      throw new Error(`La oportunidad ${index + 1} no es válida.`);
    }
    const item = value as Record<string, unknown>;
    const procedureNo = text(item.procedure_no, 120);
    const title = text(item.title, 1_000);
    const openingDate = text(item.opening_date, 20);
    if (!procedureNo || !title || !/^\d{4}-\d{2}-\d{2}$/.test(openingDate)) {
      throw new Error(`La oportunidad ${index + 1} está incompleta.`);
    }
    return {
      procedure_no: procedureNo,
      cartel_no: text(item.cartel_no, 120),
      title,
      institution: text(item.institution, 500),
      procedure_type: text(item.procedure_type, 120),
      status: text(item.status, 200),
      publication_date: text(item.publication_date, 20),
      opening_date: openingDate,
      classification_code: text(item.classification_code, 120),
      source_url: publicSicopUrl(item.source_url),
      public_visible: item.public_visible !== false,
      detail_documents_count: nonNegativeInteger(item.detail_documents_count),
      detail_change_summary: text(item.detail_change_summary, 2_000),
      detail_change_at: text(item.detail_change_at, 80),
      opening_status: text(item.opening_status, 240),
      opening_summary: text(item.opening_summary, 4_000),
      participant_count: nonNegativeInteger(item.participant_count),
      offer_count: nonNegativeInteger(item.offer_count),
      inadmissible_count: nonNegativeInteger(item.inadmissible_count),
      opening_result_updated_at: text(item.opening_result_updated_at, 80),
    };
  });

  return {
    generated_at: text(feed.generated_at, 80) || new Date().toISOString(),
    source_updated_at: text(feed.source_updated_at, 80),
    opportunities,
  };
}

export function hasValidSyncToken(header: string | null, expected: string | undefined) {
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const supplied = header.slice(7);
  if (supplied.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < supplied.length; index += 1) {
    difference |= supplied.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}
