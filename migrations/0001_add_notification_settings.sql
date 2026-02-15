CREATE TABLE "notification_settings" (
	"id" varchar PRIMARY KEY DEFAULT 'default' NOT NULL,
	"notification_email" varchar,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
