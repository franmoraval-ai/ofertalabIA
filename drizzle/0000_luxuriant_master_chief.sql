CREATE TABLE `portal_opportunities` (
	`procedure_no` text PRIMARY KEY NOT NULL,
	`cartel_no` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`institution` text DEFAULT '' NOT NULL,
	`procedure_type` text DEFAULT '' NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`publication_date` text DEFAULT '' NOT NULL,
	`opening_date` text NOT NULL,
	`classification_code` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portal_sync_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`generated_at` text NOT NULL,
	`source_updated_at` text DEFAULT '' NOT NULL,
	`opportunity_count` integer DEFAULT 0 NOT NULL
);
