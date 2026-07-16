# Jules Task: Build InvoiceApp CLI

## Overview
Build a command-line interface for InvoiceApp.ng that lets users create, send, manage invoices, and generate reports directly from the terminal. The CLI should reuse existing services from `apps/web/services/`.

## Project Structure
Create `apps/cli/` as a new workspace in the monorepo.

```
apps/cli/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Entry point, CLI registration
│   ├── commands/
│   │   ├── auth.ts           # Login/logout/status
│   │   ├── create.ts         # Create invoice
│   │   ├── send.ts           # Send invoice via email
│   │   ├── list.ts           # List invoices with filters
│   │   ├── get.ts            # Get single invoice details
│   │   ├── pdf.ts            # Generate PDF
│   │   ├── client.ts         # Client CRUD
│   │   ├── tax-report.ts     # Tax report generation
│   │   ├── export.ts         # Export invoices to CSV
│   │   ├── batch.ts          # Batch operations
│   │   └── recurring.ts      # Recurring invoice setup
│   ├── lib/
│   │   ├── firebase-client.ts    # Firebase Admin SDK setup
│   │   ├── auth.ts               # Auth token management
│   │   ├── invoice-builder.ts    # Invoice creation logic
│   │   ├── email-sender.ts       # Email via SMTP
│   │   ├── pdf-generator.ts      # PDF generation
│   │   ├── logo-manager.ts       # Logo upload/resize/storage
│   │   ├── tax-calculator.ts     # Tax/VAT/WHT calculations
│   │   └── config.ts             # Config file management (~/.invoiceapp/config.json)
│   └── utils/
│       ├── formatter.ts          # Currency, date formatting
│       ├── table.ts              # Terminal table output
│       └── spinner.ts            # Loading indicators
└── README.md
```

## Tech Stack
- **oclif** (by Salesforce) — CLI framework with auto-generated help, TypeScript support
- **Firebase Admin SDK** — server-side Firestore access
- **nodemailer** — email sending (reuse SMTP config from web app)
- **pdfkit** or **@react-pdf/renderer** — PDF generation
- **cli-table3** — terminal table output
- **ora** — terminal spinners
- **chalk** — colored output
- **inquirer** — interactive prompts when flags not provided

## Commands to Implement

### 1. `invoiceapp login`
- Opens browser for Firebase auth OR accepts `--token` flag
- Stores auth token in `~/.invoiceapp/config.json`
- `invoiceapp logout` clears config
- `invoiceapp status` shows logged-in user

### 2. `invoiceapp create`
```
invoiceapp create \
  --client "John Doe" \
  --amount 50000 \
  --items "Design:20000,Development:30000" \
  --currency NGN \
  --due-date 2026-08-15 \
  --notes "Thank you for your business" \
  --vat 7.5
```
- Auto-generates invoice number (INV-YYYY-MM-NNNN sequence)
- Saves to Firestore `users/{uid}/invoices/{invoiceId}`
- Outputs: invoice ID, total with tax, due date
- Interactive mode if flags missing (prompts for each field)

### 3. `invoiceapp send`
```
invoiceapp send INV-2026-07-0042 \
  --email john@example.com \
  --template formal \
  --subject "Invoice from Your Business"
```
- Generates PDF, attaches to email
- Uses SMTP settings from Firestore user config
- 4 templates: formal, casual, follow-up, overdue
- Updates invoice status to "sent" in Firestore

### 4. `invoiceapp list`
```
invoiceapp list \
  --status unpaid \
  --from 2026-07-01 \
  --to 2026-07-31 \
  --client "John Doe" \
  --limit 20 \
  --format table
```
- Output formats: table (default), json, csv
- Sort by: date, amount, status
- Shows: invoice #, client, amount, status, due date

### 5. `invoiceapp get`
```
invoiceapp get INV-2026-07-0042
```
- Full invoice details: items, amounts, tax, payments, history
- `--json` flag for machine-readable output

### 6. `invoiceapp pdf`
```
invoiceapp pdf INV-2026-07-0042 \
  --output ./invoices/ \
  --template formal \
  --logo ./logo.png
```
- Generates branded PDF with bank details, QR code, company logo
- Uses default logo from `invoiceapp logo set-default` if no `--logo` flag
- Logo appears top-left of invoice, max 150px width in PDF
- Reuse logic from web app's PDF generation

### 7. `invoiceapp client`
```
invoiceapp client add --name "Acme Corp" --email accounts@acme.com --phone "+2348012345678"
invoiceapp client list
invoiceapp client get "Acme Corp"
invoiceapp client update "Acme Corp" --email new@acme.com
invoiceapp client delete "Acme Corp"
```
- Stored in Firestore `users/{uid}/clients/{clientId}`
- Search by name, email, phone

### 8. `invoiceapp tax-report`
```
invoiceapp tax-report \
  --month july \
  --year 2026 \
  --format csv \
  --output tax-report-july.csv
```
- Calculates: total revenue, VAT collected (7.5%), WHT deducted, net income
- Output formats: table, csv, json
- Group by: day, week, month

### 9. `invoiceapp export`
```
invoiceapp export \
  --from 2026-01-01 \
  --to 2026-07-31 \
  --format csv \
  --output invoices-export.csv
```
- Export all invoices with full details
- Filters: date range, status, client, amount range

### 10. `invoiceapp batch-send`
```
invoiceapp batch-send \
  --status overdue \
  --template overdue \
  --dry-run
```
- Send invoices in bulk
- `--dry-run` previews what would be sent
- Progress bar with success/failure count
- Rate limiting (max 10 emails/minute)

