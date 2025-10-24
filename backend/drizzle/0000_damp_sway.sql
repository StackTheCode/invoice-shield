CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"api_key" varchar(255) NOT NULL,
	"tier" varchar(50) DEFAULT 'free',
	"monthly_quota" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "companies_email_unique" UNIQUE("email"),
	CONSTRAINT "companies_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "fraud_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"rule_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true,
	"weight" integer DEFAULT 10,
	"config" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"file_type" varchar(50),
	"vendor_name" varchar(255),
	"vendor_vat" varchar(50),
	"vendor_iban" varchar(50),
	"vendor_email" varchar(255),
	"invoice_number" varchar(100),
	"invoice_date" timestamp,
	"due_date" timestamp,
	"total_amount" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'EUR',
	"risk_score" integer,
	"status" varchar(50) DEFAULT 'pending',
	"fraud_indicators" jsonb,
	"ocr_confidence" numeric(5, 2),
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now(),
	"analyzed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"vat_number" varchar(50),
	"iban" varchar(50),
	"email" varchar(255),
	"phone" varchar(50),
	"address" text,
	"is_verified" boolean DEFAULT false,
	"verification_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;