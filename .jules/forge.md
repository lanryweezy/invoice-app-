## YYYY-MM-DD - [Testing the browser Notification API]
**Learning:** Testing logic that accesses browser APIs like `Notification` must account for environments where it is missing, such as headless or CI environments. Using a `typeof Notification !== 'undefined'` guard makes the code resilient, and `vi.stubGlobal('Notification', undefined)` allows testing this fallback without reference errors.
**Action:** Guarded `Notification` usage and added tests validating the error-free bypass when the API is unsupported.
