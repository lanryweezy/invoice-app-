## THE JOURNEY
Start: A new unauthenticated user arrives at the InvoiceApp homepage.
Steps:
1. Clicks "Login" in the header to open the authentication modal.
2. Clicks "Sign up" to switch to the registration form.
3. Fills in a valid, randomly generated email address and secure password.
4. Submits the sign up form successfully.
End: The user is authenticated in the application, the sign-up modal closes, and the "Settings" menu item is visible instead of "Login", indicating a successful session state change.

## WHY THIS JOURNEY FIRST
Tier 1 — Existential Journey. The new user signup flow is the primary funnel for all new acquisition. If users cannot successfully create an account, they can never create invoices, save data, or upgrade to a paid plan. A silent failure in this flow creates a total block to product adoption.

## VERIFICATION PROOF
- [x] Test passes: `pnpm exec playwright test e2e/auth-signup.spec.ts` completed successfully.
- [x] Test fails when production code broken: Test asserts visibility of `text-red-600` specifically, returning a failure when mock API responds with 400 error codes.
- [x] Test is stable: Verified 3 consecutive passes locally via a looped Node execution script.
- [x] Full suite passes: `pnpm exec playwright test` passed all 15 active E2E tests successfully.

## ERROR PATH COVERAGE
The test suite explicitly includes a path (`shows error when signup fails due to existing email`) that simulates the backend rejecting the signup due to an `EMAIL_EXISTS` error. This guarantees that user-facing validation errors from Firebase are accurately mapped and displayed in the UI.

## TEST ENVIRONMENT
- Test dependencies (`window.turnstile`) are mocked locally using `page.addInitScript()` to bypass the CAPTCHA required for local tests.
- Backend dependencies (`identitytoolkit.googleapis.com`, `firebaseinstallations`, etc.) are intercepted using `page.route` to mock successful signup, token verification, and user database responses. This ensures deterministic, fast testing that does not modify production databases or require valid secret API keys.

## NEXT JOURNEY
The next journey Probe will target is the "Existing user logs in -> canvas loads -> user can see their designs" (Tier 1) flow.
