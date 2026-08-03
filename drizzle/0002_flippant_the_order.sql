CREATE TABLE "legal_cases" (
	"case_key" text PRIMARY KEY NOT NULL,
	"company_name" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"follow_up_status" text DEFAULT 'Sin estado' NOT NULL,
	"assigned_to" text DEFAULT '' NOT NULL,
	"assigned_team" text DEFAULT 'Legal' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"priority_label" text DEFAULT '' NOT NULL,
	"next_step" text DEFAULT '' NOT NULL,
	"updated_by" text DEFAULT '' NOT NULL,
	"updated_at" text NOT NULL
);
