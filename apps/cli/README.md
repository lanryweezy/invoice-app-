# InvoiceApp CLI

Create and manage invoices from your terminal.

## Install

```bash
npm install -g @invoiceapp/cli
```

## Installation

```bash
npm install -g @invoiceapp/cli
```

Or from source:

```bash
git clone https://github.com/your-repo/invoice-app.git
cd invoice-app/apps/cli
npm install && npm run build
npm link
```

## Quick Start

1. `invoiceapp auth login --token <your-token>`
2. `invoiceapp config init` — setup business details
3. `invoiceapp create --client "John Doe" --items "Design:20000,Dev:30000" --due-date 2026-08-15`
4. `invoiceapp send INV-2026-07-0001 --email john@example.com`

## Commands

### Authentication

| Command | Description |
|---------|-------------|
| `auth login --token <token>` | Login with an API token. If omitted, prompted interactively. |
| `auth logout` | Logout and clear credentials. |
| `auth status` | Show current auth status and business info. |

### Configuration

| Command | Description |
|---------|-------------|
| `config init` | Interactive setup wizard for business details, bank info, and SMTP. |
| `config get` | View current config as JSON (SMTP password masked). |
| `config set <key> <value>` | Set a config value using dot notation (e.g. `branding.primaryColor`). |

### Invoices

| Command | Description |
|---------|-------------|
| `create` | Create a new invoice (starts in Draft status). |
| `list` | List invoices with filters. |
| `get <number>` | View details of a specific invoice. |
| `send <number>` | Send an invoice via email and update status to Sent. |
| `pdf <number>` | Generate a PDF file for an invoice. |

#### `create` flags

| Flag | Description | Default |
|------|-------------|---------|
| `-c, --client <name>` | Client name | (prompted) |
| `-a, --amount <amount>` | Total amount (used when no `--items`) | (prompted) |
| `-i, --items <items>` | Line items as `desc:amount,...` | — |
| `--currency <currency>` | Currency code | `NGN` |
| `-d, --due-date <date>` | Due date (YYYY-MM-DD) | +30 days |
| `-n, --notes <notes>` | Invoice notes | — |
| `--tax-rate <rate>` | VAT rate (%) | `7.5` |
| `--wht-rate <rate>` | Withholding tax rate (%) | `0` |
| `--discount <amount>` | Discount value | `0` |
| `--discount-type <type>` | Discount type: `percentage` or `fixed` | `percentage` |

#### `list` flags

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --status <status>` | Filter by status: Draft, Sent, Paid, Overdue | — |
| `--from <date>` | Start date filter (YYYY-MM-DD) | — |
| `--to <date>` | End date filter (YYYY-MM-DD) | — |
| `--client <name>` | Filter by client name (partial match) | — |
| `-l, --limit <number>` | Max results | `20` |
| `-f, --format <format>` | Output format: `table`, `json`, or `csv` | `table` |
| `--sort <field>` | Sort by: `date`, `amount`, or `status` | `date` |

#### `get` flags

| Flag | Description |
|------|-------------|
| `-j, --json` | Output as raw JSON |

#### `send` flags

| Flag | Description | Default |
|------|-------------|---------|
| `-e, --email <email>` | Recipient email | client email from invoice |
| `-t, --template <template>` | Email template: `formal`, `casual`, `followup`, `overdue` | `formal` |
| `-s, --subject <subject>` | Subject line override | auto-generated |

#### `pdf` flags

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output <directory>` | Output directory | `./` |
| `-t, --template <template>` | PDF template: `formal`, `modern`, `minimalist` | `formal` |
| `-l, --logo <path>` | Path to logo file (PNG, JPG, SVG) | config default logo |

### Clients

| Command | Description |
|---------|-------------|
| `client add` | Add a new client. |
| `client list` | List all clients. |
| `client get <name>` | View client details. |
| `client update <name>` | Update a client's info. |
| `client delete <name>` | Delete a client (with confirmation). |

#### `client add` flags

| Flag | Description |
|------|-------------|
| `-n, --name <name>` | Client name |
| `-e, --email <email>` | Client email |
| `-p, --phone <phone>` | Client phone |
| `-a, --address <address>` | Client address |
| `--tin <tin>` | Tax Identification Number |
| `--cac <cac>` | CAC registration number |

#### `client update` flags

| Flag | Description |
|------|-------------|
| `-e, --email <email>` | New email |
| `-p, --phone <phone>` | New phone |
| `-a, --address <address>` | New address |

### Logos

