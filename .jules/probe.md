## 2024-07-25 — New user signup: Turnstile and Firebase Network Mocks
**Learning:** For E2E testing authentication flows that rely on Cloudflare Turnstile and Firebase, we must mock `window.turnstile` to bypass the CAPTCHA before page load, and intercept `**/*.googleapis.com/**` to prevent the UI from throwing network errors for missing API keys.
**Root cause:** The `VITE_FIREBASE_API_KEY` and Turnstile secrets are mock values in CI. The app correctly blocks signup if `window.turnstile` fails or if Firebase returns a 400.
**Solution:** Added `page.addInitScript` to mock `window.turnstile.render`, and `page.route` to mock successful Firebase signup payloads (`identitytoolkit/signUp`, `firebaseinstallations`, etc.).
**Apply when:** Testing any auth flows (Signup, Login) or any action that calls Firebase (like database sync) where test credentials aren't available in the test runner.
