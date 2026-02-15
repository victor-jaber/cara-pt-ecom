CREATE TYPE "public"."eupago_mode" AS ENUM('sandbox', 'live');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."paypal_mode" AS ENUM('sandbox', 'live');--> statement-breakpoint
CREATE TYPE "public"."stripe_mode" AS ENUM('test', 'live');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."verification_type" AS ENUM('registration', 'email_change');--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"code" varchar(6) NOT NULL,
	"type" "verification_type" NOT NULL,
	"user_id" varchar,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "eupago_settings" (
	"id" varchar PRIMARY KEY DEFAULT 'default' NOT NULL,
	"api_key" varchar,
	"mode" "eupago_mode" DEFAULT 'sandbox' NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"shipping_address" text,
	"shipping_option_id" varchar,
	"shipping_cost" numeric(10, 2),
	"shipping_option_name" varchar,
	"notes" text,
	"payment_method" varchar,
	"payment_status" "payment_status" DEFAULT 'pending',
	"paypal_order_id" varchar,
	"paypal_capture_id" varchar,
	"payment_metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "paypal_settings" (
	"id" varchar PRIMARY KEY DEFAULT 'default' NOT NULL,
	"client_id" varchar,
	"client_secret" varchar,
	"mode" "paypal_mode" DEFAULT 'sandbox' NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"category" varchar,
	"description" text,
	"short_description" text,
	"price" numeric(10, 2) NOT NULL,
	"image" varchar,
	"particle_size" varchar,
	"needle_size" varchar,
	"injection_depth" varchar,
	"application_zones" text,
	"infodm_code" varchar,
	"in_stock" boolean DEFAULT true,
	"is_active" boolean DEFAULT true NOT NULL,
	"promotion_rules" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_options" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"estimated_days" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stripe_settings" (
	"id" varchar PRIMARY KEY DEFAULT 'default' NOT NULL,
	"publishable_key" varchar,
	"secret_key" varchar,
	"mode" "stripe_mode" DEFAULT 'test' NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"profile_image_url" varchar,
	"phone" varchar NOT NULL,
	"profession" varchar NOT NULL,
	"additional_info" text,
	"nif" varchar,
	"professional_license" varchar,
	"specialty" varchar,
	"clinic_name" varchar,
	"clinic_address" text,
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email_verifications_email" ON "email_verifications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_email_verifications_code" ON "email_verifications" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_email_verifications_expires" ON "email_verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");