## 2026-07-10 - Missing Fetch Timeout Cascading to Hang
**Learning:** External fetch calls without timeouts (like the one to api.exchangerate-api.com in exchangeRates.ts) will block execution indefinitely if the service goes unresponsive or drops packets. A hanging fetch will cause the app to wait forever instead of returning the designed fallback data, effectively breaking features that rely on it (like currency conversion) and creating silent UX hangs.
**Action:** Always wrap native fetch calls to third-party services with an `AbortController` and a `setTimeout`, ensuring the timeout is cleared in a `finally` block and errors are explicitly handled or degraded gracefully.
## 2026-07-12 - Missing timeout in core NRS API wrapper
**Learning:** The central apiRequest fetch wrapper in apiConfig.ts lacked a timeout, meaning any latency from the NRS API would cause the entire application to hang indefinitely. Added AbortController to contain failure.
**Action:** Always wrap external fetch calls with an AbortController timeout to ensure graceful degradation when services hang.
## 2024-05-18 - Missing Timeouts on Native Fetch in External Service Clients
**Learning:** Native `fetch` calls without `AbortController` in client-side architectures like Vite SPAs do not have default timeouts. If the integrated API (like `rev360.nrs.gov.ng`) degrades or drops the connection silently, it causes indefinite blocking/hanging of UI workflows relying on those promises.
**Action:** Always wrap native `fetch` calls to third-party endpoints with an `AbortController`-based timeout mechanism, and ensure the fallback path safely catches `AbortError` or treats timeout failures gracefully according to the existing retry/fallback strategy of the module.
## 2026-07-19 - Unhandled Promises in setTimeout Callbacks
**Learning:** When executing async database calls (e.g., Firestore `updateDoc`) inside `setTimeout` within a React component (like in `IntegrationsView.tsx`), unhandled rejections bypass standard promise chains and React error boundaries. This can leave UI state (like `setConnectingId(null)`) permanently stuck if the operation fails.
**Action:** Always wrap async operations inside `setTimeout` or event listeners with `try/catch/finally` blocks to ensure errors are caught and UI state is deterministically reset in the `finally` block.
