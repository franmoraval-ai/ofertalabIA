export type VerticeLegalIntake = {
  procedure: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  detail: string;
};

export function procedureKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "consulta";
}

export function buildVerticeLegalRequest(intake: VerticeLegalIntake) {
  const procedure = intake.procedure.trim() || "Consulta legal";
  const email = intake.email.trim().toLowerCase();

  return {
    opportunity_id: `vertice-legal:${procedureKey(procedure)}:${email}`,
    opportunity_title: `Gestión Vértice Legal: ${procedure}`,
    institution: "Vértice Legal",
    service: "integral" as const,
    company_name: intake.company.trim(),
    contact_name: intake.contact.trim(),
    contact_email: email,
    contact_phone: intake.phone.trim(),
    company_website: "",
    company_province: "Costa Rica",
    company_experience: "Consulta de trámite",
    company_capacity: "Por definir",
    company_products: procedure,
    company_summary: intake.detail.trim(),
  };
}