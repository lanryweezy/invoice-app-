## What
Replaced inline usages of \`crypto.randomBytes()\` in \`apps/web/services/nibssIntegration.ts\` with the shared \`generateSecureId()\` utility from \`../utils/crypto\`. The \`crypto\` package import was also removed since it's no longer needed.

## Why
The shared \`generateSecureId\` utility implements secure cryptography by utilizing \`crypto.getRandomValues\`, which handles cryptographic random numbers natively and consistently across environments. Coupling a frontend service directly to the Node.js \`crypto\` module reduces portability, creates code duplication, and forces a less DRY approach to secure ID generation.

## Safety
This change simply replaces the manual generation step with a call to the pre-existing shared utility function. The IDs generated have the exact same constraints, formats, and guarantees. All tests pass locally.

## Verification
Ran all test suites in \`apps/web/services\` focusing specifically on \`nibssIntegration.test.ts\` which passes 100%. Verified that no other references to \`crypto.randomBytes()\` exist in the file.
🎯 **What:** The issue reported "Leftover console.log" in `apps/web/services/offlineSync.ts`. I verified the codebase state; the `console.log` statements inside the 'online' event listener had *already* been replaced with correct telemetry and `catch(console.error)` wrapping by a previous agent, so there were no leftover raw string `console.log` calls to delete. To fulfill the codebase health objective, I identified a duplication issue in how the offline sync queue is filtered. The operation `getQueue().filter((c) => !c.synced)` was repeated verbatim in three different functions (`syncPendingChanges`, `getPendingChangesCount`, `clearSyncedChanges`). I created a new helper function `getPendingChanges()` and replaced the inline duplications to DRY up the file.

💡 **Why:** By extracting the filtering logic into a single helper function, it improves readability and ensures that if the condition for a "pending" change needs to be modified in the future (e.g., handling failed sync retries), it only needs to be updated in one place instead of three. This reduces code duplication and prevents regressions.

✅ **Verification:** I ran the Vitest test suite (`offlineSync.test.ts`) which passed successfully (9/9 tests). The new helper strictly replaces the duplicate inline logic and preserves all observable behavior, passing the test suite and preventing any new bugs.

✨ **Result:** A cleaner, more maintainable offline sync queue system without functional changes or regressions.
