## 2026-08-06 - Added Max Retry Cap to Offline Sync
**Learning:** During network disruptions, offline queue flushes using Promise.allSettled can infinitely retry permanently failing mutations (e.g. malformed data or permission errors), causing retry storms that hammer the backend once connectivity is restored.
**Action:** Always constrain offline queues with a maximum attempt limit (e.g. 5) per item. Drop the item and log a specific telemetry event ('sync_item_dropped_max_retries') when the limit is reached instead of continuously trying.

## 2026-08-06 - Nodemailer SMTP Hangs
**Learning:** Default Nodemailer configurations do not have explicit connection or socket timeouts. If the external SMTP server hangs without closing the TCP connection, `transporter.sendMail()` can block indefinitely, causing the entire CLI batch processing process to freeze.
**Action:** Always pass explicit `connectionTimeout` (e.g., 10000ms) and `socketTimeout` (e.g., 15000ms) inside the `nodemailer.createTransport()` configuration block.

## 2026-08-08 - Floating Promises in State Setters
**Learning:** React state setter functions should ideally be pure, but existing codebase patterns invoke fire-and-forget asynchronous side effects (like `syncToCloud()`) directly inside `setState(prev => { ... })` callbacks. If these floating promises reject due to network issues or database errors, the rejections are unhandled and silently bypass standard React error boundaries.
**Action:** When working with legacy code that triggers asynchronous side effects from synchronous callbacks, ensure every promise has at minimum a `.catch(console.error)` or dedicated error handler attached at the call site.
