CREATE TABLE "portal_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"company_website" text DEFAULT '' NOT NULL,
	"company_province" text DEFAULT '' NOT NULL,
	"company_experience" text DEFAULT '' NOT NULL,
	"company_capacity" text DEFAULT '' NOT NULL,
	"company_products" text DEFAULT '' NOT NULL,
	"company_summary" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "company_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "contact_email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "contact_phone" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "company_website" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "company_province" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "company_experience" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "company_capacity" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "company_products" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "company_summary" text DEFAULT '' NOT NULL;