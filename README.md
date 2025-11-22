# InvoiceShield

A fraud detection system for business invoices. Upload invoices, extract data automatically, and get real-time fraud risk assessments.

## What it does

Companies get scammed by fake invoices all the time - someone impersonates a real vendor, changes the bank account number, and steals payments. This tool catches that before you pay.

**How it works:**
1. Upload an invoice (PDF or image)
2. OCR extracts the text automatically
3. System parses vendor details, amounts, IBAN, VAT numbers
4. Runs fraud checks against your trusted vendor list
5. Returns a risk score and flags suspicious patterns

## Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (Drizzle ORM)
- Tesseract.js for OCR
- pdf-parse for PDF text extraction

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

**Structure:**
- Monorepo setup with separate frontend/backend
- Shared TypeScript types between services

**API Routes:**




**Authentication**

| Method | Endpoint           |             Description     |
|--------|--------------------|-----------------------------|
| POST   | /api/auth/register | Register new user & company |
| POST   | /api/auth/login    | Login and get JWT token     |
| GET    | /api/auth/me       | Get current user info       | 



| Method | Endpoint                       | Description                | 
|--------|--------------------------------|----------------------------|
| POST   | /api/invoices/upload           | Upload invoice (PDF/image) | 
| POST   | /api/invoices/:id/analyze      | Run OCR + fraud detection  |
| GET    | /api/invoices                  | List all invoices          | 
| GET    | /api/invoices/:id              | Get invoice details        |
