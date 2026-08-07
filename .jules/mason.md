## 2026-08-06 - Extracted Date Duplication
**Learning:** Found heavily duplicated inline date generation `new Date().toISOString().split('T')[0]` scattered across components.
**Action:** Created `getTodayISODate` in a shared util to enforce dry patterns.
## 2024-05-19 - Duplicate config registration in apps/cli/src/commands/config.ts and apps/cli/src/commands/auth.ts
**Learning:** `apps/cli/src/commands/config.ts` registers a standalone `config` command which does the exact same inquirer prompts as `apps/cli/src/commands/auth.ts` under the `auth config init` subcommand. There is duplication in config logic.
**Action:** The standalone `config` command should be removed entirely, or `auth config init` should be extracted and shared. However, `auth config init` has more fields (smtp). The `config` module is currently double registered (or rather, the same subcommand name logic exists in two files). Wait, actually `auth.ts` has `auth config init` and `config.ts` has `config`.
## 2024-05-19 - Duplicate client fetching logic in apps/cli/src/commands/client.ts
**Learning:** `apps/cli/src/commands/client.ts` duplicates the logic to fetch all clients and find one by name three times across `get`, `update`, and `delete` subcommands.
**Action:** Extract a helper function like `findClientByName(db, uid, name)` to consolidate the client search logic. Wait, this is a good refactor. It touches one file, reduces duplicated logic, and makes the code cleaner.

## 2024-05-19 - Duplicated unhandled exception catch blocks across CLI commands
**Learning:** `catch (error: any) { fail(...); console.error(error.message); process.exit(1); }` is duplicated across many CLI commands (`create.ts`, `get.ts`, `list.ts`, `pdf.ts`, `send.ts`).
**Action:** This could be abstracted but might be a bit larger/touch many files. Let's focus on `client.ts` first.
