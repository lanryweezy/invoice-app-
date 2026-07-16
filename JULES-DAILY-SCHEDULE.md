# InvoiceApp Daily Jules Schedule

## How It Works
Each day, pick ONE theme from the rotation. Run 3-5 Jules agents on invoice-app with that theme. Merge or close all PRs before the next day.

## Daily Theme Rotation

### Monday — Tests (Forge)
```
Write unit tests for all untested functions in apps/web/services/ and apps/web/utils/.
Use Vitest + React Testing Library. Mock Firebase and external APIs.
Target: 80% coverage on business logic.
```

### Tuesday — Resilience (Flora)
```
Add error boundaries, retry logic, and loading states to all React components
in apps/web/components/. Handle: network failures, Firebase timeout, Paystack popup blocked.
Add offline detection with user-friendly messages.
```

### Wednesday — Security (Vault)
```
Audit Firebase Firestore security rules in firestore.rules.
Ensure users can only access their own data.
Add input validation on all form components.
Check: invoice isolation, client data access, payment data exposure.
```

### Thursday — Observability (Argus)
```
Add structured logging to all payment flows, email sends, and Pro upgrade attempts.
Log: userId, action, amount, currency, timestamp, success/failure.
Add Sentry breadcrumbs for user actions.
```

### Friday — Performance (Flora)
```
Optimize: lazy-load ClientPortalView, memoize expensive calculations,
compress PDF generation, virtualize invoice list for >50 items.
Measure and report bundle size reduction.
```

### Saturday — Content (Marketing)
```
Write 3 SEO-optimized blog posts for invoiceapp.ng/blog:
1. "How to Create Professional Invoices in Nigeria"
2. "Invoice App vs Traditional Methods"
3. "Why Nigerian SMEs Need Digital Invoicing"
Include keywords, meta descriptions, internal links.
```

### Sunday — Refactor (Mason)
```
Refactor apps/web/App.tsx: extract payment logic into usePayments hook,
email logic into useEmail hook, Pro gating into useProGate hook.
Remove dead code, fix TypeScript strict violations.
No new features.
```

## Commands to Run Jules
```bash
# From the invoice-app repo
gh issue create --title "[Jules] Monday: Tests" --body "$(cat jules-prompts/tests.md)" --label "jules"
# Or paste the theme prompt directly into Jules UI
```

## After Each Day
```bash
# Review overnight PRs
gh pr list --author lanryweezy --state open

# Merge passing ones
gh pr merge <number> --squash

# Close failures
gh pr close <number> --comment "CI failed, will retry tomorrow"
```
