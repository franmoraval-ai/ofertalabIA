CREATE TABLE "legal_case_events" (
	"id" text PRIMARY KEY NOT NULL,
	"case_key" text NOT NULL,
	"event_type" text DEFAULT 'updated' NOT NULL,
	"actor_email" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"follow_up_status" text DEFAULT 'Sin estado' NOT NULL,
	"assigned_to" text DEFAULT '' NOT NULL,
	"next_step" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL
);
