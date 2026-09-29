# INVOICEAPP.NG - Webhook System

## Architecture
Never trust webhooks blindly. Every webhook must be:
1. Verified (via signature).
2. Stored (for audit/replay).
3. Idempotently processed.

## Pipeline
1. `POST /api/webhooks/paystack`
2. **Verify**: Check `x-paystack-signature` against secret.
3. **Store**: Save to `WebhookEvents` collection (`eventId`, `provider`, `payload`, `status: 'pending'`).
4. **Idempotency**: Attempt to run a transaction. If `eventId` already processed, skip.
5. **Process**: Fetch corresponding Invoice. Call provider verification API (`verifyTransaction`). Update Invoice state.
6. **Domain Event**: Emit `payment.success`.
7. **Audit**: Log completion.

## Failure Handling
- Unrecognized events are logged and ignored.
- Failed processing marks `WebhookEvents.status = 'failed'` for later manual/automated retry.
