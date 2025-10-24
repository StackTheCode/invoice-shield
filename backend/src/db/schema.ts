import { pgTable, uuid, varchar, timestamp, decimal, integer, boolean, jsonb, text } from 'drizzle-orm/pg-core';

// Companies using the service
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  apiKey: varchar('api_key', { length: 255 }).unique().notNull(),
  tier: varchar('tier', { length: 50 }).default('free'),
  monthlyQuota: integer('monthly_quota').default(50),
  createdAt: timestamp('created_at').defaultNow(),
});

// Verified vendors (whitelist)
export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  vatNumber: varchar('vat_number', { length: 50 }),
  iban: varchar('iban', { length: 50 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  isVerified: boolean('is_verified').default(false),
  verificationDate: timestamp('verification_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invoices uploaded for verification
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  
  // File info
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  fileType: varchar('file_type', { length: 50 }),
  
  // Extracted data from OCR
  vendorName: varchar('vendor_name', { length: 255 }),
  vendorVat: varchar('vendor_vat', { length: 50 }),
  vendorIban: varchar('vendor_iban', { length: 50 }),
  vendorEmail: varchar('vendor_email', { length: 255 }),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  invoiceDate: timestamp('invoice_date'),
  dueDate: timestamp('due_date'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // Analysis results
  riskScore: integer('risk_score'), // 0-100
  status: varchar('status', { length: 50 }).default('pending'), // pending, safe, suspicious, fraudulent
  fraudIndicators: jsonb('fraud_indicators'), // Array of issues found
  
  ocrConfidence: decimal('ocr_confidence', { precision: 5, scale: 2 }),
  processingTimeMs: integer('processing_time_ms'),
  
  createdAt: timestamp('created_at').defaultNow(),
  analyzedAt: timestamp('analyzed_at'),
});

// Fraud detection rules
export const fraudRules = pgTable('fraud_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ruleType: varchar('rule_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), 
  isActive: boolean('is_active').default(true),
  weight: integer('weight').default(10),
  config: jsonb('config'),
  createdAt: timestamp('created_at').defaultNow(),
});