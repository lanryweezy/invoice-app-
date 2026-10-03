# INVOICEAPP.NG - Production Readiness Blockers

1. **Payment Provider Implementation**:
   - Paystack requires movement from client-side mocked MVP to secure server-side initialization and webhook verification.
2. **NRS Proxying**:
   - Client-side FIRS API calls must be migrated to a secure backend relay to protect secrets.
3. **Data Migrations**:
   - Introduce `BusinessProfile` separation from the base `User` entity to support multi-tenant structures before mass onboarding.
4. **Resilience**:
   - Retry logic and idempotent processing for Webhooks and FIRS transmission failures.
5. **Observability**:
   - Tie error tracking (Sentry) and Analytics into backend Firebase Functions.
