## 2024-03-24 - Frontend Telemetry Isolation
**Learning:** In the frontend React application (`apps/web`), calls to `trackEvent` for analytics tracking must be resilient to prevent telemetry failures from breaking core application logic.
**Action:** When adding observability telemetry using `trackEvent` in the frontend code, always wrap the invocation in an empty `try/catch` block (e.g., `try { trackEvent(...) } catch {}`) to swallow telemetry errors and preserve the control flow.
