ALTER TABLE "portal_opportunities" ADD COLUMN "public_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_opportunities" ADD COLUMN "detail_documents_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_opportunities" ADD COLUMN "detail_change_summary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_opportunities" ADD COLUMN "detail_change_at" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_opportunities" ADD COLUMN "opening_status" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_opportunities" ADD COLUMN "opening_summary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_opportunities" ADD COLUMN "participant_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_opportunities" ADD COLUMN "offer_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_opportunities" ADD COLUMN "inadmissible_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_opportunities" ADD COLUMN "opening_result_updated_at" text DEFAULT '' NOT NULL;