import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const portalOpportunities = sqliteTable("portal_opportunities", {
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

export const portalSyncState = sqliteTable("portal_sync_state", {
  id: integer("id").primaryKey(),
  generatedAt: text("generated_at").notNull(),
  sourceUpdatedAt: text("source_updated_at").notNull().default(""),
  opportunityCount: integer("opportunity_count").notNull().default(0),
});
