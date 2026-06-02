# QuoteFlow — Claude Code Instructions

## Project Overview
QuoteFlow is a Quote-to-Invoice SaaS webapp for Indian SMBs (<10Cr revenue).
Built on Atomic CRM backend APIs (free). 
Stack: React+Vite+TS / Node+Express+TS / Python FastAPI OCR microservice.

## Architecture
- /frontend    → React webapp (port 3000)
- /backend     → Express API (port 4000)
- /ocr-service → Python OCR (port 8001)
- Atomic CRM   → External CRM backend (customer/deal storage)

---

## CRITICAL RULES — READ BEFORE EVERY TASK

### Code Quality
- TypeScript everywhere. Zero `any` types allowed.
- Zod for ALL validation — both frontend forms AND backend route inputs
- React Hook Form for all forms — no uncontrolled inputs
- Zustand for global UI state, React Query for server state
- shadcn/ui + Tailwind only. No inline styles, no CSS modules.
- All API calls go through /frontend/src/api/ — never fetch() in components

### Business Logic (Non-negotiable)
- GST calculated SERVER-SIDE only, never client-side
- HSN code REQUIRED on every line item before quote can be sent
- Quote → Invoice conversion ALWAYS requires a confirmation dialog
- All currency stored as integers (paise). Displayed as ₹ with Indian formatting.
- GSTIN validation regex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
- GST type: IGST if customer state ≠ seller state, else CGST+SGST (split 50/50)

### AI Extraction Rules
- Model: mixtral-8x7b-32768 on Groq
- ALWAYS return confidence score (0.0–1.0) per extracted field
- confidence < 0.8 → set needs_review: true, highlight yellow in UI
- NEVER auto-submit extracted data — always show editable preview first
- If OCR confidence < 0.5 for entire document → ask user to re-upload

### Atomic CRM
- Base URL: process.env.ATOMIC_CRM_BASE_URL
- ALL customer data from Atomic CRM — no local customer table
- Use /backend/src/services/atomic.ts wrapper exclusively
- Sync customer after every quote create/update

### Security
- JWT in httpOnly cookies ONLY — never localStorage
- All env vars in .env — never in code
- Rate limit: 100 req/15min on extract endpoint
- File uploads: max 10MB, accept jpg/png/pdf/xlsx only
- Sanitize all text inputs before sending to Groq

---

## ENVIRONMENT VARIABLES
```
# Atomic CRM
ATOMIC_CRM_BASE_URL=
ATOMIC_CRM_API_KEY=

# AI
GROQ_API_KEY=

# OCR Microservice
OCR_SERVICE_URL=http://localhost:8001

# WhatsApp
WATI_API_KEY=
WATI_PHONE_NUMBER=

# Auth
JWT_SECRET=
JWT_EXPIRY=7d

# Database (Prisma)
DATABASE_URL=

# App
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
```

---

## FILE NAMING CONVENTIONS
- Components: PascalCase → QuoteCard.tsx
- Hooks: camelCase with 'use' → useQuotes.ts
- Services: camelCase → atomic.ts
- Routes: camelCase → quoteRoutes.ts
- Types: PascalCase interface names → Quote, Invoice, Customer
- Constants: UPPER_SNAKE → GST_RATES

---

## AGENT INSTRUCTIONS

### RESEARCHER agent
- Write all findings to /docs/research/[topic].md
- Topics: atomic-crm-api, wati-webhooks, gst-hsn-rates, paddleocr-setup
- Always include working code examples
- Run in background — do not block builders

### BUILDER-FRONTEND agent
- Work exclusively in /frontend directory
- Run `npm run typecheck` before marking task done
- Run `npm run lint` before marking task done
- Never touch /backend or /ocr-service

### BUILDER-BACKEND agent
- Work exclusively in /backend directory
- Write unit test for every service function
- Run `npm run test` before marking task done
- Never touch /frontend

### BUILDER-OCR agent
- Work exclusively in /ocr-service directory
- Test with at least 3 sample images before done
- Must support both printed and handwritten Hindi+English text
- Return confidence scores for every extracted token

### REVIEWER agent
- READ-ONLY tool access only
- Review checklist (output to /docs/reviews/[feature].md):
  [ ] Types correct, no `any`
  [ ] Zod validation on all inputs
  [ ] GST calculation logic correct
  [ ] API contract matches frontend expectations
  [ ] No secrets in code
  [ ] Error handling covers edge cases
  [ ] Confirmation dialogs on destructive actions
  [ ] Indian number formatting correct

### TESTER agent
- Write tests alongside feature, not after
- Coverage target: 80% on services, 60% on routes
- Use vitest for frontend, jest + supertest for backend

---

## MVP FEATURE PRIORITY
1. Login/auth
2. Dashboard (stats + quick actions)
3. Manual quote creation with GST
4. Quote list + detail view
5. Quote → Invoice conversion (with confirmation)
6. Payment recording
7. Image/PDF scan + extraction
8. Quote-invoice matching engine
9. PDF generation + download
10. WhatsApp send
11. Customer sync from Atomic CRM
12. Reports

---

## DO NOT
- Do not use any external GST npm library — implement from scratch
- Do not call Atomic CRM APIs directly from routes — use the service wrapper
- Do not store auth tokens in localStorage or sessionStorage
- Do not skip confidence scores on OCR extraction
- Do not let agents work in each other's directories
- Do not merge without REVIEWER sign-off on Phase 2 onwards
