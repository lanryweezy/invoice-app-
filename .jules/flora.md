## 2026-07-10 - Missing Fetch Timeout Cascading to Hang
**Learning:** External fetch calls without timeouts (like the one to api.exchangerate-api.com in exchangeRates.ts) will block execution indefinitely if the service goes unresponsive or drops packets. A hanging fetch will cause the app to wait forever instead of returning the designed fallback data, effectively breaking features that rely on it (like currency conversion) and creating silent UX hangs.
**Action:** Always wrap native fetch calls to third-party services with an `AbortController` and a `setTimeout`, ensuring the timeout is cleared in a `finally` block and errors are explicitly handled or degraded gracefully.
## 2026-07-12 - Missing timeout in core NRS API wrapper
**Learning:** The central apiRequest fetch wrapper in apiConfig.ts lacked a timeout, meaning any latency from the NRS API would cause the entire application to hang indefinitely. Added AbortController to contain failure.
**Action:** Always wrap external fetch calls with an AbortController timeout to ensure graceful degradation when services hang.