| Command | Description |
|---------|-------------|
| `logo upload <file-path>` | Upload a logo (PNG, JPG, SVG; max 5 MB). First upload is set as default. |
| `logo list` | List all uploaded logos. |
| `logo set-default <name>` | Set a logo as the default for PDFs. |
| `logo remove <name>` | Remove a logo (with confirmation). |
| `logo preview` | Show the URL of the current default logo. |

#### `logo upload` flags

| Flag | Description |
|------|-------------|
| `-n, --name <name>` | Custom logo name (defaults to filename) |

### Reports

| Command | Description |
|---------|-------------|
| `tax-report` | Generate a tax report showing VAT, WHT, and stamp duty breakdown. |
| `export` | Export invoices to CSV or JSON. |

#### `tax-report` flags

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --month <month>` | Month (1–12 or name like `july`) | — |
| `-y, --year <year>` | Year | current year |
| `--from <date>` | Custom start date (YYYY-MM-DD) | — |
| `--to <date>` | Custom end date (YYYY-MM-DD) | — |
| `-f, --format <format>` | Output format: `table`, `csv`, `json` | `table` |
| `-o, --output <path>` | Write to file instead of stdout | — |

#### `export` flags

| Flag | Description |
|------|-------------|
| `--from <date>` | Start date filter (YYYY-MM-DD) |
| `--to <date>` | End date filter (YYYY-MM-DD) |
| `--status <status>` | Filter by invoice status |
| `--client <name>` | Filter by client name |
| `--min-amount <amount>` | Minimum total amount |
| `--max-amount <amount>` | Maximum total amount |
| `-f, --format <format>` | Output format: `csv` or `json` |
| `-o, --output <path>` | Output file path (**required**) |

### Automation

| Command | Description |
|---------|-------------|
| `batch-send` | Send all invoices matching a status (with rate limiting at 10/min). |
| `recurring add` | Create a recurring invoice schedule. |
| `recurring list` | List all recurring invoice schedules. |
| `recurring pause <id>` | Pause a recurring schedule. |
| `recurring resume <id>` | Resume a paused recurring schedule. |
| `recurring delete <id>` | Delete a recurring schedule (with confirmation). |

#### `batch-send` flags

| Flag | Description | Default |
|------|-------------|---------|
| `--status <status>` | Invoice status to send: `Sent` or `Overdue` (**required**) |
| `-t, --template <template>` | Email template: `formal`, `followup`, `overdue` | `followup` |
| `--dry-run` | Preview invoices without sending | `false` |

#### `recurring add` flags

| Flag | Description |
|------|-------------|
| `-c, --client <client>` | Client name |
| `-a, --amount <amount>` | Invoice amount |
| `-i, --items <items>` | Line items (`description:amount,...`) |
| `--interval <interval>` | Frequency: `weekly`, `monthly`, `quarterly`, `yearly` |
| `-d, --day <day>` | Day of month/week |
| `-s, --start <date>` | Start date (YYYY-MM-DD) |

## Configuration

Configuration is stored at `~/.invoiceapp/config.json`:

```json
{
  "userId": "firebase-uid",
  "email": "you@example.com",
  "idToken": "auth-token",
  "businessName": "Your Business",
  "businessAddress": "123 Street, Lagos",
  "businessPhone": "+234 801 234 5678",
  "bankName": "GTBank",
  "bankAccount": "0123456789",
  "bankSortCode": "058",
  "defaultCurrency": "NGN",
  "defaultVatRate": 7.5,
  "branding": {
    "defaultLogo": "https://storage.example.com/logo.png",
    "logoPosition": "top-left",
    "primaryColor": "#2c3e50",
    "invoiceTitle": "INVOICE",
    "footerText": "Thank you for your business!"
  },
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "you@gmail.com",
    "pass": "app-password",
    "secure": false
  }
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Path to Firebase service account JSON file |
| `FIREBASE_API_KEY` | Firebase Web API key |

## Examples

### Quick invoice creation

```bash
invoiceapp create \
  --client "Acme Corp" \
  --items "Consulting:150000,Development:350000" \
  --tax-rate 7.5 \
  --due-date 2026-08-15 \
  --notes "Net 30 payment terms"
```

### Batch send overdue invoices

```bash
# Preview first
invoiceapp batch-send --status Overdue --dry-run

# Send all overdue with overdue template
invoiceapp batch-send --status Overdue --template overdue
```

### Monthly tax report

```bash
# July 2026 tax report as CSV
invoiceapp tax-report --month july --year 2026 --format csv --output july-tax.csv
```

### Setup with logo

```bash
# Upload and set a logo
invoiceapp logo upload ./assets/logo.png --name "Company Logo"

# Create invoice with logo in PDF
invoiceapp pdf INV-2026-07-0001 --template modern --output ./invoices/
```

## License

MIT
