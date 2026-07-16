# Jules Task: Security Audit (Wednesday)

Audit and harden the InvoiceApp security.

## Files to Review
1. `firestore.rules` — verify all rules are restrictive
2. `components/InvoiceForm.tsx` — validate all inputs
3. `components/PaymentModal.tsx` — validate payment amounts
4. `services/firebase.ts` — check for exposed credentials
5. `context/AuthContext.tsx` — verify auth state handling

## Security Checks

### Firestore Rules (firestore.rules)
- [ ] Users can only read/write their own data: `allow read, write: if request.auth != null && request.auth.uid == resource.data.userId`
- [ ] Invoice numbers are unique per user
- [ ] Client data is isolated per user
- [ ] No public read access to any collection
- [ ] Payment data is never exposed in client-side rules

### Input Validation
Add to all form components:
- [ ] Invoice amounts: positive numbers only, max 10 digits
- [ ] Email validation: proper regex
- [ ] Phone numbers: Nigerian format (+234...)
- [ ] Names: no script tags, no special characters
- [ ] Dates: valid format, not in the past for due dates

### Sensitive Data
- [ ] No API keys in client-side code
- [ ] No passwords in Firestore
- [ ] No bank account numbers in URL parameters
- [ ] Paystack keys are publishable (not secret)

### Auth
- [ ] Token expiration handling
- [ ] Session timeout after inactivity
- [ ] No hardcoded credentials

## Output
Create a SECURITY-AUDIT.md with:
- Findings (what you found)
- Fixes applied (what you changed)
- Remaining risks (what needs manual review)
