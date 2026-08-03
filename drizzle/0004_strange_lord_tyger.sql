CREATE TABLE "legal_staff" (
	"email" text PRIMARY KEY NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"team" text DEFAULT 'Legal' NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"active" text DEFAULT 'true' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