### 11. `invoiceapp logo`
```
invoiceapp logo upload ./my-logo.png
invoiceapp logo upload ./my-logo.svg --name "Primary Logo"
invoiceapp logo list
invoiceapp logo set-default "Primary Logo"
invoiceapp logo remove "Primary Logo"
invoiceapp logo preview
```
- Upload PNG, SVG, JPG (max 5MB)
- Stored in Firebase Storage: `users/{uid}/logos/{logoId}`
- Firestore metadata: `users/{uid}/branding/logos[]` — name, url, isDefault, uploadedAt
- Only one logo marked as `isDefault` — used on all PDFs unless overridden
- `invoiceapp logo preview` shows current default logo in terminal (ASCII art for PNG, inline for SVG)
- Resize to max 800px width on upload (use sharp)
- Auto-generate thumbnails for email signatures
- `--name` flag for multiple logos (e.g., "Primary Logo", "Dark Mode Logo", "Email Signature")

### 12. `invoiceapp recurring`
```
invoiceapp recurring add \
  --client "John Doe" \
  --amount 50000 \
  --items "Monthly retainer" \
  --interval monthly \
  --day 1 \
  --start 2026-08-01
```
- Stores recurring schedule in Firestore
- Note: actual scheduling needs a server-side cron or Firebase Scheduled Function
- CLI stores the intent; web app or cloud function executes

## Config File (~/.invoiceapp/config.json)
```json
{
  "userId": "firebase-uid",
  "email": "user@example.com",
  "businessName": "My Business",
  "businessAddress": "123 Lagos, Nigeria",
  "businessPhone": "+2348012345678",
  "bankName": "GTBank",
  "bankAccount": "0123456789",
  "bankSortCode": "058",
  "defaultCurrency": "NGN",
  "defaultVatRate": 7.5,
  "branding": {
    "defaultLogo": "https://storage.invoiceapp.ng/logos/{uid}/primary.png",
    "logoPosition": "top-left",
    "primaryColor": "#00B8B8",
    "invoiceTitle": "INVOICE",
    "footerText": "Thank you for your business"
  },
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "user@gmail.com",
    "pass": "app-password"
  }
}
```
- Run `invoiceapp config set bankName GTBank` to update
- Run `invoiceapp config get` to view all
- Run `invoiceapp config init` for first-time setup wizard

## Shared Code with Web App
Reuse logic from these existing files:
- `apps/web/services/firebase.ts` → Firebase config and initialization
- `apps/web/services/taxCalculator.ts` → VAT/WHT calculations
- `apps/web/services/qrCodeGenerator.ts` → QR code generation
- `apps/web/services/emailGenerator.ts` → Email template generation
- `apps/web/utils/` → Currency formatting, date helpers

Copy the logic (don't import from web app — CLI runs in Node, not browser). Adapt Firebase Admin SDK calls where needed.

## Important Rules
1. Do NOT modify any existing files in `apps/web/` or `apps/marketing/`
2. Use `apps/cli/` as an isolated workspace
3. Add `"apps/cli"` to `pnpm-workspace.yaml`
4. All Firestore writes must include `createdAt` and `updatedAt` timestamps
5. All amounts stored as numbers (kobo) internally, display as Naira with ₦ symbol
6. Invoice numbers must be sequential: INV-YYYY-MM-NNNN
7. Never log or display sensitive data (bank passwords, SMTP passwords)
8. All error messages must be user-friendly, not stack traces

## Package.json for CLI
```json
{
  "name": "@invoiceapp/cli",
  "version": "1.0.0",
  "description": "InvoiceApp CLI - Create and manage invoices from your terminal",
  "main": "dist/index.js",
  "bin": {
    "invoiceapp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "oclif": "^4.0.0",
    "firebase-admin": "^12.0.0",
    "nodemailer": "^6.9.0",
    "pdfkit": "^0.15.0",
    "cli-table3": "^0.6.0",
    "ora": "^5.4.0",
    "chalk": "^4.1.2",
    "inquirer": "^9.0.0",
    "qrcode": "^1.5.0",
    "sharp": "^0.33.0",
    "firebase-storage": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "~5.8.3",
    "ts-node": "^10.9.0",
    "vitest": "^3.0.0",
    "@types/node": "^22.0.0",
    "@types/nodemailer": "^6.4.0",
    "@types/inquirer": "^9.0.0"
  }
}
```

## Build Order
1. Scaffold project + config + auth
2. Logo upload + management
3. Create + list + get commands
4. Send command + email integration
5. PDF generation (with logo)
6. Client CRUD
7. Tax report + export
8. Batch operations + recurring
9. Tests for all commands
10. README with install + usage instructions

## Success Criteria
- `pnpm install && pnpm build` works clean
- `invoiceapp login` authenticates via Firebase
- `invoiceapp create` saves invoice to Firestore
- `invoiceapp list` shows invoices in terminal table
- `invoiceapp send` delivers email with PDF attachment
- `invoiceapp pdf` generates branded invoice PDF
- `invoiceapp tax-report --month july --format csv` produces valid CSV
- `invoiceapp logo upload ./logo.png` stores logo in Firebase Storage
- `invoiceapp logo list` shows uploaded logos with default marked
- `invoiceapp pdf` with logo renders company logo on invoice
- All commands have `--help` output
- Zero TypeScript errors
