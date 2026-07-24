export const SERVICE_KEYS = ["autogestion", "asistida", "integral"] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];

export type ValidatedServiceRequest = {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  institution: string;
  service: ServiceKey;
  contact_name: string;
  contact_info: string;
  status: string;
  created_at: string;
};

const text = (value: unknown, maximum: number) =>
  typeof value === "string" ? value.trim().slice(0, maximum) : "";

function isServiceKey(value: string): value is ServiceKey {
  return (SERVICE_KEYS as readonly string[]).includes(value);
}

export function validateServiceRequest(payload: unknown): ValidatedServiceRequest {
  if (!payload || typeof payload !== "object") {
    throw new Error("La solicitud no es válida.");
  }
  const item = payload as Record<string, unknown>;

  const opportunityId = text(item.opportunity_id, 120);
  const opportunityTitle = text(item.opportunity_title, 1_000);
  const service = text(item.service, 40);
  if (!opportunityId || !opportunityTitle) {
    throw new Error("La solicitud está incompleta.");
  }
  if (!isServiceKey(service)) {
    throw new Error("El servicio solicitado no es válido.");
  }

  return {
    id: `${opportunityId}::${service}`,
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    institution: text(item.institution, 500),
    service,
    contact_name: text(item.contact_name, 200),
    contact_info: text(item.contact_info, 200),
    status: "Solicitada",
    created_at: new Date().toISOString(),
  };
}
