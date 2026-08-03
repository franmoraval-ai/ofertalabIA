ALTER TABLE "legal_case_events" ADD COLUMN "target_date" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "legal_cases" ADD COLUMN "target_date" text DEFAULT '' NOT NULL;