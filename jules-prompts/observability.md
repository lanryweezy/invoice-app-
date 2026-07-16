# Jules Task: Observability (Thursday)

Add logging, error tracking, and analytics to InvoiceApp.

## Files to Modify
1. `services/firebase.ts` — add Firestore operation logging
2. `components/PaymentModal.tsx` — log payment attempts
3. `components/App.tsx` — log user actions
4. `utils/emailGenerator.ts` — log email generation
5. `context/AuthContext.tsx` — log auth events

## What to Add

### Structured Logging
Create `utils/logger.ts`:
```typescript
export function logAction(action: string, data: Record<string, any>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    ...data
  }));
}
```

### Payment Logging
In PaymentModal.tsx, log:
- `payment_initiated` — {userId, amount, currency, gateway}
- `payment_success` — {userId, amount, reference}
- `payment_failed` — {userId, amount, error}
- `payment_cancelled` — {userId, amount}

### User Action Logging
In App.tsx, log:
- `invoice_created` — {userId, invoiceNumber, amount}
- `invoice_sent` — {userId, invoiceNumber, recipient}
- `invoice_viewed` — {userId, invoiceNumber}
- `pro_upgraded` — {userId, plan}

### Auth Logging
In AuthContext.tsx, log:
- `user_login` — {userId, method}
- `user_logout` — {userId}
- `auth_error` — {error, context}

### Error Tracking
Wrap critical operations in try/catch with:
- Error message
- Stack trace (in development)
- User context (userId, action)
- Send to console.error for now (Sentry integration later)

## Rules
- Never log sensitive data (passwords, tokens, bank details)
- Use JSON format for all logs
- Include timestamp in every log
- Log both success and failure for important actions
