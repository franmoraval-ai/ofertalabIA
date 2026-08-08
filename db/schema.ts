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

export const legalCases = pgTable("legal_cases", {
  caseKey: text("case_key").primaryKey(),
  companyName: text("company_name").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  followUpStatus: text("follow_up_status").notNull().default("Sin estado"),
  assignedTo: text("assigned_to").notNull().default(""),
  assignedTeam: text("assigned_team").notNull().default("Legal"),
  note: text("note").notNull().default(""),
  priorityLabel: text("priority_label").notNull().default(""),
  nextStep: text("next_step").notNull().default(""),
  targetDate: text("target_date").notNull().default(""),
  updatedBy: text("updated_by").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

export const legalCaseEvents = pgTable("legal_case_events", {
  id: text("id").primaryKey(),
  caseKey: text("case_key").notNull(),
  eventType: text("event_type").notNull().default("updated"),
  actorEmail: text("actor_email").notNull().default(""),
  summary: text("summary").notNull().default(""),
  note: text("note").notNull().default(""),
  followUpStatus: text("follow_up_status").notNull().default("Sin estado"),
  assignedTo: text("assigned_to").notNull().default(""),
  nextStep: text("next_step").notNull().default(""),
  targetDate: text("target_date").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const legalDismissedCases = pgTable("legal_dismissed_cases", {
  caseKey: text("case_key").primaryKey(),
  dismissedBy: text("dismissed_by").notNull(),
  dismissedAt: text("dismissed_at").notNull(),
});

export const legalStaff = pgTable("legal_staff", {
  email: text("email").primaryKey(),
  fullName: text("full_name").notNull().default(""),
  team: text("team").notNull().default("Legal"),
  role: text("role").notNull().default("member"),
  active: text("active").notNull().default("true"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
