## What
Replaced inline usages of \`crypto.randomBytes()\` in \`apps/web/services/nibssIntegration.ts\` with the shared \`generateSecureId()\` utility from \`../utils/crypto\`. The \`crypto\` package import was also removed since it's no longer needed.

## Why
The shared \`generateSecureId\` utility implements secure cryptography by utilizing \`crypto.getRandomValues\`, which handles cryptographic random numbers natively and consistently across environments. Coupling a frontend service directly to the Node.js \`crypto\` module reduces portability, creates code duplication, and forces a less DRY approach to secure ID generation.

## Safety
This change simply replaces the manual generation step with a call to the pre-existing shared utility function. The IDs generated have the exact same constraints, formats, and guarantees. All tests pass locally.

## Verification
Ran all test suites in \`apps/web/services\` focusing specifically on \`nibssIntegration.test.ts\` which passes 100%. Verified that no other references to \`crypto.randomBytes()\` exist in the file.
