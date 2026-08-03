import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const portalOpportunities = pgTable("portal_opportunities", {
  procedureNo: text("procedure_no").primaryKey(),
  cartelNo: text("cartel_no").notNull().default(""),
  title: text("title").notNull(),
  institution: text("institution").notNull().default(""),
  procedureType: text("procedure_type").notNull().default(""),
  status: text("status").notNull().default(""),
  publicationDate: text("publication_date").notNull().default(""),
  openingDate: text("opening_date").notNull(),
  classificationCode: text("classification_code").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
});

export const portalSyncState = pgTable("portal_sync_state", {
  id: integer("id").primaryKey(),
  generatedAt: text("generated_at").notNull(),
  sourceUpdatedAt: text("source_updated_at").notNull().default(""),
  opportunityCount: integer("opportunity_count").notNull().default(0),
});

export const portalProfiles = pgTable("portal_profiles", {
  id: text("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull().default(""),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull().default(""),
  companyWebsite: text("company_website").notNull().default(""),
  companyProvince: text("company_province").notNull().default(""),
  companyExperience: text("company_experience").notNull().default(""),
  companyCapacity: text("company_capacity").notNull().default(""),
  companyProducts: text("company_products").notNull().default(""),
  companySummary: text("company_summary").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const serviceRequests = pgTable("service_requests", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id").notNull(),
  opportunityTitle: text("opportunity_title").notNull(),
  institution: text("institution").notNull().default(""),
  service: text("service").notNull(),
  contactName: text("contact_name").notNull().default(""),
  contactInfo: text("contact_info").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  companyWebsite: text("company_website").notNull().default(""),
  companyProvince: text("company_province").notNull().default(""),
  companyExperience: text("company_experience").notNull().default(""),
  companyCapacity: text("company_capacity").notNull().default(""),
  companyProducts: text("company_products").notNull().default(""),
  companySummary: text("company_summary").notNull().default(""),
  status: text("status").notNull().default("Solicitada"),
  createdAt: text("created_at").notNull(),
});
