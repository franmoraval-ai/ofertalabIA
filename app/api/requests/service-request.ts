export const SERVICE_KEYS = ["autogestion", "asistida", "integral"] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];

export type ValidatedServiceRequest = {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  institution: string;
  service: ServiceKey;
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
  contact_info: string;
  status: string;
  created_at: string;
};

const text = (value: unknown, maximum: number) =>
  typeof value === "string" ? value.trim().slice(0, maximum) : "";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const companyName = text(item.company_name, 200);
  const contactName = text(item.contact_name, 200);
  const contactEmail = text(item.contact_email, 200).toLowerCase();
  const contactPhone = text(item.contact_phone, 80);
  const companyWebsite = text(item.company_website, 200);
  const companyProvince = text(item.company_province, 120);
  const companyExperience = text(item.company_experience, 200);
  const companyCapacity = text(item.company_capacity, 120);
  const companyProducts = text(item.company_products, 1_500);
  const companySummary = text(item.company_summary, 1_000);
  if (!opportunityId || !opportunityTitle) {
    throw new Error("La solicitud está incompleta.");
  }
  if (!isServiceKey(service)) {
    throw new Error("El servicio solicitado no es válido.");
  }
  if (!companyName || !contactName) {
    throw new Error("Indique la empresa y la persona de contacto.");
  }
  if (!contactEmail || !EMAIL_PATTERN.test(contactEmail)) {
    throw new Error("Indique un correo electrónico válido.");
  }
  if (!companyProducts) {
    throw new Error("Describa qué vende o qué servicios ofrece la empresa.");
  }

  const contactInfo = [contactEmail, contactPhone].filter(Boolean).join(" · ");

  return {
    id: `${opportunityId}::${service}`,
    opportunity_id: opportunityId,
    opportunity_title: opportunityTitle,
    institution: text(item.institution, 500),
    service,
    company_name: companyName,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    company_website: companyWebsite,
    company_province: companyProvince,
    company_experience: companyExperience,
    company_capacity: companyCapacity,
    company_products: companyProducts,
    company_summary: companySummary,
    contact_info: contactInfo,
    status: "Solicitada",
    created_at: new Date().toISOString(),
  };
}
