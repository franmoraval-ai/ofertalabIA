export type ValidatedProfileRecord = {
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown, maximum: number) =>
  typeof value === "string" ? value.trim().slice(0, maximum) : "";

export function validateProfileRecord(payload: unknown): ValidatedProfileRecord {
  if (!payload || typeof payload !== "object") {
    throw new Error("El perfil de empresa no es válido.");
  }
  const item = payload as Record<string, unknown>;

  const id = text(item.id, 120);
  const companyName = text(item.company_name, 200);
  const contactName = text(item.contact_name, 200);
  const contactEmail = text(item.contact_email, 200).toLowerCase();
  const companyProducts = text(item.company_products, 1_500);

  if (!id) {
    throw new Error("El perfil no tiene identificador.");
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

  const now = new Date().toISOString();

  return {
    id,
    company_name: companyName,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: text(item.contact_phone, 80),
    company_website: text(item.company_website, 200),
    company_province: text(item.company_province, 120),
    company_experience: text(item.company_experience, 200),
    company_capacity: text(item.company_capacity, 120),
    company_products: companyProducts,
    company_summary: text(item.company_summary, 1_000),
    created_at: text(item.created_at, 80) || now,
    updated_at: now,
  };
}

export function validateProfileDelete(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("La solicitud de eliminación no es válida.");
  }
  const item = payload as Record<string, unknown>;
  const id = text(item.id, 120);
  if (!id) {
    throw new Error("El perfil no tiene identificador.");
  }
  return { id };
}